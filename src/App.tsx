/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Screen } from './types';
import Layout from './components/Layout';
import ScreenWrapper from './components/ScreenWrapper';
import Bible from './components/Bible';
import Studies from './components/Studies';
import EBD from './components/EBD';
import Bookstore from './components/Bookstore';
import Refutation from './components/Refutation';
import Protocol from './components/Protocol';
import Settings from './components/Settings';

export default function App() {
  // Build trigger: 2026-04-13 15:00
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.BIBLE);
  const [transitionType, setTransitionType] = useState<'push' | 'none'>('none');

  const handleNavigate = (screen: Screen, transition: 'push' | 'none' = 'none') => {
    setTransitionType(transition);
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.BIBLE:
        return <Bible />;
      case Screen.MANA:
        return <Studies />;
      case Screen.EBD:
        return <EBD onNavigate={handleNavigate} />;
      case Screen.BOOKSTORE:
        return <Bookstore />;
      case Screen.REFUTACAO:
        return <Refutation />;
      case Screen.APOCRYPHA:
        return <Protocol />;
      case Screen.SETTINGS:
        return <Settings />;
      default:
        return <Bible />;
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
