import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiRequest } from "../api/apiClient";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { shouldClearAuthSession } from "./authSessionPolicy";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage("CURRENT_USER", null);
  const [token, setToken] = useState(() => localStorage.getItem("authToken") || "");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // A cached user object is display cache only; always verify the stored JWT with the API.
  useEffect(() => {
    let isMounted = true;
    const storedToken = localStorage.getItem("authToken");
    const verifyToken = async () => {
      if (!storedToken) {
        setUser(null);
        return;
      }
      setAuthLoading(true);
      try {
        const res = await apiRequest("/auth/me");
        if (isMounted && res.data?.user) setUser(res.data.user);
      } catch (error) {
        // A network failure (for example ERR_CONNECTION_REFUSED) or a missing
        // endpoint is not proof that the saved session is invalid.
        if (isMounted && shouldClearAuthSession(error)) {
          localStorage.removeItem("authToken");
          setToken("");
          setUser(null);
        }
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };
    verifyToken();
    return () => {
      isMounted = false;
    };
  // This is a one-time session bootstrap. setUser is backed by local storage
  // and its identity can change when the cached user changes; depending on it
  // here would re-run this request after every successful response.
  }, []);

  const login = useCallback(
    async (email, password) => {
      setAuthLoading(true);
      try {
        const res = await apiRequest("/auth/login", {
          method: "POST",
          body: { email, password },
        });
        const { user: loggedInUser, token: jwtToken } = res.data;
        localStorage.setItem("authToken", jwtToken);
        setToken(jwtToken);
        setUser(loggedInUser);
        setIsAuthModalOpen(false);
        return loggedInUser;
      } catch (err) {
        throw err;
      } finally {
        setAuthLoading(false);
      }
    },
    [setUser]
  );

  const register = useCallback(
    async ({ name, email, password, role }) => {
      setAuthLoading(true);
      try {
        const res = await apiRequest("/auth/register", {
          method: "POST",
          body: { name, email, password, role },
        });
        const { user: newUser, token: jwtToken } = res.data;
        localStorage.setItem("authToken", jwtToken);
        setToken(jwtToken);
        setUser(newUser);
        setIsAuthModalOpen(false);
        return newUser;
      } finally {
        setAuthLoading(false);
      }
    },
    [setUser]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    setToken("");
    setUser(null);
  }, [setUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        authLoading,
        login,
        register,
        logout,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
