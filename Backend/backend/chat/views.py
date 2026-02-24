import os
import json
from pathlib import Path
from datetime import datetime

from django.contrib.auth import authenticate, get_user_model, login, logout, update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import connection
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser

from .ai_engine.llm_engine import generate_ai_response
from .ai_engine import llm_engine
from .api_utils import api_error, api_success
from .document_parser import parse_uploaded_attachments, persist_ocr_debug_output
from .google_auth import GoogleTokenError, verify_google_id_token
from .models import AdminAuditLog, ChatMessage, ChatSession, MedicalDataVersion, MedicalReportAnalysis, UserProfile

User = get_user_model()
ALLOWED_THEMES = {"light", "dark"}
MEDICAL_DATA_PATH = Path(__file__).resolve().parent / "data" / "medical_data.json"


def _derive_title_from_text(text, max_length=80):
    cleaned = " ".join((text or "").split()).strip()
    if not cleaned:
        return ""
    if len(cleaned) <= max_length:
        return cleaned
    return f"{cleaned[: max_length - 3].rstrip()}..."


def _get_or_create_profile(user):
    profile, _ = UserProfile.objects.get_or_create(user=user)
    return profile


def _normalize_theme(value):
    return value if value in ALLOWED_THEMES else "light"


def _public_profile(user):
    profile = _get_or_create_profile(user)
    full_name = f"{user.first_name} {user.last_name}".strip()
    return {
        "name": full_name or user.username,
        "email": user.email,
        "birth_date": profile.birth_date.isoformat() if profile.birth_date else None,
        "gender": profile.gender,
        "date_created": user.date_joined.isoformat() if user.date_joined else None,
        "preferred_theme": _normalize_theme(profile.preferred_theme),
    }


def _public_user(user):
    profile = _get_or_create_profile(user)
    full_name = f"{user.first_name} {user.last_name}".strip()
    return {
        "id": user.id,
        "email": user.email,
        "name": full_name or user.username,
        "is_verified": user.is_active,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "is_admin": bool(user.is_staff or user.is_superuser),
        "preferred_theme": _normalize_theme(profile.preferred_theme),
    }


def _admin_user_payload(user):
    profile = _get_or_create_profile(user)
    full_name = f"{user.first_name} {user.last_name}".strip()
    return {
        "id": user.id,
        "name": full_name or user.username,
        "email": user.email,
        "is_active": user.is_active,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "date_joined": user.date_joined.isoformat() if user.date_joined else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "birth_date": profile.birth_date.isoformat() if profile.birth_date else None,
        "gender": profile.gender,
        "session_count": getattr(user, "session_count", 0),
        "message_count": getattr(user, "message_count", 0),
        "preferred_theme": _normalize_theme(profile.preferred_theme),
        "is_last_active_admin": False,
    }


def _coerce_optional_bool(value):
    if value is None:
        return None
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        normalized = value.strip().lower()
        if normalized in {"true", "1", "yes"}:
            return True
        if normalized in {"false", "0", "no"}:
            return False
    return None


def _parse_pagination_params(request):
    try:
        page = max(int(request.query_params.get("page", 1)), 1)
    except ValueError:
        page = 1
    try:
        page_size = int(request.query_params.get("page_size", 20))
    except ValueError:
        page_size = 20
    page_size = max(min(page_size, 100), 1)
    offset = (page - 1) * page_size
    return page, page_size, offset


def _log_admin_action(actor, action, entity_type="", entity_id="", details=None):
    try:
        AdminAuditLog.objects.create(
            actor=actor if getattr(actor, "is_authenticated", False) else None,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id or ""),
            details=details or {},
        )
    except Exception:
        # Never break main flow because logging fails.
        pass


def _analyze_report_text_with_model(extracted_text: str) -> str:
    completion = llm_engine.client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "system",
                "content": """
You are a medical report analysis assistant.
Provide concise, structured output with sections:
1) Key Findings
2) Potential Concerns
3) Suggested Follow-up Questions for Doctor
4) Lifestyle/Monitoring Suggestions
5) Safety Note

Rules:
- Do not give final diagnosis.
- If data is unclear, say what is missing.
- Keep output patient-friendly.
""",
            },
            {"role": "user", "content": f"Analyze this medical report text:\n\n{extracted_text}"},
        ],
        temperature=0.2,
        max_completion_tokens=600,
        top_p=1,
    )
    return (completion.choices[0].message.content or "").strip()


