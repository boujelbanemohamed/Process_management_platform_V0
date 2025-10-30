'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurer le user au chargement initial
  useEffect(() => {
    console.log('🔵 AuthProvider - Initialisation');
    try {
      // Clé de session standardisée
      const savedUser = localStorage.getItem('user-session');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        console.log('🔵 User restauré depuis localStorage:', parsed);
        setUser(parsed);
      } else {
        console.log('🔵 Aucun user dans localStorage');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la restauration du user:', error);
      localStorage.removeItem('user-session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('🔐 Tentative de connexion pour:', email);
    try {
      const response = await fetch(
        `/api/users?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
      );
      console.log('📥 Réponse de connexion:', response.status);

      const data = await response.json();
      if (response.ok && data.success) {
        const userData = data.user;
        console.log('✅ Connexion réussie:', userData);
        setUser(userData);
        // Sauvegarder dans localStorage avec la clé standardisée
        localStorage.setItem('user-session', JSON.stringify(userData));
        return true;
      } else {
        console.error('❌ Échec de connexion:', data.error);
        return false;
      }
    } catch (error) {
       console.error('❌ Erreur lors de la connexion:', error);
       return false;
    }
  };

  const logout = () => {
    console.log('🔓 Déconnexion');
    setUser(null);
    // Nettoyer le localStorage avec la clé standardisée
    localStorage.removeItem('user-session');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
