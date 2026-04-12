import React, { ReactNode } from 'react';
import { motion } from 'motion/react';

interface ScreenWrapperProps {
  children: ReactNode;
  transitionType?: 'push' | 'none';
  key?: React.Key;
}

export default function ScreenWrapper({ children, transitionType = 'none' }: ScreenWrapperProps) {
  if (transitionType === 'none') {
    return <div className="min-h-screen pb-24">{children}</div>;
  }

  return (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="min-h-screen pb-24"
    >
      {children}
    </motion.div>
  );
}