def _public_report_payload(report):
    return {
        "id": report.id,
        "title": report.title or f"Report {report.id}",
        "file_names": report.file_names or [],
        "analysis": report.analysis or "",
        "warnings": report.warnings or [],
        "created_at": report.created_at.isoformat() if report.created_at else None,
    }


@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_api(request):
    return api_success(message="CSRF cookie set.")


@api_view(["POST"])
@permission_classes([AllowAny])
def register_api(request):
    try:
        name = (request.data.get("name") or "").strip()
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        confirm_password = request.data.get("confirm_password") or ""

        errors = {}
        if not name:
            errors["name"] = "Name is required."
        if not email:
            errors["email"] = "Email is required."
        else:
            try:
                validate_email(email)
            except ValidationError:
                errors["email"] = "Enter a valid email address."
        if not password:
            errors["password"] = "Password is required."
        if password and password != confirm_password:
            errors["confirm_password"] = "Passwords do not match."

        if User.objects.filter(email__iexact=email).exists():
            errors["email"] = "An account with this email already exists."

        if password:
            try:
                validate_password(password)
            except ValidationError as exc:
                errors["password"] = " ".join(exc.messages)

        if errors:
            return api_error(message="Validation failed.", errors=errors, status=400, code="VALIDATION_ERROR")

        first_name, _, last_name = name.partition(" ")
        user = User.objects.create_user(
            username=email,
            email=email,
            first_name=first_name.strip(),
            last_name=last_name.strip(),
            is_active=True,
        )
        user.set_password(password)
        user.save()
        _get_or_create_profile(user)

        return api_success(
            data={"email": user.email},
            message="Registration successful.",
            status=201,
        )
    except Exception:
        return api_error(message="Registration failed due to a server error.", status=500, code="SERVER_ERROR")


@api_view(["POST"])
@permission_classes([AllowAny])
def login_api(request):
    try:
        email = (request.data.get("email") or "").strip().lower()
        password = request.data.get("password") or ""
        if not email or not password:
            return api_error(message="Email and password are required.", status=400, code="VALIDATION_ERROR")

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return api_error(message="Invalid email or password.", status=401, code="INVALID_CREDENTIALS")
        authed_user = authenticate(request, username=user.username, password=password)
        if not authed_user:
            return api_error(message="Invalid email or password.", status=401, code="INVALID_CREDENTIALS")

        login(request, authed_user)
        return api_success(data={"user": _public_user(authed_user)}, message="Logged in.")
    except Exception:
        return api_error(message="Login failed due to a server error.", status=500, code="SERVER_ERROR")


@api_view(["POST"])
@permission_classes([AllowAny])
def google_login_api(request):
    try:
        credential = request.data.get("credential")
        google_payload = verify_google_id_token(credential)

        expected_audience = os.getenv("GOOGLE_CLIENT_ID")
        if expected_audience and google_payload.get("aud") != expected_audience:
            return api_error(message="Google token audience mismatch.", status=400, code="INVALID_GOOGLE_TOKEN")

        email = (google_payload.get("email") or "").strip().lower()
        if not email:
            return api_error(message="Google account email not available.", status=400, code="INVALID_GOOGLE_TOKEN")
        if google_payload.get("email_verified") not in {"true", True}:
            return api_error(message="Google email is not verified.", status=400, code="INVALID_GOOGLE_TOKEN")

        name = (google_payload.get("name") or "").strip()
        first_name, _, last_name = name.partition(" ")

        user = User.objects.filter(email__iexact=email).first()
        created = False
        if not user:
            user = User.objects.create_user(
                username=email,
                email=email,
                first_name=first_name.strip(),
                last_name=last_name.strip(),
                is_active=True,
            )
            user.set_unusable_password()
            user.save()
            created = True
        elif not user.is_active:
            user.is_active = True
            user.save(update_fields=["is_active"])

        _get_or_create_profile(user)

        login(request, user)
        return api_success(
            data={"user": _public_user(user), "created": created},
            message="Google authentication successful.",
        )
    except GoogleTokenError as exc:
        return api_error(message=str(exc), status=400, code="INVALID_GOOGLE_TOKEN")
    except Exception:
        return api_error(message="Google authentication failed.", status=500, code="SERVER_ERROR")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_api(request):
    logout(request)
    return api_success(message="Logged out.")


