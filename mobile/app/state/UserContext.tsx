import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = { email: string | null };

type Ctx = {
  user: User;
  setEmail: (email: string | null) => void;
};

export const UserContext = React.createContext<Ctx | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User>({ email: null });

  // Chargement initial depuis le stockage
  React.useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('user_email');
        if (saved) setUser({ email: saved });
      } catch {}
    })();
  }, []);

  // Setter qui persiste
  const setEmail = async (email: string | null) => {
    setUser({ email });
    try {
      if (email) await AsyncStorage.setItem('user_email', email);
      else await AsyncStorage.removeItem('user_email');
    } catch {}
  };

  return (
    <UserContext.Provider value={{ user, setEmail }}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  const ctx = React.useContext(UserContext);
  if (!ctx) throw new Error('UserContext non fourni');
  return ctx;
}
