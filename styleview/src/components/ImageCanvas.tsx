/*
 * Name:         ImageCanvas.tsx
 * Description:  Shows a picture at the available width and reports taps as
 *               normalized (0-1) positions. Children draw overlays (SVG marks).
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 reqs. 16, 17, 18).
 * Preconditions:  `aspect` is image height / width (> 0).
 * Postconditions: Calls `onTap(point)` with a point clamped to 0-1. Children receive
 *                 the rendered pixel size and must not capture touches.
 * Errors:       None; taps before layout is measured are ignored.
 */
import { ReactNode, useState } from 'react';
import { GestureResponderEvent, Image, Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { Point } from '../types';

type Props = {
  uri: string;
  aspect: number;
  onTap?: (p: Point) => void;
  children?: (size: { width: number; height: number }) => ReactNode;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function ImageCanvas({ uri, aspect, onTap, children }: Props) {
  const [width, setWidth] = useState(0);
  // Cap the height so tall pictures still fit on a phone screen.
  const maxH = 460;
  const height = Math.min(width * aspect, maxH);
  const w = Math.min(width, height / aspect);

  const handle = (e: GestureResponderEvent) => {
    if (!onTap || w === 0) return;
    const { locationX, locationY } = e.nativeEvent;
    onTap({ x: clamp01(locationX / w), y: clamp01(locationY / height) });
  };

  return (
    <View style={styles.wrap} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Pressable onPress={handle} style={{ width: w, height }}>
          {/* Checker-style backdrop so transparent areas are visible after cut-out. */}
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backdrop]} />
          <Image
            source={{ uri }}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            resizeMode="stretch"
          />
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {children?.({ width: w, height })}
          </View>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center' },
  backdrop: { backgroundColor: '#3a3f4b' },
});
