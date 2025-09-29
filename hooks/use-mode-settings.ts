'use client'

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { ModeSettings, ModeSettingsService, defaultModeSettings } from '@/lib/mode-settings';

export function useModeSettings() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<ModeSettings>(defaultModeSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const loadedSettings = await ModeSettingsService.getSettings();
        setSettings(loadedSettings);
        
        // Appliquer les paramètres d'accessibilité
        ModeSettingsService.applyAccessibilitySettings(loadedSettings);
        
        // Appliquer les couleurs personnalisées
        ModeSettingsService.applyCustomColors(loadedSettings);
        
        // Appliquer le thème
        setTheme(loadedSettings.defaultTheme);
        
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [setTheme]);

  const updateSettings = async (newSettings: Partial<ModeSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Appliquer les nouveaux paramètres
    ModeSettingsService.applyAccessibilitySettings(updatedSettings);
    ModeSettingsService.applyCustomColors(updatedSettings);
    
    // Sauvegarder
    await ModeSettingsService.saveSettings(updatedSettings);
  };

  const resetSettings = async () => {
    setSettings(defaultModeSettings);
    await ModeSettingsService.resetSettings();
    
    // Appliquer les paramètres par défaut
    ModeSettingsService.applyAccessibilitySettings(defaultModeSettings);
    ModeSettingsService.applyCustomColors(defaultModeSettings);
    setTheme(defaultModeSettings.defaultTheme);
  };

  const shouldUseDarkMode = () => {
    return ModeSettingsService.shouldUseDarkMode(settings);
  };

  return {
    settings,
    loading,
    updateSettings,
    resetSettings,
    shouldUseDarkMode,
    currentTheme: theme
  };
}
