"use client";

import type React from "react";
import { useState, useEffect, createContext, useContext } from "react";
import type { User } from "@/types";

// --- AuthService ---
// (Aucun changement ici, la classe AuthService reste la même)
export class AuthService {
  private static currentUser: User | null = null;

  static async login(email: string, password: string): Promise<User | null> {
    try {
      console.log("🔐 Tentative de connexion pour:", email);
      const response = await fetch(`/api/users?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
      const data = await response.json();
      console.log("📥 Réponse de connexion:", response.status, data);
      if (response.ok && data.success) {
        const user = data.user;
        this.currentUser = user;
        // Standardisation de la clé
        localStorage.setItem("user-session", JSON.stringify(user));
        console.log("✅ Connexion réussie:", user);
        return user;
      } else {
        console.error("❌ Échec de connexion:", data.error);
        return null;
      }
    } catch (error) {
      console.error("❌ Erreur lors de la connexion:", error);
      return null;
    }
  }

  static logout(): void {
    this.currentUser = null;
    localStorage.removeItem("user-session");
  }

  static getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;

    if (typeof window !== "undefined") {
      // Standardisation de la clé
      const stored = localStorage.getItem("user-session");
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
          return this.currentUser;
        } catch (e) {
          console.error("Erreur d'analyse de la session utilisateur:", e);
          localStorage.removeItem("user-session");
          return null;
        }
      }
    }
    return null;
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  static hasPermission(action: "read" | "write" | "admin"): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    switch (action) {
      case "read": return ["reader", "contributor", "admin"].includes(user.role);
      case "write": return ["contributor", "admin"].includes(user.role);
      case "admin": return user.role === "admin";
      default: return false;
    }
  }
}

// --- AuthContext ---
const AuthContext = createContext<{
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
} | null>(null);

// --- AuthProvider ---
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Correction ici : Initialiser l'état directement depuis le localStorage.
  // Cela garantit que la valeur est disponible dès le premier rendu.
  const [user, setUser] = useState<User | null>(() => AuthService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  // useEffect est toujours utile pour les cas où la session change dans un autre onglet,
  // mais l'état initial est désormais correct.
  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const loggedInUser = await AuthService.login(email, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>;
}

// --- useAuth Hook ---
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
