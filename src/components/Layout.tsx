import React, { ReactNode } from 'react';
import { Menu, Settings, BookOpen, GraduationCap, Gavel, Library, Eye, Shield } from 'lucide-react';
import { Screen } from '../types';
import { cn } from '../lib/utils';
import { useProfile } from '../state/ProfileContext';

interface LayoutProps {
  children: ReactNode;
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
}

export default function Layout({ children, currentScreen, setScreen }: LayoutProps) {
  const { photo } = useProfile();

  const navItems = [
    { id: Screen.BIBLE, label: 'Bíblia', icon: BookOpen },
    { id: Screen.STUDIES, label: 'Estudos', icon: GraduationCap },
    { id: Screen.APOCRYPHA, label: 'Apócrifos', icon: Shield },
    { id: Screen.DOCTRINES, label: 'Doutrinas', icon: Gavel },
    { id: Screen.BOOKSTORE, label: 'Livraria', icon: Library },
    { id: Screen.SIGNS, label: 'Sinais', icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface selection:bg-primary/30">
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 glass-header flex justify-between items-center px-4 h-14 border-b border-outline-variant/10">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setScreen(Screen.HOME)}
            className="text-primary hover:text-primary/80 transition-colors active:scale-95 p-1"
          >
            <Menu size={20} />
          </button>
          <h1 
            className="text-xl font-black text-primary tracking-tighter font-headline uppercase cursor-pointer"
            onClick={() => setScreen(Screen.HOME)}
          >
            ÊXODO
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-14">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-1 pb-4 pt-2 bg-background/90 backdrop-blur-2xl border-t border-outline-variant/10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-3 transition-all active:scale-90 flex-1",
                isActive ? "text-primary bg-surface-container-high/50 rounded-xl" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-sans text-[9px] uppercase font-bold tracking-tight mt-1">
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Settings — always at the end */}
        <button
          onClick={() => setScreen(Screen.SETTINGS)}
          className={cn(
            "flex flex-col items-center justify-center py-1.5 px-3 transition-all active:scale-90 flex-1",
            currentScreen === Screen.SETTINGS
              ? "text-primary bg-surface-container-high/50 rounded-xl"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          {photo ? (
            <img
              src={photo}
              alt="Perfil"
              className="w-5 h-5 rounded-full object-cover border border-primary/40"
            />
          ) : (
            <Settings size={20} strokeWidth={currentScreen === Screen.SETTINGS ? 2.5 : 2} />
          )}
          <span className="font-sans text-[9px] uppercase font-bold tracking-tight mt-1">
            Config
          </span>
        </button>
      </nav>
    </div>
  );
}
