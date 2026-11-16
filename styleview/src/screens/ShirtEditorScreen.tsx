/*
 * Name:         ShirtEditorScreen.tsx
 * Description:  Guided flow for using the user's own shirt: take or upload a
 *               picture, crop/rotate, trace to remove the background, and mark
 *               key points. Processing is done by the StyleView backend.
 * Programmer:   Caleb Hite
 * Created:      2026-11-16
 * Revisions:    2026-11-16  Initial version (Sprint 2 reqs. 12-19).
 * Preconditions:  Backend reachable at API_URL (see config.ts).
 * Postconditions: Calls `onDone(shirt)` with the finished picture and key points,
 *                 or `onCancel` if the user leaves. Pictures live in memory only.
 * Errors:       Unusable pictures and server problems show an error message with
 *               the reason (req. 14); the user can pick another picture.
 */
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polygon, Polyline, Rect } from 'react-native-svg';
import { Button } from '../components/Button';
import { ImageCanvas } from '../components/ImageCanvas';
import {
  ApiError,
  cutoutShirt,
  FALLBACK_TIPS,
  fetchTips,
  normalizeShirt,
  transformShirt,
  validateShirt,
} from '../services/api';
import { colors } from '../theme';
import { DEFAULT_KEYPOINTS, Point, Shirt } from '../types';

type Props = { onDone: (s: Shirt) => void; onCancel: () => void };
type Step = 'source' | 'crop' | 'trace' | 'points';

// Order in which key points are placed (req. 18).
const POINT_PROMPTS = ['Tap the LEFT shoulder seam', 'Tap the RIGHT shoulder seam', 'Tap the bottom hem (center)'];

type Inset = { l: number; t: number; r: number; b: number };

// Plus/minus control for one crop edge (percent of the picture, 0-40).
function Stepper({
  label,
  k,
  inset,
  setInset,
}: {
  label: string;
  k: keyof Inset;
  inset: Inset;
  setInset: (i: Inset) => void;
}) {
  return (
    <View style={styles.stepper}>
      <Text style={styles.stepLabel}>
        {label}: {inset[k]}%
      </Text>
      <View style={styles.stepBtns}>
        <View style={styles.flex}>
          <Button label="−" variant="secondary" onPress={() => setInset({ ...inset, [k]: Math.max(0, inset[k] - 5) })} />
        </View>
        <View style={styles.flex}>
          <Button label="+" variant="secondary" onPress={() => setInset({ ...inset, [k]: Math.min(40, inset[k] + 5) })} />
        </View>
      </View>
    </View>
  );
}

