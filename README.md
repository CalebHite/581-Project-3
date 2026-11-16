# StyleView (EECS 581 Project 3)

**Person 3D scan:** orbit photos on phone or web → **Apple Photogrammetry** on your Mac → **USDZ** model.

| Directory | Role |
|-----------|------|
| `styleview/` | Expo app (Expo Go + web). Capture UI and model viewer. |
| `backend/` | Express API on port **3001**; runs macOS reconstruction CLI. |
| `backend/native/` | Swift `scan-reconstruct` wrapper around `PhotogrammetrySession`. |

## Quick start

**Requirements:** macOS 13+ with Xcode (for reconstruction), Node 20+, phone and Mac on the same Wi‑Fi for device testing.

```bash
# 1) Build the photogrammetry CLI (once, on the Mac)
cd backend/native && swift build -c release

# 2) Backend
cd backend && cp .env.example .env && npm install && npm run dev
# Listens on 0.0.0.0:3001

# 3) Expo app
cd styleview && npm install && npx expo start
```

Open **Scan person** in the app. Reconstruction takes **several minutes** (normal).

## Configuration

| Variable | Where | Purpose |
|----------|--------|---------|
| `EXPO_PUBLIC_API_URL` | `styleview/.env` only | Backend URL, e.g. `http://192.168.x.x:3001`. Often auto-detected from Expo’s debugger host on device. |
| `ALLOWED_ORIGINS` | `backend/.env` | CORS for **Expo web** only (comma-separated). Expo Go native scan API does not use CORS. |
| `PORT` | `backend/.env` | Default `3001`. |
| `PHOTOGRAMMETRY_CLI` | `backend/.env` | Optional override path to `scan-reconstruct` binary. |

Do **not** put `EXPO_PUBLIC_*` in `backend/.env`.

## API (scan)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/health` | Liveness |
| GET | `/api/scan/status` | macOS + CLI path + photo counts |
| POST | `/api/scan/reconstruct` | Multipart `photos[]` (web) |
| POST | `/api/scan/reconstruct/base64` | JSON `{ images: string[] }` base64 JPEGs (Expo native) |
| GET | `/api/scan/models/:id.usdz` | Download result |

Models are stored under `~/.styleview/models/`.

## App flow

`App.tsx` → `HomeScreen` → `PersonScanScreen` → `ScanModelViewerScreen`

- **Native:** uploads base64 (RN `FormData` file parts are unreliable); viewer uses Quick Look after download.
- **Web:** multipart upload; viewer uses Three.js `USDZLoader`.

## For agents

Read `styleview/AGENTS.md` before editing the Expo app. SDK is **Expo 58**; navigation is **state in `App.tsx`**, not Expo Router.