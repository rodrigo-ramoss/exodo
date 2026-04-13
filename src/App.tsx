/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Screen } from './types';
import Layout from './components/Layout';
import ScreenWrapper from './components/ScreenWrapper';
import Home from './components/Home';
import Bible from './components/Bible';
import Studies from './components/Studies';
import EBD from './components/EBD';
import Bookstore from './components/Bookstore';
import Signs from './components/Signs';
import Doctrines from './components/Doctrines';
import Protocol from './components/Protocol';

export default function App() {
  // Build trigger: 2026-04-13 15:00
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.HOME);
  const [transitionType, setTransitionType] = useState<'push' | 'none'>('none');

  const handleNavigate = (screen: Screen, transition: 'push' | 'none' = 'none') => {
    setTransitionType(transition);
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.HOME:
        return <Home onNavigate={handleNavigate} />;
      case Screen.BIBLE:
        return <Bible />;
      case Screen.STUDIES:
        return <Studies />;
      case Screen.EBD:
        return <EBD onNavigate={handleNavigate} />;
      case Screen.BOOKSTORE:
        return <Bookstore />;
      case Screen.SIGNS:
        return <Signs />;
      case Screen.DOCTRINES:
        return <Doctrines />;
      case Screen.PROTOCOL:
        return <Protocol />;
      default:
        return <Home onNavigate={handleNavigate} />;
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
