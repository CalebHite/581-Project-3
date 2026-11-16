import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebCamera } from './WebCamera';
import type { OrbitCameraHandle } from './OrbitCamera';

type Props = { onError?: (msg: string) => void };

export const OrbitCamera = forwardRef<OrbitCameraHandle, Props>(function OrbitCamera({ onError }, ref) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    snap: async () => {
      const video = videoRef.current;
      if (!video?.videoWidth) return null;
      const w = video.videoWidth;
      const h = video.videoHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, w, h);
      return canvas.toDataURL('image/jpeg', 0.9);
    },
  }));

  const err = error;
  if (err) return <Text style={styles.err}>{err}</Text>;

  return (
    <View style={styles.fill}>
      <WebCamera
        onVideo={(v) => {
          videoRef.current = v;
        }}
        onError={(m) => {
          setError(m);
          onError?.(m);
        }}
        onSize={() => {}}
        onBox={() => {}}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  fill: { flex: 1, minHeight: 360 },
  err: { color: '#ff6b6b', padding: 16 },
});