@api_view(["GET"])
@permission_classes([AllowAny])
def me_api(request):
    if not request.user.is_authenticated:
        return api_error(message="Authentication required.", status=401, code="UNAUTHENTICATED")
    return api_success(data={"user": _public_user(request.user)})


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def profile_api(request):
    user = request.user
    profile = _get_or_create_profile(user)

    if request.method == "GET":
        return api_success(data={"profile": _public_profile(user)})

    try:
        name = (request.data.get("name") or "").strip()
        birth_date = request.data.get("birth_date")
        gender = (request.data.get("gender") or "").strip()

        errors = {}
        if not name:
            errors["name"] = "Name is required."
        if gender and gender not in dict(UserProfile.GENDER_CHOICES):
            errors["gender"] = "Invalid gender value."

        parsed_birth_date = None
        if birth_date:
            try:
                parsed_birth_date = datetime.strptime(birth_date, "%Y-%m-%d").date()
            except ValueError:
                errors["birth_date"] = "Birth date must be in YYYY-MM-DD format."

        if errors:
            return api_error(message="Validation failed.", errors=errors, status=400, code="VALIDATION_ERROR")

        first_name, _, last_name = name.partition(" ")
        user.first_name = first_name.strip()
        user.last_name = last_name.strip()
        user.save(update_fields=["first_name", "last_name"])

        profile.birth_date = parsed_birth_date
        if gender:
            profile.gender = gender
        profile.save(update_fields=["birth_date", "gender"])

        return api_success(data={"profile": _public_profile(user)}, message="Profile updated successfully.")
    except Exception:
        return api_error(message="Could not update profile.", status=500, code="SERVER_ERROR")


@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def settings_api(request):
    profile = _get_or_create_profile(request.user)
    normalized_theme = _normalize_theme(profile.preferred_theme)
    if normalized_theme != profile.preferred_theme:
        profile.preferred_theme = normalized_theme
        profile.save(update_fields=["preferred_theme"])

    if request.method == "GET":
        return api_success(
            data={
                "settings": {
                    "preferred_theme": normalized_theme,
                    "password_required": request.user.has_usable_password(),
                }
            }
        )

    try:
        preferred_theme = (request.data.get("preferred_theme") or "").strip()
        if preferred_theme not in ALLOWED_THEMES:
            return api_error(
                message="Invalid theme selection.",
                status=400,
                code="VALIDATION_ERROR",
                errors={"preferred_theme": "Choose a valid theme."},
            )

        profile.preferred_theme = preferred_theme
        profile.save(update_fields=["preferred_theme"])
        return api_success(
            data={
                "settings": {
                    "preferred_theme": profile.preferred_theme,
                    "password_required": request.user.has_usable_password(),
                }
            },
            message="Settings updated.",
        )
    except Exception:
        return api_error(message="Could not update settings.", status=500, code="SERVER_ERROR")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def change_password_api(request):
    try:
        current_password = request.data.get("current_password") or ""
        new_password = request.data.get("new_password") or ""
        confirm_password = request.data.get("confirm_password") or ""
        has_usable_password = request.user.has_usable_password()

        if not new_password or not confirm_password:
            return api_error(
                message="New password and confirm password are required.",
                status=400,
                code="VALIDATION_ERROR",
            )
        if new_password != confirm_password:
            return api_error(
                message="New password and confirm password do not match.",
                status=400,
                code="VALIDATION_ERROR",
                errors={"confirm_password": "Passwords do not match."},
            )
        if has_usable_password and not current_password:
            return api_error(
                message="Current password is required.",
                status=400,
                code="VALIDATION_ERROR",
                errors={"current_password": "Current password is required."},
            )
        if has_usable_password and not request.user.check_password(current_password):
            return api_error(
                message="Current password is incorrect.",
                status=400,
                code="INVALID_CREDENTIALS",
                errors={"current_password": "Current password is incorrect."},
            )

        try:
            validate_password(new_password, user=request.user)
        except ValidationError as exc:
            return api_error(
                message="Password validation failed.",
                status=400,
                code="VALIDATION_ERROR",
                errors={"new_password": " ".join(exc.messages)},
            )

        request.user.set_password(new_password)
        request.user.save(update_fields=["password"])
        update_session_auth_hash(request, request.user)
        return api_success(message="Password changed successfully.")
    except Exception:
        return api_error(message="Could not change password.", status=500, code="SERVER_ERROR")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_sessions_api(request):
    sessions = ChatSession.objects.filter(user=request.user).prefetch_related("messages").order_by("-created_at")
    data = [
        {
            "id": s.id,
            "title": (s.title or "").strip()
            or _derive_title_from_text(
                next(
                    (
                        m.message
                        for m in s.messages.all()
                        if m.sender == "user" and (m.message or "").strip()
                    ),
                    "",
                )
            )
            or f"Session {s.id}",
            "created_at": s.created_at,
        }
        for s in sessions
    ]
    return api_success(data={"sessions": data})


