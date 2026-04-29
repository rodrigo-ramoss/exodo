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
import Ensinos from './components/Ensinos';

const PATH_BY_SCREEN: Record<Screen, string> = {
  [Screen.HOME]: '/inicio',
  [Screen.BIBLE]: '/biblia',
  [Screen.MANA]: '/mana',
  [Screen.ENSINOS]: '/ensinos',
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
  '/ensinos': Screen.ENSINOS,
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

interface SelahRouteParams {
  themeSlug?: string;
  subsecaoSlug?: string;
  ebookSlug?: string;
}

const parseSelahRoute = (path: string): SelahRouteParams => {
  const raw = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  if (!raw.toLowerCase().startsWith('/selah')) return {};

  const parts = raw.split('/').filter(Boolean).slice(1);
  const decodePart = (value: string) => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  };

  return {
    themeSlug: parts[0] ? decodePart(parts[0]) : undefined,
    subsecaoSlug: parts[1] ? decodePart(parts[1]) : undefined,
    ebookSlug: parts[2] ? decodePart(parts[2]) : undefined,
  };
};

const resolveScreenFromPath = (path: string) => {
  const normalized = normalizePath(path);
  if (normalized.startsWith('/selah/')) return Screen.BOOKSTORE;
  return SCREEN_BY_PATH[normalized] ?? Screen.HOME;
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => resolveScreenFromPath(window.location.pathname));
  const [transitionType, setTransitionType] = useState<'push' | 'none'>('none');

  const handleNavigate = (
    screen: Screen,
    transition: 'push' | 'none' = 'none',
    options?: { syncHistory?: boolean; replace?: boolean; openSlug?: string }
  ) => {
    setTransitionType(transition);
    setCurrentScreen(screen);
    const shouldSyncHistory = options?.syncHistory ?? true;
    if (shouldSyncHistory) {
      const basePath = PATH_BY_SCREEN[screen] ?? PATH_BY_SCREEN[Screen.HOME];
      const targetPath = options?.openSlug
        ? `${basePath}?open=${encodeURIComponent(options.openSlug)}`
        : basePath;
      const currentPath = normalizePath(window.location.pathname);
      const currentTarget = `${currentPath}${window.location.search}`;
      if (currentTarget !== targetPath) {
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
    const openSlug = new URLSearchParams(window.location.search).get('open') || undefined;
    const selahRoute = parseSelahRoute(window.location.pathname);
    switch (currentScreen) {
      case Screen.HOME:
        return <HomeDashboard onNavigate={handleNavigate} />;
      case Screen.BIBLE:
        return <Bible />;
      case Screen.MANA:
        return <Studies openSlug={openSlug} />;
      case Screen.ENSINOS:
        return <Ensinos openSlug={openSlug} />;
      case Screen.EBD:
        return <EBD onNavigate={handleNavigate} />;
      case Screen.BOOKSTORE:
        return (
          <Bookstore
            openSlug={openSlug}
            routeThemeSlug={selahRoute.themeSlug}
            routeSubsecaoSlug={selahRoute.subsecaoSlug}
            routeEbookSlug={selahRoute.ebookSlug}
          />
        );
      case Screen.TOOLS:
        return <Bookstore mode="types" openSlug={openSlug} />;
      case Screen.REFUTACAO:
        return <Refutation openSlug={openSlug} />;
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
