# MedAssist Mobile App

React Native mobile app (Expo) for the same backend used by your web app.

## Why this setup

- Keeps current website unchanged in `Frontend/`
- Adds mobile frontend in `Mobile/`
- Shares one backend (`Backend/`) across web and mobile

## Setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Set API URL in `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000
```

- Android emulator uses `10.0.2.2` for localhost.
- iOS simulator can often use `http://127.0.0.1:8000`.
- Physical device should use your PC's LAN IP (example `http://192.168.1.20:8000`).

3. Install and run:

```bash
npm install
npm run start
```

## Backend note for mobile auth

Mobile auth uses DRF token auth endpoints:

- `POST /api/auth/token-login/`
- `POST /api/auth/token-logout/`

Run Django migrations after pulling these changes:

```bash
python manage.py migrate
```

This creates DRF authtoken tables.
