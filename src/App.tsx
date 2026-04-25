/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Screen } from './types';
import Layout from './components/Layout';
import ScreenWrapper from './components/ScreenWrapper';
import HomeDashboard from './components/HomeDashboard';
import Bible from './components/Bible';
import Studies from './components/Studies';
import EBD from './components/EBD';
import Bookstore from './components/Bookstore';
import Refutation from './components/Refutation';
import Protocol from './components/Protocol';
import Settings from './components/Settings';

const PATH_BY_SCREEN: Record<Screen, string> = {
  [Screen.HOME]: '/inicio',
  [Screen.BIBLE]: '/biblia',
  [Screen.MANA]: '/mana',
  [Screen.EBD]: '/ebd',
  [Screen.BOOKSTORE]: '/selah',
  [Screen.TOOLS]: '/tipos',
  [Screen.REFUTACAO]: '/babel',
  [Screen.APOCRYPHA]: '/apocrifos',
  [Screen.SETTINGS]: '/configuracoes',
};

const SCREEN_BY_PATH: Record<string, Screen> = {
  '/': Screen.HOME,
  '/inicio': Screen.HOME,
  '/dashboard': Screen.HOME,
  '/home': Screen.HOME,
  '/biblia': Screen.BIBLE,
  '/mana': Screen.MANA,
  '/ebd': Screen.EBD,
  '/selah': Screen.BOOKSTORE,
  '/tipos': Screen.TOOLS,
  '/babel': Screen.REFUTACAO,
  '/apocrifos': Screen.APOCRYPHA,
  '/configuracoes': Screen.SETTINGS,
};

const normalizePath = (path: string) => {
  if (!path) return '/';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1).toLowerCase();
  return path.toLowerCase();
};

const resolveScreenFromPath = (path: string) => SCREEN_BY_PATH[normalizePath(path)] ?? Screen.HOME;

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => resolveScreenFromPath(window.location.pathname));
  const [transitionType, setTransitionType] = useState<'push' | 'none'>('none');

  const handleNavigate = (
    screen: Screen,
    transition: 'push' | 'none' = 'none',
    options?: { syncHistory?: boolean; replace?: boolean }
  ) => {
    setTransitionType(transition);
    setCurrentScreen(screen);
    const shouldSyncHistory = options?.syncHistory ?? true;
    if (shouldSyncHistory) {
      const targetPath = PATH_BY_SCREEN[screen] ?? PATH_BY_SCREEN[Screen.HOME];
      const currentPath = normalizePath(window.location.pathname);
      if (currentPath !== targetPath) {
        if (options?.replace) {
          window.history.replaceState(null, '', targetPath);
        } else {
          window.history.pushState(null, '', targetPath);
        }
      }
    }
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const path = normalizePath(window.location.pathname);
    if (path === '/') {
      handleNavigate(Screen.HOME, 'none', { replace: true });
      return;
    }

    const screenFromPath = resolveScreenFromPath(path);
    if (screenFromPath !== currentScreen) {
      handleNavigate(screenFromPath, 'none', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const screenFromPath = resolveScreenFromPath(window.location.pathname);
      handleNavigate(screenFromPath, 'none', { syncHistory: false });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.HOME:
        return <HomeDashboard onNavigate={handleNavigate} />;
      case Screen.BIBLE:
        return <Bible />;
      case Screen.MANA:
        return <Studies />;
      case Screen.EBD:
        return <EBD onNavigate={handleNavigate} />;
      case Screen.BOOKSTORE:
        return <Bookstore />;
      case Screen.TOOLS:
        return <Bookstore mode="types" />;
      case Screen.REFUTACAO:
        return <Refutation />;
      case Screen.APOCRYPHA:
        return <Protocol />;
      case Screen.SETTINGS:
        return <Settings />;
      default:
        return <HomeDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout currentScreen={currentScreen} setScreen={(s) => handleNavigate(s, 'none')}>
      <AnimatePresence mode="wait">
        <ScreenWrapper key={currentScreen} transitionType={transitionType}>
          {renderScreen()}
        </ScreenWrapper>
      </AnimatePresence>
    </Layout>
  );
}