@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def rename_session_api(request, session_id):
    try:
        session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        title = " ".join((request.data.get("title") or "").split()).strip()
        if not title:
            return api_error(message="Title is required.", status=400, code="VALIDATION_ERROR")
        if len(title) > 120:
            return api_error(message="Title must be 120 characters or fewer.", status=400, code="VALIDATION_ERROR")

        session.title = title
        session.save(update_fields=["title"])
        return api_success(data={"id": session.id, "title": session.title}, message="Session title updated.")
    except Http404:
        return api_error(message="Session not found.", status=404, code="NOT_FOUND")
    except Exception:
        return api_error(message="Could not update session title.", status=500, code="SERVER_ERROR")


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_session_api(request, session_id):
    try:
        session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        session.delete()
        return api_success(message="Chat history deleted.")
    except Http404:
        return api_error(message="Session not found.", status=404, code="NOT_FOUND")
    except Exception:
        return api_error(message="Could not delete chat history.", status=500, code="SERVER_ERROR")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat_api(request):
    try:
        user_message = (request.data.get("message") or "").strip()
        session_id = request.data.get("session_id")
        if not user_message:
            return api_error(message="Message is required.", status=400, code="VALIDATION_ERROR")

        if session_id:
            session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        else:
            session = ChatSession.objects.create(user=request.user)

        if not (session.title or "").strip():
            session.title = _derive_title_from_text(user_message)
            session.save(update_fields=["title"])

        ChatMessage.objects.create(
            session=session,
            sender="user",
            message=user_message
        )

        ai_reply = generate_ai_response(
            user_query=user_message,
            session=session,
        )
        if not ai_reply:
            ai_reply = "I'm sorry, something went wrong. Please try again."

        ChatMessage.objects.create(
            session=session,
            sender="bot",
            message=ai_reply
        )

        return api_success(
            data={
                "session_id": session.id,
                "session_title": session.title or f"Session {session.id}",
                "reply": ai_reply,
            }
        )
    except Http404:
        return api_error(message="Session not found.", status=404, code="NOT_FOUND")
    except Exception:
        return api_error(message="Could not process chat request.", status=500, code="SERVER_ERROR")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_chat_history(request, session_id):
    try:
        session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        messages = session.messages.all().order_by("created_at")

        data = [
            {
                "id": m.id,
                "sender": m.sender,
                "text": m.message,
                "timestamp": m.created_at
            }
            for m in messages
        ]

        return api_success(
            data={
                "session_id": session.id,
                "messages": data,
            }
        )
    except Http404:
        return api_error(message="Session not found.", status=404, code="NOT_FOUND")
    except Exception:
        return api_error(message="Could not load chat history.", status=500, code="SERVER_ERROR")


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_report_analyses_api(request):
    reports = MedicalReportAnalysis.objects.filter(user=request.user).order_by("-created_at")
    return api_success(data={"reports": [_public_report_payload(report) for report in reports[:50]]})


