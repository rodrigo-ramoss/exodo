import React, { useRef, useState } from 'react';
import { User, Bell, Camera } from 'lucide-react';
import { cn } from '../lib/utils';
import { useProfile } from '../state/ProfileContext';
import ProgressSection from './ProgressSection';

export default function Settings() {
  const { name, photo, notifications, setName, setPhoto, setNotifications } = useProfile();
  const [nameSaved, setNameSaved] = useState(false);
  const [localName, setLocalName] = useState(name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleSaveName() {
    setName(localName);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <h2 className="font-headline text-2xl font-black tracking-tighter text-on-surface uppercase">
          Configurações
        </h2>
        <p className="text-on-surface-variant text-xs mt-1">Personalize sua experiência</p>
      </div>

      {/* Profile Section */}
      <section className="px-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <User size={14} className="text-primary" />
          <span className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
            Perfil
          </span>
        </div>

        <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-6">
          {/* Photo Upload */}
          <div className="flex flex-col items-center mb-6">
            <div
              className="relative w-24 h-24 rounded-full bg-surface-container border-2 border-primary/30 overflow-hidden cursor-pointer group active:scale-95 transition-transform"
              onClick={() => fileInputRef.current?.click()}
            >
              {photo ? (
                <img src={photo} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={36} className="text-on-surface-variant/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-primary text-[10px] uppercase tracking-widest font-bold"
            >
              {photo ? 'Alterar foto' : 'Adicionar foto'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-2">
              Nome
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                placeholder="Seu nome"
                className="flex-1 bg-surface-container rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/40 border border-outline-variant/20 focus:outline-none focus:border-primary/50 transition-colors"
              />
              <button
                onClick={handleSaveName}
                className={cn(
                  "px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95",
                  nameSaved
                    ? "bg-primary/20 text-primary"
                    : "bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary"
                )}
              >
                {nameSaved ? 'Salvo!' : 'Salvar'}
              </button>
            </div>
            {localName && (
              <p className="mt-2 text-[10px] text-on-surface-variant/60">
                Saudação na Home:{' '}
                <span className="text-primary font-bold">Bem-vindo ao deserto, {localName}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="px-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={14} className="text-primary" />
          <span className="font-headline text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant">
            Notificações
          </span>
        </div>

        <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-on-surface">Ativar notificações</p>
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                Receba alertas de novos temas do MANA e profecias
              </p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 active:scale-95",
                notifications ? "bg-primary" : "bg-surface-container-high"
              )}
              aria-label="Alternar notificações"
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200",
                  notifications ? "translate-x-6" : "translate-x-0"
                )}
              />
            </button>
          </div>

          {notifications && (
            <div className="mt-4 pt-4 border-t border-outline-variant/10">
              <p className="text-[10px] text-on-surface-variant/60 leading-relaxed">
                As notificações serão ativadas via Service Worker em breve. Mantenha essa opção habilitada para receber os alertas quando estiverem disponíveis.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Progress Section */}
      <ProgressSection />

      {/* App info */}
      <div className="px-6 mt-auto">
        <p className="text-center text-[9px] uppercase tracking-widest text-on-surface-variant/30 font-bold">
          Êxodo · v1.0 · Investigação Especial
        </p>
      </div>
    </div>
  );
}
