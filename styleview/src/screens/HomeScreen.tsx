/*
 * Name:         HomeScreen.tsx
 * Description:  Landing screen: lets the user choose shirts or hairstyles, start
 *               the camera preview, and read the appearance-only and privacy notes.
 * Programmer:   Caleb Hite
 * Created:      2026-11-09
 * Revisions:    2026-11-09  Initial version (Sprint 1 reqs. 1, 7, 34, 35).
 * Preconditions:  `mode` is a valid Mode; callbacks are provided by the parent.
 * Postconditions: Calls `onModeChange` with the tapped mode and `onStart` when the
 *                 user taps "Start camera preview". The camera is NOT started here.
 * Errors:       None; the screen only displays text and forwards taps.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { colors } from '../theme';
import { Mode, MODE_LABEL } from '../types';

type Props = {
  mode: Mode;
  onModeChange: (m: Mode) => void;
  onStart: () => void;
};

export function HomeScreen({ mode, onModeChange, onStart }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Block: title and tagline */}
      <Text style={styles.title}>StyleView</Text>
      <Text style={styles.sub}>Try on shirts and hairstyles with your front camera.</Text>

      {/* Block: mode selector. One button per Mode; the active one is highlighted. */}
      <Text style={styles.section}>What do you want to try on?</Text>
      <View style={styles.row}>
        {(Object.keys(MODE_LABEL) as Mode[]).map((m) => (
          <View key={m} style={styles.flex}>
            <Button
              label={MODE_LABEL[m]}
              variant={mode === m ? 'primary' : 'secondary'}
              onPress={() => onModeChange(m)}
            />
          </View>
        ))}
      </View>

      {/* Block: primary action, hands control to the preview screen */}
      <Button label="Start camera preview" onPress={onStart} />

      {/* Block: disclosures (appearance-only notice and camera/privacy explanation) */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>About StyleView</Text>
        <Text style={styles.body}>
          StyleView shows how a shirt or hairstyle looks on you. It shows appearance only, not
          clothing sizes or fit.
        </Text>
        <Text style={styles.body}>
          Your camera is used only for the live preview. Video stays on your phone: it is never
          uploaded or saved, and the camera turns off when you leave the preview.
        </Text>
        <Text style={styles.body}>
          Pictures and shirts you save later stay in this browser on your device, and you can
          delete them at any time.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Centered column capped at 560px so it also looks right on wide browsers.
  container: { padding: 20, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },
  title: { color: colors.text, fontSize: 34, fontWeight: '800', marginTop: 24 },
  sub: { color: colors.muted, fontSize: 17 },
  section: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 8 },
  // Two equal-width mode buttons side by side.
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, gap: 10, marginTop: 8 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
});
