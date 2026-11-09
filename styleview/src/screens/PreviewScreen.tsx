/*
 * Name:         PreviewScreen.tsx
 * Description:  Live front-camera preview. Requests camera permission, explains
 *               how to recover if it is denied, shows a mirrored live view, and
 *               reports camera start-up failures with a retry option.
 * Programmer:   Caleb Hite
 * Created:      2026-11-09
 * Revisions:    2026-11-09  Initial version (Sprint 1 reqs. 3, 4, 5, 6).
 * Preconditions:  Rendered only while the user is previewing; `mode` is a valid Mode.
 *                 On the web, the page must be served over HTTPS or localhost.
 * Postconditions: While mounted and permitted, the front camera streams to the
 *                 screen only (never uploaded or stored). When unmounted (Back, tab
 *                 hidden) the CameraView is destroyed, which turns the camera off.
 * Errors:       Permission denied -> help panel (browser lock icon or Settings).
 *               Camera mount failure (in use, no device) -> error panel + "Try again".
 */
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { colors } from '../theme';
import { Mode, MODE_LABEL } from '../types';

type Props = { mode: Mode; onBack: () => void };

// The camera is only mounted while this screen is shown, so leaving it
// (back button, hidden tab, unmount) releases the camera.
export function PreviewScreen({ mode, onBack }: Props) {
  // permission is null until the OS/browser has reported its current state.
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);

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
                {Platform.OS === 'web'
                  ? 'Tap the lock icon in your browser address bar, set Camera to Allow, then reload this page.'
                  : 'Open your phone Settings, allow Camera access for this app, then come back.'}
              </Text>
              {/* Deep link to app settings exists only on native platforms. */}
              {Platform.OS !== 'web' && (
                <Button label="Open settings" onPress={() => Linking.openSettings()} />
              )}
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
          {/* Clearing the error remounts CameraView, retrying the camera. */}
          <Button label="Try again" onPress={() => setError(null)} />
        </View>
      </View>
    );
  }

  // State 4: live preview. `mirror` gives the selfie-style view users expect.
  return (
    <View style={styles.full}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="front"
        mirror
        onMountError={(e) => setError(e.message || 'Another app may be using the camera.')}
      />
      <View style={styles.overlay}>{header}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: '#000' },
  // Header floats over the video so the camera can fill the whole screen.
  overlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
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
