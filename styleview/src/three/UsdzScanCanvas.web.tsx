import { Center, OrbitControls } from '@react-three/drei';
import { Canvas, useLoader } from '@react-three/fiber';
import { Suspense } from 'react';
import { USDZLoader } from 'three/examples/jsm/loaders/USDZLoader.js';
import type { Group } from 'three';

function UsdzModel({ url }: { url: string }) {
  const scene = useLoader(USDZLoader, url) as Group;
  return (
    <Center>
      <primitive object={scene} />
    </Center>
  );
}

export function UsdzScanCanvas({ url }: { url: string }) {
  return (
    <Canvas camera={{ position: [0, 0.5, 2.2], fov: 45 }} style={{ width: '100%', height: '100%', background: '#12141a' }}>
      <color attach="background" args={['#12141a']} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[3, 5, 2]} intensity={1.1} />
      <Suspense fallback={null}>
        <UsdzModel url={url} />
      </Suspense>
      <OrbitControls makeDefault target={[0, 0.4, 0]} minDistance={0.5} maxDistance={6} />
    </Canvas>
  );
}