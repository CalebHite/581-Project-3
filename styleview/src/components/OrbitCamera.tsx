import { CameraView, useCameraPermissions } from 'expo-camera';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors } from '../theme';

export type OrbitCameraHandle = {
  snap: () => Promise<string | null>;
};

type Props = { onError?: (msg: string) => void };

export const OrbitCamera = forwardRef<OrbitCameraHandle, Props>(function OrbitCamera({ onError }, ref) {
  const cam = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useImperativeHandle(ref, () => ({
    snap: async () => {
      try {
        const photo = await cam.current?.takePictureAsync({ quality: 0.86 });
        return photo?.uri ?? null;
      } catch (e: any) {
        onError?.(e?.message ?? 'Capture failed');
        return null;
      }
    },
  }));

  if (!permission) return <Text style={styles.muted}>Checking camera…</Text>;

  if (!permission.granted) {
    return (
      <View style={styles.pad}>
        <Text style={styles.muted}>Camera access is required to scan a person.</Text>
        <Button label="Allow camera" onPress={requestPermission} />
      </View>
    );
  }

  return <CameraView ref={cam} style={styles.fill} facing="back" />;
});

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 360 },
  pad: { flex: 1, justifyContent: 'center', padding: 16, gap: 12 },
  muted: { color: colors.muted, textAlign: 'center' },
});