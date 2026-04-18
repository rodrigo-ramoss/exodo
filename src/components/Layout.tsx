import React, { ReactNode } from 'react';
import { Menu, Settings, GraduationCap, Gavel, Library, BookOpen, ExternalLink } from 'lucide-react';
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
  const BLOG_URL = 'https://blog.seuprojeto.com';

  const navItems = [
    { id: Screen.BIBLE, label: 'BÍBLIA', icon: BookOpen },
    { id: Screen.MANA, label: 'MANÁ', icon: GraduationCap },
    { id: Screen.REFUTACAO, label: 'Refutação', icon: Gavel },
    { id: Screen.BOOKSTORE, label: 'Livraria', icon: Library },
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
      <nav className="fixed bottom-0 left-0 w-full z-50 flex items-center px-0.5 pb-safe-area-inset-bottom pb-4 pt-1.5 bg-background/90 backdrop-blur-2xl border-t border-outline-variant/10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setScreen(item.id)}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-0.5 transition-all active:scale-90 flex-1 min-w-0",
                isActive ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-6 rounded-full transition-all",
                isActive && "bg-surface-container-high/60"
              )}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className="font-sans text-[8px] uppercase font-bold tracking-tight mt-0.5 truncate max-w-full leading-none">
                {item.label}
              </span>
            </button>
          );
        })}

        <a
          href={BLOG_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center py-1 px-0.5 transition-all active:scale-90 flex-1 min-w-0 text-on-surface-variant hover:text-on-surface"
        >
          <div className="flex items-center justify-center w-10 h-6 rounded-full transition-all">
            <ExternalLink size={18} strokeWidth={1.8} />
          </div>
          <span className="font-sans text-[8px] uppercase font-bold tracking-tight mt-0.5 truncate max-w-full leading-none">
            Blog
          </span>
        </a>

        {/* Settings — always at the end */}
        <button
          onClick={() => setScreen(Screen.SETTINGS)}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-0.5 transition-all active:scale-90 flex-1 min-w-0",
            currentScreen === Screen.SETTINGS
              ? "text-primary"
              : "text-on-surface-variant hover:text-on-surface"
          )}
        >
          <div className={cn(
            "flex items-center justify-center w-10 h-6 rounded-full transition-all",
            currentScreen === Screen.SETTINGS && "bg-surface-container-high/60"
          )}>
            {photo ? (
              <img
                src={photo}
                alt="Perfil"
                className="w-5 h-5 rounded-full object-cover border border-primary/40"
              />
            ) : (
              <Settings size={18} strokeWidth={currentScreen === Screen.SETTINGS ? 2.5 : 1.8} />
            )}
          </div>
          <span className="font-sans text-[8px] uppercase font-bold tracking-tight mt-0.5 truncate max-w-full leading-none">
            Config
          </span>
        </button>
      </nav>
    </div>
  );
}
