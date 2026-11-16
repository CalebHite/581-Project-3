/*
 * Name:         usePoseTracker.ts
 * Description:  Web hook that runs MediaPipe Pose Landmarker on the live camera
 *               <video> entirely on the device to find the user's upper body.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 req. 8).
 * Preconditions:  Web only. The backend is running; it serves the model and wasm files
 *                 under /mediapipe/ (see backend/src/routes/mediapipe.ts).
 *                 `video` is the playing camera <video> element (or null).
 * Postconditions: Returns the latest landmarks (or undefined when nobody is found),
 *                 a load status, and `retry`. Frames are never sent anywhere.
 * Errors:       Model/wasm load failure -> status 'error' (use `retry`).
 *               Non-web platforms -> status 'unsupported'.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { API_URL } from '../config';
import type { Landmark } from './shirtTransform';

// Tracking files come from the backend (the Expo dev server serves big files very slowly).
const MP = `${API_URL}/mediapipe`;

type Vision = typeof import('@mediapipe/tasks-vision');

// Load the MediaPipe bundle from our own origin with a module <script> (the bundler
// cannot process it, and CSP only allows same-origin scripts). The promise is shared so
// remounting the preview never races or loads the script twice.
let visionPromise: Promise<Vision> | undefined;
function loadVision(): Promise<Vision> {
  const w = window as any;
  if (w.__mediapipeVision) return Promise.resolve(w.__mediapipeVision);
  visionPromise ??= new Promise<Vision>((resolve, reject) => {
    window.addEventListener('mediapipe-ready', () => resolve(w.__mediapipeVision), { once: true });
    const tag = document.createElement('script');
    tag.type = 'module';
    tag.src = `${MP}/loader.js`;
    tag.crossOrigin = 'anonymous';
    tag.onerror = () => {
      visionPromise = undefined; // allow a retry
      reject(new Error('Could not load tracking files from the StyleView server. Is the backend running?'));
    };
    document.head.appendChild(tag);
  });
  return visionPromise;
}

// One shared model for the whole app. The MediaPipe wasm runtime cannot create two
// models at once, so creation is never overlapped; the CPU delegate is used because
// the GPU one can hang and the lite pose model is fast enough on CPU.
let landmarkerPromise: Promise<any> | undefined;
function getLandmarker(vision: Vision, fileset: any): Promise<any> {
  landmarkerPromise ??= vision.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: `${MP}/pose_landmarker_lite.task`, delegate: 'CPU' },
    runningMode: 'VIDEO',
    numPoses: 1,
  }).catch((e) => {
    landmarkerPromise = undefined; // allow a clean retry after a real failure
    throw e;
  });
  return landmarkerPromise;
}

// Reject if a step takes too long, so the UI shows an error instead of loading forever.
function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${what} timed out`)), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}

// Frames without a detected body before landmarks are cleared (shirt hides).
const GRACE_FRAMES = 6;

export type TrackerStatus = 'loading' | 'ready' | 'error' | 'unsupported';

export function usePoseTracker(video: HTMLVideoElement | null, enabled: boolean) {
  const [status, setStatus] = useState<TrackerStatus>(Platform.OS === 'web' ? 'loading' : 'unsupported');
  const [landmarks, setLandmarks] = useState<Landmark[] | undefined>();
  const [attempt, setAttempt] = useState(0);
  // Which loading step is running (or the error text); shown in the debug line.
  const [stage, setStage] = useState('idle');
  const retry = useCallback(() => {
    setStatus('loading');
    setAttempt((n) => n + 1);
  }, []);
  const raf = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled || !video) return;
    let cancelled = false;
    let landmarker: any;
    (async () => {
      try {
        // Block: load the model (local files only; CSP keeps everything on-origin).
        setStage('loading script');
        const vision = await withTimeout(loadVision(), 20000, 'Loading tracking script');
        setStage('loading wasm');
        const fileset = await withTimeout(
          vision.FilesetResolver.forVisionTasks(`${MP}/wasm`),
          20000,
          'Loading wasm',
        );
        setStage('creating model (CPU)');
        landmarker = await withTimeout(getLandmarker(vision, fileset), 40000, 'Model');
        if (cancelled) return; // the shared model stays alive for the next visit
        setStage('running');
        setStatus('ready');

        // Block: detect once per new video frame.
        // Smoothing and a short grace period live here (outside React) so each frame
        // costs one state update, and brief detection drops do not make the shirt flicker.
        let lastTime = -1;
        let prev: Landmark[] | undefined;
        let missed = 0;
        const loop = () => {
          const v = video;
          if (v.readyState >= 2 && v.currentTime !== lastTime) {
            lastTime = v.currentTime;
            const found: Landmark[] | undefined = landmarker.detectForVideo(v, performance.now())
              .landmarks?.[0];
            if (found) {
              missed = 0;
              prev = found.map((p, i) => {
                const o = prev?.[i];
                return o
                  ? { x: o.x + (p.x - o.x) * 0.5, y: o.y + (p.y - o.y) * 0.5, visibility: p.visibility }
                  : { x: p.x, y: p.y, visibility: p.visibility };
              });
              setLandmarks(prev);
            } else if (++missed === GRACE_FRAMES) {
              prev = undefined;
              setLandmarks(undefined);
            }
          }
          raf.current = requestAnimationFrame(loop);
        };
        loop();
      } catch (e: any) {
        console.error('Body tracking failed to load:', e);
        if (!cancelled) {
          setStage(`error: ${e?.message ?? e}`);
          setStatus('error');
        }
      }
    })();

    // Cleanup: stop the loop and free the model when leaving the preview.
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf.current);
      setLandmarks(undefined);
    };
  }, [enabled, attempt, video]);

  return { status, landmarks, retry, stage };
}
