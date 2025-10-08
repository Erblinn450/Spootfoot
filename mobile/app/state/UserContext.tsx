import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = { email: string | null; roles: string[]; accessToken: string | null };

type Ctx = {
  user: User;
  setEmail: (email: string | null) => void; // compat rétro
  setAuth: (data: { email: string; roles: string[]; accessToken: string }, password?: string) => Promise<void>;
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
          AsyncStorage.getItem('userEmail'),
          AsyncStorage.getItem('accessToken'),
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
      if (email) await AsyncStorage.setItem('userEmail', email);
      else await AsyncStorage.removeItem('userEmail');
    } catch {}
  };

  const setAuth = async (data: { email: string; roles: string[]; accessToken: string }, password?: string) => {
    setUser({ email: data.email, roles: data.roles || [], accessToken: data.accessToken });
    try {
      const promises = [
        AsyncStorage.setItem('userEmail', data.email),
        AsyncStorage.setItem('accessToken', data.accessToken),
        AsyncStorage.setItem('user_roles', JSON.stringify(data.roles || [])),
      ];
      
      // Store password for auto-refresh (if provided)
      if (password) {
        promises.push(AsyncStorage.setItem('userPassword', password));
      }
      
      await Promise.all(promises);
    } catch {}
  };

  const logout = async () => {
    setUser({ email: null, roles: [], accessToken: null });
    try {
      await Promise.all([
        AsyncStorage.removeItem('userEmail'),
        AsyncStorage.removeItem('accessToken'),
        AsyncStorage.removeItem('userPassword'),
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