export function ShirtEditorScreen({ onDone, onCancel }: Props) {
  const [step, setStep] = useState<Step>('source');
  const [uri, setUri] = useState<string | null>(null);
  const [size, setSize] = useState({ w: 1, h: 1 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tips, setTips] = useState<string[]>(FALLBACK_TIPS);
  const [inset, setInset] = useState({ l: 0, t: 0, r: 0, b: 0 }); // crop, in percent
  const [trace, setTrace] = useState<Point[]>([]);
  const [marks, setMarks] = useState<Point[]>([]);

  useEffect(() => {
    fetchTips().then(setTips);
  }, []);

  // Block: run a backend task with a spinner and uniform error reporting.
  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  // Block: show a new working picture and measure it.
  const setWorking = (next: string) =>
    new Promise<void>((resolve, reject) =>
      Image.getSize(
        next,
        (w, h) => {
          setUri(next);
          setSize({ w, h });
          resolve();
        },
        () => reject(new ApiError('That picture could not be shown. Please try another.')),
      ),
    );

  // Block: reqs. 12/13 - take or choose a picture, check it (req. 14), then tidy it.
  const pick = (source: 'camera' | 'library') =>
    run(async () => {
      if (source === 'camera' && Platform.OS !== 'web') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) throw new ApiError('Camera access is needed to take a picture. You can upload one instead.');
      }
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 })
          : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
      if (result.canceled || !result.assets?.[0]) return;
      const picked = result.assets[0].uri;
      await validateShirt(picked); // throws a friendly error for unusable pictures
      await setWorking(await normalizeShirt(picked));
      setInset({ l: 0, t: 0, r: 0, b: 0 });
      setTrace([]);
      setMarks([]);
      setStep('crop');
    });

  // Block: req. 16 - rotate or crop through the backend.
  const rotate = () => run(async () => setWorking(await transformShirt(uri!, { rotate: 90 })));
  const applyCrop = () =>
    run(async () => {
      const crop = {
        x: inset.l / 100,
        y: inset.t / 100,
        w: 1 - (inset.l + inset.r) / 100,
        h: 1 - (inset.t + inset.b) / 100,
      };
      await setWorking(await transformShirt(uri!, { crop }));
      setInset({ l: 0, t: 0, r: 0, b: 0 });
      setTrace([]);
      setMarks([]);
    });

  // Block: req. 17 - remove the background outside the traced outline.
  const cutout = () =>
    run(async () => {
      await setWorking(await cutoutShirt(uri!, trace));
      setTrace([]);
      setStep('points');
    });

  const finish = (keyPoints = DEFAULT_KEYPOINTS) =>
    uri && onDone({ uri, width: size.w, height: size.h, keyPoints });

  // Block: turn the three tapped marks into key points (left shoulder has smaller x).
  const finishWithMarks = () => {
    const [a, b, hem] = marks;
    finish({
      leftShoulder: a.x <= b.x ? a : b,
      rightShoulder: a.x <= b.x ? b : a,
      hem,
    });
  };

  const aspect = size.h / size.w;
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Button label="Back" variant="secondary" onPress={onCancel} />
      <Text style={styles.title}>Use your own shirt</Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Can&apos;t use that picture</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      {busy && <ActivityIndicator color={colors.accent} size="large" />}

      {/* Step 1: choose a picture + tips */}
      {step === 'source' && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tips for a clear shirt picture</Text>
            {tips.map((t) => (
              <Text key={t} style={styles.body}>
                • {t}
              </Text>
            ))}
          </View>
          <Button label="Take a picture" onPress={() => pick('camera')} />
          <Button label="Upload a picture" variant="secondary" onPress={() => pick('library')} />
        </>
      )}

      {/* Step 2: rotate and crop */}
      {step === 'crop' && uri && (
        <>
          <Text style={styles.section}>Rotate and crop</Text>
          <ImageCanvas uri={uri} aspect={aspect}>
            {({ width, height }) => (
              <Svg width={width} height={height}>
                <Rect
                  x={(inset.l / 100) * width}
                  y={(inset.t / 100) * height}
                  width={width * (1 - (inset.l + inset.r) / 100)}
                  height={height * (1 - (inset.t + inset.b) / 100)}
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth={3}
                />
              </Svg>
            )}
          </ImageCanvas>
          <Button label="Rotate 90°" variant="secondary" onPress={rotate} />
          <View style={styles.grid}>
            <Stepper label="Left" k="l" inset={inset} setInset={setInset} />
            <Stepper label="Right" k="r" inset={inset} setInset={setInset} />
            <Stepper label="Top" k="t" inset={inset} setInset={setInset} />
            <Stepper label="Bottom" k="b" inset={inset} setInset={setInset} />
          </View>
          <Button label="Apply crop" variant="secondary" onPress={applyCrop} />
          <Button label="Next: trace the shirt" onPress={() => setStep('trace')} />
        </>
      )}

      {/* Step 3: trace around the shirt to remove the background */}
      {step === 'trace' && uri && (
        <>
          <Text style={styles.section}>Tap around the edge of the shirt</Text>
          <Text style={styles.body}>Add points along the outline, then remove the background.</Text>
          <ImageCanvas uri={uri} aspect={aspect} onTap={(p) => setTrace([...trace, p])}>
            {({ width, height }) => {
              const pts = trace.map((p) => `${p.x * width},${p.y * height}`).join(' ');
              return (
                <Svg width={width} height={height}>
                  {trace.length >= 3 ? (
                    <Polygon points={pts} fill="rgba(124,92,255,0.2)" stroke={colors.accent} strokeWidth={2} />
                  ) : (
                    <Polyline points={pts} fill="none" stroke={colors.accent} strokeWidth={2} />
                  )}
                  {trace.map((p, i) => (
                    <Circle key={i} cx={p.x * width} cy={p.y * height} r={5} fill={colors.accent} />
                  ))}
                </Svg>
              );
            }}
          </ImageCanvas>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Button label="Undo" variant="secondary" onPress={() => setTrace(trace.slice(0, -1))} />
            </View>
            <View style={styles.flex}>
              <Button label="Clear" variant="secondary" onPress={() => setTrace([])} />
            </View>
          </View>
          {trace.length >= 3 && <Button label="Remove background" onPress={cutout} />}
          <Button label="Skip this step" variant="secondary" onPress={() => setStep('points')} />
        </>
      )}

      {/* Step 4: mark key points to line the shirt up */}
      {step === 'points' && uri && (
        <>
          <Text style={styles.section}>
            {marks.length < 3 ? POINT_PROMPTS[marks.length] : 'Key points set'}
          </Text>
          <ImageCanvas
            uri={uri}
            aspect={aspect}
            onTap={(p) => marks.length < 3 && setMarks([...marks, p])}
          >
            {({ width, height }) => (
              <Svg width={width} height={height}>
                {marks.map((p, i) => (
                  <Circle key={i} cx={p.x * width} cy={p.y * height} r={8} fill={colors.accent} stroke="#fff" strokeWidth={2} />
                ))}
              </Svg>
            )}
          </ImageCanvas>
          <Button label="Reset points" variant="secondary" onPress={() => setMarks([])} />
          {marks.length === 3 ? (
            <Button label="Try it on" onPress={finishWithMarks} />
          ) : (
            <Button label="Use automatic points" variant="secondary" onPress={() => finish()} />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14, maxWidth: 560, width: '100%', alignSelf: 'center' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800' },
  section: { color: colors.text, fontSize: 18, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, gap: 8 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  errorBox: { backgroundColor: colors.card, borderLeftWidth: 4, borderLeftColor: colors.danger, padding: 14, borderRadius: 8, gap: 4 },
  errorTitle: { color: colors.danger, fontSize: 16, fontWeight: '700' },
  errorText: { color: colors.text, fontSize: 15 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  stepper: { width: '47%', gap: 6 },
  stepLabel: { color: colors.muted, fontSize: 14 },
  stepBtns: { flexDirection: 'row', gap: 8 },
});
