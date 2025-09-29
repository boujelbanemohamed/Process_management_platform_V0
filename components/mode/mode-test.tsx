'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function ModeTest() {
  const [currentSettings, setCurrentSettings] = useState<any>(null);
  const [appliedClasses, setAppliedClasses] = useState<string[]>([]);

  useEffect(() => {
    // Vérifier les classes appliquées au document
    const checkAppliedClasses = () => {
      const root = document.documentElement;
      const classes = Array.from(root.classList);
      setAppliedClasses(classes);
    };

    checkAppliedClasses();
    
    // Vérifier toutes les secondes
    const interval = setInterval(checkAppliedClasses, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const testThemeChange = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  };

  const testHighContrast = () => {
    const root = document.documentElement;
    if (root.classList.contains('high-contrast')) {
      root.classList.remove('high-contrast');
    } else {
      root.classList.add('high-contrast');
    }
  };

  const testReducedMotion = () => {
    const root = document.documentElement;
    if (root.classList.contains('reduced-motion')) {
      root.classList.remove('reduced-motion');
    } else {
      root.classList.add('reduced-motion');
    }
  };

  const testFontSize = (size: 'small' | 'medium' | 'large') => {
    const root = document.documentElement;
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${size}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test des Paramètres Mode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold mb-2">Classes appliquées au document :</h3>
          <div className="flex flex-wrap gap-2">
            {appliedClasses.map((cls, index) => (
              <Badge key={index} variant="outline">{cls}</Badge>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Tests manuels :</h3>
          <div className="flex flex-wrap gap-2">
            <Button onClick={testThemeChange} variant="outline" size="sm">
              Toggle Dark Mode
            </Button>
            <Button onClick={testHighContrast} variant="outline" size="sm">
              Toggle High Contrast
            </Button>
            <Button onClick={testReducedMotion} variant="outline" size="sm">
              Toggle Reduced Motion
            </Button>
            <Button onClick={() => testFontSize('small')} variant="outline" size="sm">
              Font Small
            </Button>
            <Button onClick={() => testFontSize('medium')} variant="outline" size="sm">
              Font Medium
            </Button>
            <Button onClick={() => testFontSize('large')} variant="outline" size="sm">
              Font Large
            </Button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Variables CSS :</h3>
          <div className="text-sm space-y-1">
            <div>Primary: <span style={{ color: 'var(--color-primary)' }}>●</span> {getComputedStyle(document.documentElement).getPropertyValue('--color-primary')}</div>
            <div>Secondary: <span style={{ color: 'var(--color-secondary)' }}>●</span> {getComputedStyle(document.documentElement).getPropertyValue('--color-secondary')}</div>
            <div>Accent: <span style={{ color: 'var(--color-accent)' }}>●</span> {getComputedStyle(document.documentElement).getPropertyValue('--color-accent')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
