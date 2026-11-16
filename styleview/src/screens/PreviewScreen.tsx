/*
 * Name:         PreviewScreen.tsx
 * Description:  Live front-camera preview. Requests camera permission, explains
 *               how to recover if it is denied, shows a mirrored live view, and
 *               reports camera start-up failures with a retry option. In shirt
 *               mode (web) it detects the upper body and overlays the shirt.
 * Programmer:   Caleb Hite
 * Created:      2026-11-09
 * Revisions:    2026-11-09  Initial version (Sprint 1 reqs. 3, 4, 5, 6).
 *               2026-11-16  Added body tracking, shirt overlay, adjust controls
 *                           (Sprint 2 reqs. 8-11, 19, 20).
 * Preconditions:  Rendered only while the user is previewing; `mode` is a valid Mode.
 *                 On the web, the page must be served over HTTPS or localhost.
 * Postconditions: While mounted and permitted, the front camera streams to the
 *                 screen only (never uploaded or stored). When unmounted (Back, tab
 *                 hidden) the camera is released, which turns it off.
 * Errors:       Permission denied -> help panel (browser lock icon or Settings).
 *               Camera mount failure (in use, no device) -> error panel + "Try again".
 *               Tracker load failure -> banner + "Retry".
 */
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useMemo, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { AdjustControls } from '../components/AdjustControls';
import { Button } from '../components/Button';
import { ShirtOverlay, shirtSource } from '../components/ShirtOverlay';
import { WebCamera } from '../components/WebCamera';
import { colors } from '../theme';
import { placeShirt, toScreen } from '../tracking/shirtTransform';
import { usePoseTracker } from '../tracking/usePoseTracker';
import { Adjust, Mode, MODE_LABEL, NO_ADJUST, Shirt } from '../types';

type Props = { mode: Mode; shirt: Shirt; onBack: () => void };

const IS_WEB = Platform.OS === 'web';

