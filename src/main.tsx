import React, { lazy, Suspense, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SyncProvider } from './contexts/SyncContext';
import './index.css';

const Analytics = lazy(() =>
  import('@vercel/analytics/react').then((m) => ({ default: m.Analytics })),
);

function DeferredAnalytics() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const ric =
      (window as { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
        .requestIdleCallback;
    const handle = ric
      ? ric(() => setReady(true), { timeout: 3000 })
      : window.setTimeout(() => setReady(true), 2000);
    return () => {
      const cic = (window as { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
      if (ric && cic) cic(handle as number);
      else window.clearTimeout(handle as number);
    };
  }, []);
  if (!ready) return null;
  return (
    <Suspense fallback={null}>
      <Analytics />
    </Suspense>
  );
}

if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Dark });
  StatusBar.setBackgroundColor({ color: '#38BDF8' });
}

const isWeb = Capacitor.getPlatform() === 'web';
const isNative = Capacitor.isNativePlatform();

const routerProps = isNative ? { initialEntries: ['/play'] } : {};
const Router = isNative ? MemoryRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router {...routerProps}>
      <AuthProvider>
        <SyncProvider>
          <App />
        </SyncProvider>
      </AuthProvider>
      {isWeb && <DeferredAnalytics />}
    </Router>
  </React.StrictMode>,
);
