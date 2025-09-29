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
    console.log('🔄 Mise à jour des paramètres:', newSettings);
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    // Appliquer les nouveaux paramètres immédiatement
    console.log('🎨 Application des paramètres d\'accessibilité');
    ModeSettingsService.applyAccessibilitySettings(updatedSettings);
    
    console.log('🎨 Application des couleurs personnalisées');
    ModeSettingsService.applyCustomColors(updatedSettings);
    
    // Appliquer le thème si c'est un changement de thème
    if (newSettings.defaultTheme) {
      console.log('🌙 Changement de thème vers:', newSettings.defaultTheme);
      setTheme(newSettings.defaultTheme);
    }
    
    // Sauvegarder
    console.log('💾 Sauvegarde des paramètres...');
    const success = await ModeSettingsService.saveSettings(updatedSettings);
    if (!success) {
      console.error('❌ Erreur lors de la sauvegarde des paramètres');
    } else {
      console.log('✅ Paramètres sauvegardés avec succès');
    }
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