@api_view(["GET", "DELETE"])
@permission_classes([IsAuthenticated])
def report_analysis_detail_api(request, report_id):
    try:
        report = get_object_or_404(MedicalReportAnalysis, id=report_id, user=request.user)
        if request.method == "DELETE":
            report.delete()
            return api_success(message="Report deleted successfully.")
        payload = _public_report_payload(report)
        payload["extracted_text"] = report.extracted_text or ""
        return api_success(data={"report": payload})
    except Http404:
        return api_error(message="Report not found.", status=404, code="NOT_FOUND")
    except Exception:
        return api_error(message="Could not load report.", status=500, code="SERVER_ERROR")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def analyze_report_api(request):
    try:
        uploaded_files = request.FILES.getlist("files")
        if not uploaded_files:
            return api_error(message="Please upload at least one report file.", status=400, code="VALIDATION_ERROR")

        parsed = parse_uploaded_attachments(uploaded_files)
        if not parsed.get("ok"):
            return api_error(message=parsed.get("error", "Could not parse uploaded files."), status=400, code="VALIDATION_ERROR")

        extracted_docs = parsed.get("extracted_docs", [])
        warnings = parsed.get("warnings", [])
        extracted_details = parsed.get("extracted_details", [])
        used_files = parsed.get("used_files", [])

        combined_text = "\n\n".join(
            [f"FILE: {doc.get('name', 'report')}\n{doc.get('text', '')}" for doc in extracted_docs]
        ).strip()
        if not combined_text:
            return api_error(
                message="Could not extract readable text from uploaded report(s).",
                status=400,
                code="EXTRACTION_FAILED",
                errors={"warnings": warnings},
            )

        analysis = _analyze_report_text_with_model(combined_text)
        if not analysis:
            analysis = "Could not generate report analysis at the moment. Please try again."

        title = (request.data.get("title") or "").strip()
        if not title:
            first_file = used_files[0] if used_files else "Medical Report"
            title = f"Analysis - {first_file}"

        report = MedicalReportAnalysis.objects.create(
            user=request.user,
            title=title[:180],
            file_names=used_files,
            extracted_text=combined_text,
            analysis=analysis,
            warnings=warnings,
        )

        try:
            persist_ocr_debug_output(
                session_id=f"report_{report.id}",
                user_id=request.user.id,
                extracted_details=extracted_details,
                warnings=warnings,
            )
        except Exception:
            pass

        return api_success(data={"report": _public_report_payload(report)}, message="Report analyzed successfully.")
    except Exception:
        return api_error(message="Could not analyze uploaded report.", status=500, code="SERVER_ERROR")


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_overview_api(request):
    try:
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = User.objects.filter(is_active=False).count()
        admin_users = User.objects.filter(is_staff=True).count()
        active_admin_users = User.objects.filter(is_staff=True, is_active=True).count()
        total_sessions = ChatSession.objects.count()
        total_messages = ChatMessage.objects.count()
        bot_messages = ChatMessage.objects.filter(sender="bot").count()
        user_messages = ChatMessage.objects.filter(sender="user").count()
        with open(MEDICAL_DATA_PATH, "r", encoding="utf-8") as f:
            medical_data = json.load(f)
        medical_entries = len(medical_data) if isinstance(medical_data, list) else 0
        recent_sessions = ChatSession.objects.order_by("-created_at")[:5]

        return api_success(
            data={
                "metrics": {
                    "total_users": total_users,
                    "active_users": active_users,
                    "inactive_users": inactive_users,
                    "admin_users": admin_users,
                    "active_admin_users": active_admin_users,
                    "total_sessions": total_sessions,
                    "total_messages": total_messages,
                    "bot_messages": bot_messages,
                    "user_messages": user_messages,
                    "medical_entries": medical_entries,
                },
                "recent_sessions": [
                    {
                        "id": s.id,
                        "title": s.title or f"Session {s.id}",
                        "created_at": s.created_at.isoformat() if s.created_at else None,
                        "user_email": s.user.email if s.user else None,
                    }
                    for s in recent_sessions
                ],
            }
        )
    except Exception:
        return api_error(message="Could not load admin overview.", status=500, code="SERVER_ERROR")


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_users_api(request):
    try:
        query = (request.query_params.get("q") or "").strip()
        role_filter = (request.query_params.get("role") or "all").strip().lower()
        status_filter = (request.query_params.get("status") or "all").strip().lower()
        sort_field = (request.query_params.get("sort") or "date_joined").strip()
        sort_dir = (request.query_params.get("dir") or "desc").strip().lower()
        page, page_size, offset = _parse_pagination_params(request)

        sort_map = {
            "date_joined": "date_joined",
            "last_login": "last_login",
            "name": "first_name",
            "email": "email",
            "session_count": "session_count",
            "message_count": "message_count",
        }
        order_by_field = sort_map.get(sort_field, "date_joined")
        if sort_dir != "asc":
            order_by_field = f"-{order_by_field}"

        users = User.objects.all().annotate(
            session_count=Count("chat_sessions", distinct=True),
            message_count=Count("chat_sessions__messages"),
        )

        if role_filter == "admin":
            users = users.filter(is_staff=True)
        elif role_filter == "user":
            users = users.filter(is_staff=False)

        if status_filter == "active":
            users = users.filter(is_active=True)
        elif status_filter == "inactive":
            users = users.filter(is_active=False)

        if query:
            users = users.filter(
                Q(email__icontains=query) | Q(first_name__icontains=query) | Q(last_name__icontains=query)
            )

        total_count = users.count()
        users = list(users.order_by(order_by_field)[offset : offset + page_size])
        active_admin_ids = set(User.objects.filter(is_staff=True, is_active=True).values_list("id", flat=True))
        data = []
        for user in users:
            item = _admin_user_payload(user)
            item["is_last_active_admin"] = user.id in active_admin_ids and len(active_admin_ids) == 1
            data.append(item)
        return api_success(
            data={
                "users": data,
                "summary": {
                    "total": total_count,
                    "admins": len([u for u in data if u["is_staff"]]),
                    "regular_users": len([u for u in data if not u["is_staff"]]),
                    "active_admins": len(active_admin_ids),
                },
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": total_count,
                    "total_pages": (total_count + page_size - 1) // page_size,
                },
                "filters": {
                    "q": query,
                    "role": role_filter,
                    "status": status_filter,
                    "sort": sort_field,
                    "dir": sort_dir,
                },
            }
        )
    except Exception:
        return api_error(message="Could not load users.", status=500, code="SERVER_ERROR")


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def admin_user_update_api(request, user_id):
    try:
        target = get_object_or_404(User, id=user_id)
        allowed_fields = {"is_active", "is_staff"}
        provided_fields = set(request.data.keys())
        invalid_fields = provided_fields - allowed_fields
        if invalid_fields:
            return api_error(
                message="Only is_active and is_staff can be updated from admin panel.",
                status=400,
                code="VALIDATION_ERROR",
                errors={"fields": f"Unsupported fields: {', '.join(sorted(invalid_fields))}"},
            )

        is_active = _coerce_optional_bool(request.data.get("is_active"))
        is_staff = _coerce_optional_bool(request.data.get("is_staff"))
        if request.data.get("is_active") is not None and is_active is None:
            return api_error(message="is_active must be boolean.", status=400, code="VALIDATION_ERROR")
        if request.data.get("is_staff") is not None and is_staff is None:
            return api_error(message="is_staff must be boolean.", status=400, code="VALIDATION_ERROR")

        if target.id == request.user.id and is_active is False:
            return api_error(message="You cannot deactivate your own account.", status=400, code="VALIDATION_ERROR")
        if target.id == request.user.id and is_staff is False:
            return api_error(message="You cannot remove your own admin access.", status=400, code="VALIDATION_ERROR")
        if target.is_superuser and is_staff is False:
            return api_error(message="Cannot remove staff access from a superuser.", status=400, code="VALIDATION_ERROR")

        active_admin_count = User.objects.filter(is_staff=True, is_active=True).count()
        would_disable_admin_access = (
            target.is_staff
            and target.is_active
            and ((is_active is False) or (is_staff is False))
        )
        if would_disable_admin_access and active_admin_count <= 1:
            return api_error(
                message="At least one active admin is required. Create or activate another admin first.",
                status=400,
                code="VALIDATION_ERROR",
            )

        update_fields = []
        if is_active is not None:
            target.is_active = is_active
            update_fields.append("is_active")

        if is_staff is not None:
            target.is_staff = is_staff
            update_fields.append("is_staff")

        if update_fields:
            target.save(update_fields=list(set(update_fields)))
            _log_admin_action(
                request.user,
                action="user_permissions_updated",
                entity_type="user",
                entity_id=target.id,
                details={
                    "updated_fields": sorted(list(set(update_fields))),
                    "is_active": target.is_active,
                    "is_staff": target.is_staff,
                    "target_email": target.email,
                },
            )

        return api_success(data={"user": _admin_user_payload(target)}, message="User updated.")
    except Http404:
        return api_error(message="User not found.", status=404, code="NOT_FOUND")
    except Exception:
        return api_error(message="Could not update user.", status=500, code="SERVER_ERROR")


