/*
 * Name:         WebCamera.tsx
 * Description:  Web-only live front-camera view built on getUserMedia so the
 *               pose tracker can read frames from the <video> element.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 reqs. 4, 5, 6, 8, 32).
 * Preconditions:  Web, served over HTTPS or localhost; camera permission granted.
 * Postconditions: Shows a mirrored, cover-fit video. On unmount every camera
 *                 track is stopped, so the camera turns off. Video is never uploaded.
 * Errors:       Camera unavailable or in use -> `onError(message)`.
 */
import { createElement, useEffect, useState } from 'react';

type Props = {
  onVideo: (el: HTMLVideoElement | null) => void;
  onError: (message: string) => void;
  onSize: (w: number, h: number) => void;
  // Reports the on-screen size of the camera view in pixels.
  onBox: (w: number, h: number) => void;
};

export function WebCamera({ onVideo, onError, onSize, onBox }: Props) {
  // The <video> element, captured with a callback ref so effects run once it exists.
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!video) return;
    onVideo(video);
    // Measure the real on-screen size from the element itself (it fills its container).
    const measure = () => onBox(video.clientWidth, video.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(video);
    let stream: MediaStream | undefined;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        // The screen may have closed while the browser was asking.
        if (cancelled) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        video.srcObject = s;
        const report = () => video.videoWidth && onSize(video.videoWidth, video.videoHeight);
        video.onloadedmetadata = report;
        video.onplaying = report;
        video.play().then(report, () => {});
      })
      .catch((e) => onError(e?.message || 'Another app may be using the camera.'));

    // Cleanup: release the camera.
    return () => {
      cancelled = true;
      observer.disconnect();
      stream?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
      onVideo(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video]);

  // Mirrored selfie view; object-fit cover matches the math in shirtTransform.ts.
  return createElement('video', {
    ref: setVideo,
    muted: true,
    playsInline: true,
    style: {
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      transform: 'scaleX(-1)',
      backgroundColor: '#000',
    },
  });
}
