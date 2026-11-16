# scan-reconstruct

macOS CLI: folder of JPEGs → one `.usdz` via `PhotogrammetrySession` (`.medium` detail).

```bash
swift build -c release
# binary: .build/release/scan-reconstruct
# Usage: scan-reconstruct <imageFolder> <output.usdz>
```

Requires **macOS 13+** and Xcode. Invoked by `backend/src/services/photogrammetryMac.ts`.