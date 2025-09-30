export interface ModeSettings {
  defaultTheme: 'light' | 'dark' | 'system';
  autoSwitch: boolean;
  lightModeStart: string;
  darkModeStart: string;
  customColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    fontSize: 'small' | 'medium' | 'large';
  };
}

export const defaultModeSettings: ModeSettings = {
  defaultTheme: 'light',
  autoSwitch: false,
  lightModeStart: '06:00',
  darkModeStart: '18:00',
  customColors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#f59e0b'
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    fontSize: 'medium'
  }
};

export class ModeSettingsService {
  static async getSettings(): Promise<ModeSettings> {
    try {
      const response = await fetch('/api/mode-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings && Object.keys(data.settings).length > 0) {
          return data.settings;
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    }

    // Fallback sur localStorage
    const savedSettings = localStorage.getItem('mode-settings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }

    return defaultModeSettings;
  }

  static async saveSettings(settings: ModeSettings): Promise<boolean> {
    try {
      const response = await fetch('/api/mode-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // Sauvegarder aussi en local pour l'accès rapide
        localStorage.setItem('mode-settings', JSON.stringify(settings));
        return true;
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    }

    return false;
  }

  static async resetSettings(): Promise<boolean> {
    try {
      const response = await fetch('/api/mode-settings', {
        method: 'DELETE',
      });

      if (response.ok) {
        localStorage.removeItem('mode-settings');
        return true;
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
    }

    return false;
  }

  static shouldUseDarkMode(settings: ModeSettings): boolean {
    if (!settings.autoSwitch) {
      return settings.defaultTheme === 'dark';
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [lightHour, lightMinute] = settings.lightModeStart.split(':').map(Number);
    const [darkHour, darkMinute] = settings.darkModeStart.split(':').map(Number);
    
    const lightTime = lightHour * 60 + lightMinute;
    const darkTime = darkHour * 60 + darkMinute;

    // Si le mode sombre commence avant le mode clair (ex: 18h -> 6h)
    if (darkTime < lightTime) {
      return currentTime >= darkTime || currentTime < lightTime;
    }
    
    // Si le mode sombre commence après le mode clair (ex: 6h -> 18h)
    return currentTime >= darkTime;
  }

  static applyAccessibilitySettings(settings: ModeSettings): void {
    const root = document.documentElement;
    
    console.log('🎨 Application des paramètres d\'accessibilité:', settings.accessibility);
    
    // Contraste élevé
    if (settings.accessibility.highContrast) {
      root.classList.add('high-contrast');
      console.log('✅ Contraste élevé activé');
    } else {
      root.classList.remove('high-contrast');
      console.log('❌ Contraste élevé désactivé');
    }

    // Mouvement réduit
    if (settings.accessibility.reducedMotion) {
      root.classList.add('reduced-motion');
      console.log('✅ Mouvement réduit activé');
    } else {
      root.classList.remove('reduced-motion');
      console.log('❌ Mouvement réduit désactivé');
    }

    // Taille de police
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${settings.accessibility.fontSize}`);
    console.log(`✅ Taille de police: ${settings.accessibility.fontSize}`);
  }

  static applyCustomColors(settings: ModeSettings): void {
    const root = document.documentElement;
    
    console.log('🎨 Application des couleurs personnalisées:', settings.customColors);
    
    root.style.setProperty('--color-primary', settings.customColors.primary);
    root.style.setProperty('--color-secondary', settings.customColors.secondary);
    root.style.setProperty('--color-accent', settings.customColors.accent);
    
    console.log('✅ Couleurs appliquées:', {
      primary: settings.customColors.primary,
      secondary: settings.customColors.secondary,
      accent: settings.customColors.accent
    });
  }
}
