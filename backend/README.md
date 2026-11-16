# StyleView backend

Express service for **person scan reconstruction** on macOS.

## Run

```bash
cp .env.example .env
npm install
npm run dev   # PORT 3001, bind 0.0.0.0
```

Build the native CLI first: `cd native && swift build -c release`.

## Routes

- `GET /health`
- `GET /api/scan/status`
- `POST /api/scan/reconstruct` — multipart `photos` (web)
- `POST /api/scan/reconstruct/base64` — `{ images: base64[] }` (Expo native)
- `GET /api/scan/models/:id.usdz`

See repo root `README.md` for env vars and architecture.

## Test

```bash
npm test
```