import React, { ReactNode } from 'react';
import { motion } from 'motion/react';

interface ScreenWrapperProps {
  children: ReactNode;
  transitionType?: 'push' | 'none';
  key?: React.Key;
}

export default function ScreenWrapper({ children, transitionType = 'none' }: ScreenWrapperProps) {
  if (transitionType === 'none') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-screen pb-24"
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: 96, y: 10, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      exit={{ x: -72, y: -6, opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 210, mass: 0.6 }}
      className="min-h-screen pb-24"
    >
      {children}
    </motion.div>
  );
}
