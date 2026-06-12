# DermScreen Expo Frontend

## Run

### Backend (FastAPI)

```powershell
cd ..\backend
.\venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Frontend (Expo)

```powershell
cd ..\frontend
npm run start
```

## Environment

You can override the API base URL with an Expo public env var. This is useful for physical devices (Expo Go) or switching backend hosts without editing code.

- Default (no env var): uses platform-specific local host
  - Android emulator: http://10.0.2.2:8000
  - iOS simulator / web: http://localhost:8000
- Override (recommended for physical devices):
  - EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000

## Example

### macOS / Linux

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.50:8000 npm run start
```

### Windows PowerShell

```powershell
$env:EXPO_PUBLIC_API_BASE_URL = "http://192.168.1.50:8000"
npm run start
```

## Build Release (EAS)

If you want a production app (no Expo Go), use EAS Build to generate AAB/IPA.

### 1) Create an Expo account and login

```bash
npm install -g eas-cli
eas login
```

### 2) Configure EAS once

```bash
cd /workspaces/dalieu/frontend
eas build:configure
```

### 3) Set API URL for release builds

```bash
eas secret:create --name EXPO_PUBLIC_API_BASE_URL --value "https://<your-backend-domain>"
```

### 4) Build

```bash
# Android (AAB)
eas build -p android --profile production

# iOS (IPA, requires Apple Developer account)
eas build -p ios --profile production
```
