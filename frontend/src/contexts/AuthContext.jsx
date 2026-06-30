import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");
    if (token && userJson) {
      api.setToken(token);
      setUser(JSON.parse(userJson));
    }
  }, []);

  const login = async (username, password) => {
    const res = await api.post("/users/login", { username, password });
    const token = res.data.access_token;
    api.setToken(token);
    const meRes = await api.get("/users/me");
    setUser(meRes.data);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(meRes.data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    api.setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
