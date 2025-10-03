import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = { email: string | null; roles: string[]; accessToken: string | null };

type Ctx = {
  user: User;
  setEmail: (email: string | null) => void; // compat rétro
  setAuth: (data: { email: string; roles: string[]; accessToken: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
};

export const UserContext = React.createContext<Ctx | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User>({ email: null, roles: [], accessToken: null });

  // Chargement initial depuis le stockage
  React.useEffect(() => {
    (async () => {
      try {
        const [email, token, rolesStr] = await Promise.all([
          AsyncStorage.getItem('user_email'),
          AsyncStorage.getItem('access_token'),
          AsyncStorage.getItem('user_roles'),
        ]);
        setUser({ email, accessToken: token, roles: rolesStr ? JSON.parse(rolesStr) : [] });
      } catch {}
    })();
  }, []);

  // Compat: setter email seul
  const setEmail = async (email: string | null) => {
    setUser((u) => ({ ...u, email }));
    try {
      if (email) await AsyncStorage.setItem('user_email', email);
      else await AsyncStorage.removeItem('user_email');
    } catch {}
  };

  const setAuth = async (data: { email: string; roles: string[]; accessToken: string }) => {
    setUser({ email: data.email, roles: data.roles || [], accessToken: data.accessToken });
    try {
      await Promise.all([
        AsyncStorage.setItem('user_email', data.email),
        AsyncStorage.setItem('access_token', data.accessToken),
        AsyncStorage.setItem('user_roles', JSON.stringify(data.roles || [])),
      ]);
    } catch {}
  };

  const logout = async () => {
    setUser({ email: null, roles: [], accessToken: null });
    try {
      await Promise.all([
        AsyncStorage.removeItem('user_email'),
        AsyncStorage.removeItem('access_token'),
        AsyncStorage.removeItem('user_roles'),
        AsyncStorage.removeItem('last_reservation'),
      ]);
    } catch {}
  };

  const isAdmin = !!user.roles?.includes('admin');

  return (
    <UserContext.Provider value={{ user, setEmail, setAuth, logout, isAdmin }}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  const ctx = React.useContext(UserContext);
  if (!ctx) throw new Error('UserContext non fourni');
  return ctx;
}
