import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { API_URL } from '../config';
import { colors } from '../theme';

type Props = {
  onStartPersonScan: () => void;
};

export function HomeScreen({ onStartPersonScan }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>StyleView</Text>
      <Text style={styles.sub}>
        Orbit photos around a still person → Apple Photogrammetry on your Mac → USDZ model.
      </Text>

      <Button label="Scan person" onPress={onStartPersonScan} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Before you scan</Text>
        <Text style={styles.body}>
          1. Build the CLI: cd backend/native && swift build -c release{'\n'}
          2. Start backend: cd backend && npm run dev (port 3001){'\n'}
          3. Same Wi‑Fi for phone + Mac. Set EXPO_PUBLIC_API_URL in styleview/.env if needed.
        </Text>
        <Text style={styles.meta}>API: {API_URL}</Text>
        <Text style={styles.body}>
          Reconstruction usually takes several minutes. See README.md in the repo root for full setup.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 16, maxWidth: 560, width: '100%', alignSelf: 'center' },
  title: { color: colors.text, fontSize: 34, fontWeight: '800', marginTop: 24 },
  sub: { color: colors.muted, fontSize: 17, lineHeight: 24 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, gap: 10, marginTop: 8 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  meta: { color: colors.text, fontSize: 13, fontFamily: 'monospace' },
});