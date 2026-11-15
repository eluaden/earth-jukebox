import { lazy, Suspense, useEffect, useMemo } from 'react';
import { useStore } from './state/store.js';
import { ColdOpen } from './ui/ColdOpen.jsx';
import { Chips, Corners, DateCaption, Footer, LiveRegion, TimeSlider } from './ui/Hud.jsx';
import { About, LinerNotes, Records } from './ui/Panels.jsx';
import { useKeys } from './ui/useKeys.js';
import FlatStage, { hasWebGL } from './flat/FlatStage.jsx';
import { t } from './i18n/strings.js';

const Stage = lazy(() => import('./scene/Stage.jsx'));

export default function App() {
  const phase = useStore((s) => s.phase);
  const lang = useStore((s) => s.lang);
  const meta = useStore((s) => s.meta);
  const panel = useStore((s) => s.panel);
  useKeys();

  const flat = useMemo(() => new URLSearchParams(location.search).has('flat') || !hasWebGL(), []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className={`app phase-${phase} ${panel ? `panel-${panel}` : ''}`}>
      {meta && phase !== 'cold' && (
        <>
          <p className="sr-only">{t(lang, 'sceneDescription')}</p>
          {flat ? (
            <FlatStage />
          ) : (
            <Suspense fallback={null}>
              <Stage />
            </Suspense>
          )}
        </>
      )}
      {phase === 'cold' && <ColdOpen />}
      {phase !== 'cold' && (
        <main className="hud">
          <Corners />
          <DateCaption />
          <Chips />
          <Footer />
          <TimeSlider />
          <Records />
          <LinerNotes />
          <About />
        </main>
      )}
      <LiveRegion />
    </div>
  );
}
