/*
 * Name:         Button.tsx
 * Description:  Reusable touch-friendly button used across all screens.
 * Programmer:   Caleb Hite
 * Created:      2026-11-09
 * Revisions:    2026-11-09  Initial version (Sprint 1, req. 1 mobile-friendly UI).
 * Preconditions:  `label` is a non-empty string; `onPress` is a function.
 * Postconditions: Renders a button at least TOUCH px tall that calls `onPress`
 *                 once per tap and dims while pressed.
 * Errors:       None thrown; an `onPress` that throws propagates to the caller's
 *               error handling.
 */
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, TOUCH } from '../theme';

type Props = { label: string; onPress: () => void; variant?: 'primary' | 'secondary' };

export function Button({ label, onPress, variant = 'primary' }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      // Style array: base look, optional secondary look, dim while pressed.
      style={({ pressed }) => [
        styles.btn,
        variant === 'secondary' && styles.secondary,
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Filled accent button; minHeight keeps the touch target phone-sized.
  btn: {
    minHeight: TOUCH,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Outlined look for non-primary actions (Back, unselected mode).
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.muted },
  label: { color: colors.text, fontSize: 17, fontWeight: '600' },
});
