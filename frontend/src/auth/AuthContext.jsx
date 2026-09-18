import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchCurrentUser, loginUser, registerUser } from "../api/client.js";
import { clearAccessToken, getAccessToken, setAccessToken } from "./tokenStorage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const hydrate = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const profile = await fetchCurrentUser();
      setUser(profile);
    } catch {
      clearAccessToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    hydrate().finally(() => setInitializing(false));
  }, [hydrate]);

  const login = useCallback(async ({ email, password }) => {
    const { access_token: accessToken } = await loginUser({ email, password });
    setAccessToken(accessToken);
    const profile = await fetchCurrentUser();
    setUser(profile);
    return profile;
  }, []);

  const register = useCallback(
    async ({ email, password, name }) => {
      await registerUser({ email, password, name });
      return login({ email, password });
    },
    [login],
  );

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser: hydrate,
    }),
    [user, initializing, login, register, logout, hydrate],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