// The camera is only mounted while this screen is shown, so leaving it
// (back button, hidden tab, unmount) releases the camera.
export function PreviewScreen({ mode, shirt, onBack }: Props) {
  // permission is null until the OS/browser has reported its current state.
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [videoSize, setVideoSize] = useState({ w: 0, h: 0 });
  const [adjust, setAdjust] = useState<Adjust>(NO_ADJUST);
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);

  const shirtMode = mode === 'shirt';
  const granted = !!permission?.granted && !error;
  // Body tracking runs only on web, in shirt mode, with a working camera.
  const { status, landmarks, retry, stage } = usePoseTracker(video, IS_WEB && shirtMode && granted);

  // Where the shirt goes this frame; null (shirt hidden) when no body is tracked.
  const placement = useMemo(
    () =>
      IS_WEB && shirtMode && status === 'ready'
        ? placeShirt(landmarks, { ...box, videoWidth: videoSize.w, videoHeight: videoSize.h }, shirt, adjust)
        : null,
    [landmarks, box, videoSize, shirt, adjust, shirtMode, status],
  );
  const tracking = placement !== null;

  // TEMP debug: screen positions of shoulders (11,12) and hips (23,24) + a status line.
  const view = { ...box, videoWidth: videoSize.w, videoHeight: videoSize.h };
  const dots =
    IS_WEB && landmarks && videoSize.w
      ? [11, 12, 23, 24].filter((i) => landmarks[i]).map((i) => ({ i, ...toScreen(landmarks[i], view), v: landmarks[i].visibility }))
      : [];
  const debug =
    `status=${status} stage=${stage} el=${video ? 'yes' : 'NO'} on=${IS_WEB && shirtMode && granted} video=${videoSize.w}x${videoSize.h} box=${Math.round(box.width)}x${Math.round(box.height)} ` +
    `lm=${landmarks ? landmarks.length : 'none'} vis=${dots.map((d) => `${d.i}:${(d.v ?? 1).toFixed(2)}`).join(',')} ` +
    `shirt=${placement ? `${Math.round(placement.left)},${Math.round(placement.top)} ${Math.round(placement.width)}x${Math.round(placement.height)} rot=${Math.round(placement.angleDeg)}` : 'hidden'} ` +
    `src=${IS_WEB ? shirtSource(shirt).slice(0, 40) : ''}`;

  // Shared top bar: Back button plus the active mode name.
  const header = (
    <View style={styles.header}>
      <Button label="Back" variant="secondary" onPress={onBack} />
      <Text style={styles.mode}>{MODE_LABEL[mode]}</Text>
    </View>
  );

  // State 1: permission status not known yet.
  if (!permission) {
    return (
      <View style={styles.center}>
        {header}
        <Text style={styles.msg}>Checking camera access…</Text>
      </View>
    );
  }

  // State 2: permission not granted. If the system will not ask again the user
  // must change it manually, so show instructions instead of a request button.
  if (!permission.granted) {
    const blocked = !permission.canAskAgain;
    return (
      <View style={styles.center}>
        {header}
        <View style={styles.panel}>
          <Text style={styles.msgTitle}>
            {blocked ? 'Camera access is blocked' : 'Camera access needed'}
          </Text>
          <Text style={styles.msgPlain}>
            StyleView needs your front camera to show the live preview. Video stays on your phone.
          </Text>
          {blocked ? (
            <>
              <Text style={styles.msgPlain}>
                {IS_WEB
                  ? 'Tap the lock icon in your browser address bar, set Camera to Allow, then reload this page.'
                  : 'Open your phone Settings, allow Camera access for this app, then come back.'}
              </Text>
              {/* Deep link to app settings exists only on native platforms. */}
              {!IS_WEB && <Button label="Open settings" onPress={() => Linking.openSettings()} />}
            </>
          ) : (
            <Button label="Allow camera" onPress={requestPermission} />
          )}
        </View>
      </View>
    );
  }

  // State 3: permission granted but the camera failed to start.
  if (error) {
    return (
      <View style={styles.center}>
        {header}
        <View style={styles.panel}>
          <Text style={styles.msgTitle}>Could not start the camera</Text>
          <Text style={styles.msgPlain}>{error}</Text>
          {/* Clearing the error remounts the camera, retrying it. */}
          <Button label="Try again" onPress={() => setError(null)} />
        </View>
      </View>
    );
  }

  // Block: status line for the tracker (req. 8 / 11).
  let banner: string | null = null;
  if (shirtMode) {
    if (!IS_WEB) banner = 'Shirt try-on needs the web version for now.';
    else if (status === 'loading') banner = `Loading body tracking… (${video ? stage : 'waiting for camera view'})`;
    else if (status === 'error') banner = 'Body tracking could not load.';
    else if (status === 'ready') banner = tracking
        ? null
        : !videoSize.w
          ? 'Waiting for the camera…'
          : !landmarks
            ? 'No body found yet. Step back so your shoulders are in view.'
            : 'Shoulders not clear. Face the camera with good lighting.';
  } else {
    banner = 'Hairstyles are coming in a later update.';
  }

  // State 4: live preview. Mirrored for the selfie-style view users expect.
  return (
    <View
      style={styles.full}
      onLayout={(e) => {
        // Ignore empty measurements so they never overwrite a good size.
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) setBox({ width, height });
      }}
    >
      {IS_WEB ? (
        <WebCamera onBox={(w, h) => setBox({ width: w, height: h })} onVideo={setVideo} onError={setError} onSize={(w, h) => setVideoSize({ w, h })} />
      ) : (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="front"
          mirror
          onMountError={(e) => setError(e.message || 'Another app may be using the camera.')}
        />
      )}

      {/* Shirt follows the body; hidden automatically while tracking is lost. */}
      {IS_WEB && shirtMode && status === 'ready' && (
        <ShirtOverlay shirt={shirt} placement={placement} />
      )}

      {/* TEMP debug markers: green dot = tracked joint */}
      {dots.map((d) => (
        <View key={d.i} pointerEvents="none" style={[styles.dot, { left: d.x - 6, top: d.y - 6 }]} />
      ))}

      <View style={styles.overlay}>
        {header}
        {IS_WEB && shirtMode && <Text style={styles.debug}>{debug}</Text>}
        {banner && (
          <View style={styles.bannerRow}>
            <Text style={styles.banner}>{banner}</Text>
            {status === 'error' && <Button label="Retry" onPress={retry} />}
          </View>
        )}
      </View>

      {IS_WEB && shirtMode && status === 'ready' && (
        <View style={styles.controls}>
          <AdjustControls adjust={adjust} onChange={setAdjust} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: '#000', overflow: 'hidden' },
  // Header floats over the video so the camera can fill the whole screen.
  overlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  dot: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#3ddc84' },
  debug: { color: '#3ddc84', fontSize: 11, paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.5)' },
  controls: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16 },
  banner: {
    color: colors.text,
    fontSize: 15,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  // Semi-transparent badge stays readable over any camera background.
  mode: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  center: { flex: 1, backgroundColor: colors.bg },
  panel: { padding: 24, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },
  msgTitle: { color: colors.text, fontSize: 22, fontWeight: '700' },
  msgPlain: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  msg: { color: colors.muted, fontSize: 16, padding: 16 },
});
