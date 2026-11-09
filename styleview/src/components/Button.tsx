import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, TOUCH } from '../theme';

type Props = { label: string; onPress: () => void; variant?: 'primary' | 'secondary' };

export function Button({ label, onPress, variant = 'primary' }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
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
  btn: {
    minHeight: TOUCH,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.muted },
  label: { color: colors.text, fontSize: 17, fontWeight: '600' },
});
