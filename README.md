# Patient Interaction System

Full-stack patient interaction app with:
- Backend: Django + Django REST Framework
- Frontend: React + Vite
- Mobile: React Native + Expo

## Project Structure
- `Backend/backend/` Django project (`manage.py`)
- `Frontend/` React app
- `Mobile/` React Native app (Expo)

## Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (running locally on port 5432)

Optional (for OCR from image uploads):
- Tesseract OCR installed on your system

## 1) Backend Setup
From project root:

```powershell
cd Backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
cd backend
python manage.py migrate
python manage.py runserver
```

Backend runs at `http://127.0.0.1:8000`.

## 2) Frontend Setup
Open a new terminal from project root:

```powershell
cd Frontend
npm install
npm run dev
```

Frontend runs at `http://127.0.0.1:5173`.

## 3) Mobile App Setup
Open a new terminal from project root:

```powershell
cd Mobile
copy .env.example .env
```

Set API URL in `Mobile/.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000
```

- Android emulator uses `10.0.2.2` for localhost.
- iOS simulator can often use `http://127.0.0.1:8000`.
- Physical device should use your PC's LAN IP (example `http://192.168.1.20:8000`).

Install dependencies and start Expo:

```powershell
npm install
npm run start
```

Mobile auth uses DRF token auth endpoints. Ensure backend migrations are applied:

```powershell
cd ..\Backend\backend
python manage.py migrate
```

## Environment Variables
Copy `.env.example` to `.env`, then update values as needed (in project root or where you run Django):

```env
DEBUG=1
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
GROQ_API=your_groq_api_key
GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

Optional variables:

```env
SESSION_COOKIE_AGE=1209600
MAX_ATTACHMENTS=4
MAX_ATTACHMENT_SIZE_MB=8
MAX_EXTRACTED_TEXT_CHARS=14000
OCR_DEBUG_DIR=chat/data/ocr_debug
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=no-reply@medassist.local
```

## Push to GitHub
From project root:

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

If your GitHub repo already has commits (README/license), run before push:

```powershell
git pull origin main --rebase
git push -u origin main
```
