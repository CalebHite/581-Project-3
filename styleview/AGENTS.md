# StyleView — agent notes

Expo **58** / React Native app for **person orbit capture** and viewing a **USDZ** from the Mac backend.

## Architecture

```
HomeScreen → PersonScanScreen → ScanModelViewerScreen
                  ↓ scanApi.ts (fetch)
            backend :3001 /api/scan/*
                  ↓
            scan-reconstruct (Swift, macOS only)
```

- **`src/config.ts`** — `API_URL`: `EXPO_PUBLIC_API_URL`, or LAN host from Expo debugger + port `3001`.
- **`src/services/scanApi.ts`** — Web uses multipart; **iOS/Android use `/reconstruct/base64`** (not FormData files).
- **`src/components/OrbitCamera.tsx`** — Native camera; **`.web.tsx`** uses `WebCamera`.
- **`src/three/UsdzScanCanvas.web.tsx`** — WebGL viewer; native stub in `UsdzScanCanvas.tsx`.

Navigation is **`App.tsx` screen state** — there is no `expo-router` / `src/app/` tree.

## Commands

```bash
cd styleview
npx expo start          # Expo Go / web
npx tsc --noEmit        # typecheck (run before finishing tasks)
npx expo lint
```

Use `npx expo install <pkg>` for new Expo modules (SDK-compatible versions).

## Backend coupling

The app expects a running backend. See repo root `README.md` for `EXPO_PUBLIC_API_URL`, `ALLOWED_ORIGINS`, and building `backend/native`.

## Expo docs

Do not rely on stale training data. Check `expo` version in `package.json`, then https://docs.expo.dev/versions/v58.0.0/ or https://docs.expo.dev/llms.txt .

## Out of scope (removed)

Legacy shirt try-on (MediaPipe overlay, multi-angle mannequin, shirt editor, `/api/shirts`) was removed to keep this repo scan-focused.