@api_view(["GET", "PUT"])
@permission_classes([IsAdminUser])
def admin_medical_data_api(request):
    try:
        if request.method == "GET":
            with open(MEDICAL_DATA_PATH, "r", encoding="utf-8") as f:
                content = json.load(f)
            return api_success(
                data={
                    "medical_data": content,
                    "stats": {
                        "entries": len(content) if isinstance(content, list) else 0,
                        "path": str(MEDICAL_DATA_PATH),
                    },
                }
            )

        payload = request.data.get("medical_data")
        if payload is None:
            return api_error(message="medical_data is required.", status=400, code="VALIDATION_ERROR")

        if isinstance(payload, str):
            try:
                payload = json.loads(payload)
            except json.JSONDecodeError:
                return api_error(message="medical_data must be valid JSON.", status=400, code="VALIDATION_ERROR")

        if not isinstance(payload, list):
            return api_error(message="medical_data JSON root must be an array.", status=400, code="VALIDATION_ERROR")

        previous_data = []
        try:
            with open(MEDICAL_DATA_PATH, "r", encoding="utf-8") as f:
                previous_data = json.load(f)
        except Exception:
            previous_data = []

        MedicalDataVersion.objects.create(
            actor=request.user,
            note="Autosave snapshot before medical data update",
            snapshot=previous_data if isinstance(previous_data, list) else [],
        )

        with open(MEDICAL_DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

        llm_engine.MEDICAL_DATA = payload
        _log_admin_action(
            request.user,
            action="medical_data_updated",
            entity_type="medical_data",
            entity_id="json_file",
            details={"entries": len(payload)},
        )
        return api_success(
            data={"entries": len(payload)},
            message="Medical data updated successfully.",
        )
    except Exception:
        _log_admin_action(
            request.user,
            action="medical_data_update_failed",
            entity_type="medical_data",
            entity_id="json_file",
            details={"status": "error"},
        )
        return api_error(message="Could not update medical data.", status=500, code="SERVER_ERROR")


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_medical_versions_api(request):
    try:
        page, page_size, offset = _parse_pagination_params(request)
        queryset = MedicalDataVersion.objects.select_related("actor").order_by("-created_at")
        total = queryset.count()
        versions = queryset[offset : offset + page_size]
        data = [
            {
                "id": version.id,
                "created_at": version.created_at.isoformat() if version.created_at else None,
                "note": version.note,
                "actor_email": version.actor.email if version.actor else None,
                "entries": len(version.snapshot) if isinstance(version.snapshot, list) else 0,
            }
            for version in versions
        ]
        return api_success(
            data={
                "versions": data,
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": total,
                    "total_pages": (total + page_size - 1) // page_size,
                },
            }
        )
    except Exception:
        return api_error(message="Could not load medical versions.", status=500, code="SERVER_ERROR")


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_restore_medical_version_api(request, version_id):
    try:
        version = get_object_or_404(MedicalDataVersion, id=version_id)
        snapshot = version.snapshot if isinstance(version.snapshot, list) else []
        with open(MEDICAL_DATA_PATH, "w", encoding="utf-8") as f:
            json.dump(snapshot, f, indent=2)
        llm_engine.MEDICAL_DATA = snapshot
        _log_admin_action(
            request.user,
            action="medical_data_restored",
            entity_type="medical_data_version",
            entity_id=version.id,
            details={"entries": len(snapshot)},
        )
        return api_success(data={"entries": len(snapshot)}, message="Medical data restored from selected version.")
    except Http404:
        return api_error(message="Version not found.", status=404, code="NOT_FOUND")
    except Exception:
        _log_admin_action(
            request.user,
            action="medical_data_restore_failed",
            entity_type="medical_data_version",
            entity_id=version_id,
            details={"status": "error"},
        )
        return api_error(message="Could not restore medical data version.", status=500, code="SERVER_ERROR")


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_audit_logs_api(request):
    try:
        page, page_size, offset = _parse_pagination_params(request)
        action_query = (request.query_params.get("action") or "").strip().lower()
        queryset = AdminAuditLog.objects.select_related("actor").order_by("-created_at")
        if action_query:
            queryset = queryset.filter(action__icontains=action_query)
        total = queryset.count()
        logs = queryset[offset : offset + page_size]
        data = [
            {
                "id": log.id,
                "created_at": log.created_at.isoformat() if log.created_at else None,
                "actor_email": log.actor.email if log.actor else None,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "details": log.details,
            }
            for log in logs
        ]
        return api_success(
            data={
                "logs": data,
                "pagination": {
                    "page": page,
                    "page_size": page_size,
                    "total": total,
                    "total_pages": (total + page_size - 1) // page_size,
                },
            }
        )
    except Exception:
        return api_error(message="Could not load audit logs.", status=500, code="SERVER_ERROR")


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_health_api(request):
    health = {
        "database": {"ok": False, "detail": ""},
        "medical_json": {"ok": False, "detail": ""},
        "model_config": {"ok": False, "detail": ""},
    }

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        health["database"] = {"ok": True, "detail": "Database reachable."}
    except Exception as exc:
        health["database"] = {"ok": False, "detail": str(exc)}

    try:
        with open(MEDICAL_DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, list):
            health["medical_json"] = {"ok": True, "detail": f"Loaded {len(data)} entries."}
        else:
            health["medical_json"] = {"ok": False, "detail": "JSON root is not an array."}
    except Exception as exc:
        health["medical_json"] = {"ok": False, "detail": str(exc)}

    try:
        has_key = bool(os.getenv("GROQ_API") or os.getenv("GROQ_API_KEY"))
        health["model_config"] = {"ok": has_key, "detail": "GROQ_API key present." if has_key else "Missing GROQ_API key."}
    except Exception as exc:
        health["model_config"] = {"ok": False, "detail": str(exc)}

    probe_enabled = (request.query_params.get("probe") or "").lower() in {"1", "true", "yes"}
    probe_result = None
    if probe_enabled:
        try:
            completion = llm_engine.client.chat.completions.create(
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                messages=[
                    {"role": "system", "content": "Reply with one short line."},
                    {"role": "user", "content": "Is the model reachable?"},
                ],
                temperature=0,
                max_completion_tokens=24,
                top_p=1,
            )
            text = (completion.choices[0].message.content or "").strip()
            probe_result = {"ok": bool(text), "detail": text or "Empty response from model."}
        except Exception as exc:
            probe_result = {"ok": False, "detail": str(exc)}

    fallback_reply_count = ChatMessage.objects.filter(sender="bot", message__icontains="something went wrong").count()
    last_bot = ChatMessage.objects.filter(sender="bot").order_by("-created_at").first()
    recent_errors = AdminAuditLog.objects.filter(
        Q(action__icontains="failed") | Q(action__icontains="error")
    ).order_by("-created_at")[:8]

    all_ok = all(item.get("ok") for item in health.values()) and (probe_result is None or probe_result.get("ok"))
    return api_success(
        data={
            "status": "healthy" if all_ok else "degraded",
            "checks": health,
            "probe": probe_result,
            "response_quality": {
                "fallback_reply_count": fallback_reply_count,
                "last_bot_message_at": last_bot.created_at.isoformat() if last_bot else None,
            },
            "recent_errors": [
                {
                    "id": err.id,
                    "action": err.action,
                    "created_at": err.created_at.isoformat() if err.created_at else None,
                    "actor_email": err.actor.email if err.actor else None,
                    "details": err.details,
                }
                for err in recent_errors
            ],
        }
    )
