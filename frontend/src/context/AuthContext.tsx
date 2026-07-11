import { createContext, type ReactNode, useCallback, useEffect, useState } from 'react';
import type { User } from '@/types/api';
import { TOKEN_STORAGE_KEY } from '@/services/api-client';
import * as authService from '@/services/auth.service';

const USER_STORAGE_KEY = 'car_dealership_user';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  // Starts true: on first mount we don't yet know if a previous session
  // exists in localStorage. Without this flag, a protected route would
  // flash a redirect-to-login for an already-logged-in user before we've
  // even had a chance to read localStorage.
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore a session from a previous visit. We deliberately do NOT
    // verify the token against the backend here (e.g. a "whoami" call) --
    // that's a legitimate alternative design, but it costs a network
    // round-trip on every page load. Instead we trust the stored user
    // optimistically; if the token has actually expired, the first real
    // API call will get a 401, and our axios response interceptor
    // (added below) handles clearing the stale session then.
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
      } catch {
        // Corrupted localStorage data -- treat as logged out rather than
        // crash the app on load.
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const persistSession = useCallback((newUser: User, token: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authService.login({ email, password });
      persistSession(response.user, response.token);
    },
    [persistSession],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const response = await authService.register({ email, password, name });
      persistSession(response.user, response.token);
    },
    [persistSession],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: user !== null, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
