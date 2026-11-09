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
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);

  const header = (
    <View style={styles.header}>
      <Button label="Back" variant="secondary" onPress={onBack} />
      <Text style={styles.mode}>{MODE_LABEL[mode]}</Text>
    </View>
  );

  if (!permission) {
    return (
      <View style={styles.center}>
        {header}
        <Text style={styles.msg}>Checking camera access…</Text>
      </View>
    );
  }

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

  if (error) {
    return (
      <View style={styles.center}>
        {header}
        <View style={styles.panel}>
          <Text style={styles.msgTitle}>Could not start the camera</Text>
          <Text style={styles.msgPlain}>{error}</Text>
          <Button label="Try again" onPress={() => setError(null)} />
        </View>
      </View>
    );
  }

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
  overlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
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
