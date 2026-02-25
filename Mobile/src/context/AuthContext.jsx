import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError, apiFetch } from "../api/client";

const TOKEN_KEY = "medassist_mobile_token";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (!savedToken) return;
        const result = await apiFetch("/api/auth/me/", {}, savedToken);
        setToken(savedToken);
        setUser(result?.data?.user || null);
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
      } finally {
        setBootstrapping(false);
      }
    };

    bootstrap();
  }, []);

  const login = async ({ email, password }) => {
    const result = await apiFetch("/api/auth/token-login/", {
      method: "POST",
      body: { email, password },
    });
    const nextToken = result?.data?.token;
    const nextUser = result?.data?.user || null;
    if (!nextToken || !nextUser) {
      throw new ApiError("Login response is missing token/user.");
    }
    await AsyncStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  };

  const register = async ({ name, email, password, confirmPassword }) => {
    await apiFetch("/api/auth/register/", {
      method: "POST",
      body: {
        name,
        email,
        password,
        confirm_password: confirmPassword,
      },
    });
  };

  const logout = async () => {
    try {
      if (token) {
        await apiFetch("/api/auth/token-logout/", { method: "POST" }, token);
      }
    } catch {
      // Local logout should still complete.
    } finally {
      await AsyncStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({
      token,
      user,
      bootstrapping,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [token, user, bootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
