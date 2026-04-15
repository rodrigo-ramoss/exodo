import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface ProfileContextValue {
  name: string;
  photo: string | null;
  notifications: boolean;
  setName: (name: string) => void;
  setPhoto: (photo: string | null) => void;
  setNotifications: (enabled: boolean) => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

const KEY_NAME = 'exodo:profile-name';
const KEY_PHOTO = 'exodo:profile-photo';
const KEY_NOTIFICATIONS = 'exodo:notifications-enabled';

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [name, setNameState] = useState<string>(() => localStorage.getItem(KEY_NAME) ?? '');
  const [photo, setPhotoState] = useState<string | null>(() => localStorage.getItem(KEY_PHOTO));
  const [notifications, setNotificationsState] = useState<boolean>(
    () => localStorage.getItem(KEY_NOTIFICATIONS) === 'true'
  );

  const setName = (v: string) => {
    setNameState(v);
    localStorage.setItem(KEY_NAME, v);
  };

  const setPhoto = (v: string | null) => {
    setPhotoState(v);
    if (v) localStorage.setItem(KEY_PHOTO, v);
    else localStorage.removeItem(KEY_PHOTO);
  };

  const setNotifications = (v: boolean) => {
    setNotificationsState(v);
    localStorage.setItem(KEY_NOTIFICATIONS, String(v));
  };

  const value = useMemo(
    () => ({ name, photo, notifications, setName, setPhoto, setNotifications }),
    [name, photo, notifications]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile precisa ser usado dentro de ProfileProvider.');
  return ctx;
}
