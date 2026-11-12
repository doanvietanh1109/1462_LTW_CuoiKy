import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiRequest } from "../api/apiClient";
import { useLocalStorage } from "../hooks/useLocalStorage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage("CURRENT_USER", null);
  const [token, setToken] = useState(() => localStorage.getItem("authToken") || "");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Đồng bộ thông tin user từ token khi khởi chạy
  useEffect(() => {
    let isMounted = true;
    const storedToken = localStorage.getItem("authToken");
    if (storedToken && !user) {
      apiRequest("/auth/me")
        .then((res) => {
          if (isMounted && res.data?.user) {
            setUser(res.data.user);
          }
        })
        .catch(() => {
          if (isMounted) {
            localStorage.removeItem("authToken");
            setToken("");
            setUser(null);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user, setUser]);

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
        // Fallback offline với tài khoản demo giống hệt auth.js của frontend gốc
        const demoUsers = {
          "Vu69@gmail.com": {
            _id: "demo-admin",
            name: "Vũ Admin",
            email: "Vu69@gmail.com",
            pass: "admin123",
            role: "admin",
          },
          "landlord@example.com": {
            _id: "demo-landlord",
            name: "Minh Landlord",
            email: "landlord@example.com",
            pass: "landlord123",
            role: "landlord",
          },
          "user@example.com": {
            _id: "demo-user1",
            name: "Nguyễn Văn An",
            email: "user@example.com",
            pass: "user123",
            role: "user",
          },
          "sinhvien2@example.com": {
            _id: "demo-user2",
            name: "Trần Thị Bình",
            email: "sinhvien2@example.com",
            pass: "user123",
            role: "user",
          },
        };
        const demo = demoUsers[email];
        if (demo && demo.pass === password) {
          localStorage.setItem("authToken", "demo-offline-token");
          setToken("demo-offline-token");
          setUser(demo);
          setIsAuthModalOpen(false);
          return demo;
        }
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
