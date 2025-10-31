'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from "@/types";

// --- AuthService Class ---
// Restaurée pour les appels synchrones et les vérifications de permissions
// à travers l'application.
export class AuthService {
  private static currentUser: User | null = null;
  private static readonly SESSION_KEY = 'user-session';

  // Méthode pour obtenir l'utilisateur actuel de manière synchrone
  static getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
          return this.currentUser;
        } catch (e) {
          console.error("Erreur d'analyse de la session utilisateur:", e);
          localStorage.removeItem(this.SESSION_KEY);
          return null;
        }
      }
    }
    return null;
  }

  // Méthode pour mettre à jour l'utilisateur (utilisée par le AuthProvider)
  static setCurrentUser(user: User | null): void {
    this.currentUser = user;
    if (user) {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.SESSION_KEY);
    }
  }

  // Méthode de connexion
  static async login(email: string, password: string): Promise<User | null> {
    try {
      const response = await fetch(`/api/users?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
      const data = await response.json();
      if (response.ok && data.success) {
        const user = data.user;
        this.setCurrentUser(user);
        return user;
      } else {
        console.error("Échec de connexion:", data.error);
        return null;
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      return null;
    }
  }

  // Méthode de déconnexion
  static logout(): void {
    this.setCurrentUser(null);
  }

  // Vérifie si un utilisateur est authentifié
  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Vérifie les permissions
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


// --- AuthContext & Provider ---
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialisation synchrone pour éviter la race condition.
  // L'état 'user' est directement initialisé avec la valeur du localStorage.
  const [user, setUser] = useState<User | null>(() => AuthService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);

  // Le useEffect ne sert plus qu'à indiquer que le chargement initial est terminé.
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔐 Tentative de connexion via Provider pour:', email);
    const loggedInUser = await AuthService.login(email, password);
    if (loggedInUser) {
      console.log('✅ Connexion réussie via Provider:', loggedInUser);
      setUser(loggedInUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    console.log('🔓 Déconnexion via Provider');
    AuthService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// --- useAuth Hook ---
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
