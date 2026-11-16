# StyleView backend

Express + TypeScript service for StyleView. Handles shirt-picture processing; live video is never sent here.
OpenAI is scaffolded (`src/ai/openaiClient.ts`) but not used in Sprint 2.

## Run
```
cd backend
npm install
cp .env.example .env      # set ALLOWED_ORIGINS if the web app is on another origin
npm run dev               # http://localhost:3001
npm test
```

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness |
| GET | `/api/shirts/tips` | photo tips (req 15) |
| POST | `/api/shirts/validate` | multipart `image`; usable-picture check (req 13/14) |
| POST | `/api/shirts/normalize` | fix orientation, shrink; returns PNG |
| POST | `/api/shirts/transform` | `options={"rotate":90,"crop":{x,y,w,h}}` (0-1); returns PNG (req 16) |
| POST | `/api/shirts/cutout` | `options={"polygon":[{x,y},...]}`; transparent PNG (req 17) |

Errors are `{ ok:false, code, message }`.

## Connect the app
```
cd styleview
EXPO_PUBLIC_API_URL=http://localhost:3001 npx expo start --web
```
For a phone on your network, use the laptop's LAN IP for both `EXPO_PUBLIC_API_URL` and `ALLOWED_ORIGINS`
(the phone camera also requires HTTPS, e.g. via a tunnel).
