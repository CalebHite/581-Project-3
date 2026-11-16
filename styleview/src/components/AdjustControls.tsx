/*
 * Name:         AdjustControls.tsx
 * Description:  Buttons to resize and nudge the shirt, plus a reset.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 req. 20).
 * Preconditions:  `adjust` is the current adjustment; `onChange` receives the new one.
 * Postconditions: Scale stays within 0.5-2x; offsets within +/-200 px. "Reset"
 *                 returns to NO_ADJUST.
 * Errors:       None; values are clamped.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, TOUCH } from '../theme';
import { Adjust, NO_ADJUST } from '../types';

type Props = { adjust: Adjust; onChange: (a: Adjust) => void };

const STEP = 20;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function Key({ label, onPress, wide }: { label: string; onPress: () => void; wide?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.key, wide && styles.wide, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.keyText}>{label}</Text>
    </Pressable>
  );
}

export function AdjustControls({ adjust, onChange }: Props) {
  const set = (p: Partial<Adjust>) =>
    onChange({
      scale: clamp(p.scale ?? adjust.scale, 0.5, 2),
      dx: clamp(p.dx ?? adjust.dx, -200, 200),
      dy: clamp(p.dy ?? adjust.dy, -200, 200),
    });

  return (
    <View style={styles.bar}>
      <Key label="Smaller" onPress={() => set({ scale: adjust.scale - 0.05 })} wide />
      <Key label="Bigger" onPress={() => set({ scale: adjust.scale + 0.05 })} wide />
      <Key label="←" onPress={() => set({ dx: adjust.dx - STEP })} />
      <Key label="↑" onPress={() => set({ dy: adjust.dy - STEP })} />
      <Key label="↓" onPress={() => set({ dy: adjust.dy + STEP })} />
      <Key label="→" onPress={() => set({ dx: adjust.dx + STEP })} />
      <Key label="Reset" onPress={() => onChange(NO_ADJUST)} wide />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  key: {
    minWidth: TOUCH,
    minHeight: TOUCH,
    borderRadius: 10,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  wide: { paddingHorizontal: 16 },
  keyText: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
