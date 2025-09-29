'use client'

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor, 
  Clock, 
  Settings, 
  Save,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useModeSettings } from '@/hooks/use-mode-settings';
import { ModeTest } from './mode-test';

export function ModeConfiguration() {
  const { settings, loading, updateSettings, resetSettings, currentTheme } = useModeSettings();
  const [previewMode, setPreviewMode] = useState<'light' | 'dark' | 'system'>('system');

  const handleSave = async () => {
    await updateSettings(settings);
  };

  const handlePreview = (mode: 'light' | 'dark' | 'system') => {
    setPreviewMode(mode);
    // Note: setTheme n'est pas disponible dans ce composant, 
    // mais le hook useModeSettings gère déjà le thème
  };

  const resetToDefault = async () => {
    await resetSettings();
  };

  return (
    <div className="space-y-6">
      {/* Configuration du thème */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Configuration du Thème
          </CardTitle>
          <CardDescription>
            Définissez le mode d'affichage par défaut de l'application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-theme">Thème par défaut</Label>
              <Select 
                value={settings.defaultTheme} 
                onValueChange={(value: 'light' | 'dark' | 'system') => 
                  updateSettings({ defaultTheme: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Mode clair
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Mode sombre
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Système
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auto-switch">Changement automatique</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-switch"
                  checked={settings.autoSwitch}
                  onCheckedChange={(checked) => 
                    updateSettings({ autoSwitch: checked })
                  }
                />
                <Label htmlFor="auto-switch">
                  {settings.autoSwitch ? 'Activé' : 'Désactivé'}
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Prévisualisation</Label>
              <div className="flex gap-2">
                <Button
                  variant={previewMode === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePreview('light')}
                >
                  <Sun className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePreview('dark')}
                >
                  <Moon className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePreview('system')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {settings.autoSwitch && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="light-start">Début du mode clair</Label>
                <Input
                  id="light-start"
                  type="time"
                  value={settings.lightModeStart}
                  onChange={(e) => 
                    updateSettings({ lightModeStart: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dark-start">Début du mode sombre</Label>
                <Input
                  id="dark-start"
                  type="time"
                  value={settings.darkModeStart}
                  onChange={(e) => 
                    updateSettings({ darkModeStart: e.target.value })
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Couleurs personnalisées */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Couleurs Personnalisées
          </CardTitle>
          <CardDescription>
            Personnalisez les couleurs de l'interface
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Couleur principale</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={settings.customColors.primary}
                  onChange={(e) => 
                    updateSettings({ 
                      customColors: { ...settings.customColors, primary: e.target.value }
                    })
                  }
                  className="w-16 h-10"
                />
                <Input
                  value={settings.customColors.primary}
                  onChange={(e) => 
                    updateSettings({ 
                      customColors: { ...settings.customColors, primary: e.target.value }
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Couleur secondaire</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={settings.customColors.secondary}
                  onChange={(e) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      customColors: { ...prev.customColors, secondary: e.target.value }
                    }))
                  }
                  className="w-16 h-10"
                />
                <Input
                  value={settings.customColors.secondary}
                  onChange={(e) => 
                    updateSettings({ 
                      customColors: { ...settings.customColors, secondary: e.target.value }
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent-color">Couleur d'accent</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="accent-color"
                  type="color"
                  value={settings.customColors.accent}
                  onChange={(e) => 
                    setSettings(prev => ({ 
                      ...prev, 
                      customColors: { ...prev.customColors, accent: e.target.value }
                    }))
                  }
                  className="w-16 h-10"
                />
                <Input
                  value={settings.customColors.accent}
                  onChange={(e) => 
                    updateSettings({ 
                      customColors: { ...settings.customColors, accent: e.target.value }
                    })
                  }
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accessibilité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Accessibilité
          </CardTitle>
          <CardDescription>
            Options d'accessibilité pour améliorer l'expérience utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="high-contrast"
                checked={settings.accessibility.highContrast}
                onCheckedChange={(checked) => 
                  updateSettings({ 
                    accessibility: { ...settings.accessibility, highContrast: checked }
                  })
                }
              />
              <Label htmlFor="high-contrast">Contraste élevé</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="reduced-motion"
                checked={settings.accessibility.reducedMotion}
                onCheckedChange={(checked) => 
                  updateSettings({ 
                    accessibility: { ...settings.accessibility, reducedMotion: checked }
                  })
                }
              />
              <Label htmlFor="reduced-motion">Mouvement réduit</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font-size">Taille de police</Label>
              <Select 
                value={settings.accessibility.fontSize} 
                onValueChange={(value: 'small' | 'medium' | 'large') => 
                  updateSettings({ 
                    accessibility: { ...settings.accessibility, fontSize: value }
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Petite</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading}>
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Sauvegarder
              </Button>
              <Button variant="outline" onClick={resetToDefault}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réinitialiser
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Thème actuel: {currentTheme}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Composant de test pour debug */}
      <ModeTest />
    </div>
  );
}
