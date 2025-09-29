'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, DollarSign, Users, Building2, Save, X, AlertCircle } from 'lucide-react';
import { ProjectService, ProjectFormData, ProjectValidationErrors } from '@/lib/projects';

interface Project {
  id?: number;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: number;
  entities: Array<{ id: number; name: string; type: string }>;
  members: Array<{ id: number; name: string; email: string; role: string }>;
}

interface Entity {
  id: number;
  name: string;
  type: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface ProjectFormProps {
  projectId?: string;
}

const statusOptions = [
  { value: 'planning', label: 'Planification' },
  { value: 'active', label: 'Actif' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
];

export function ProjectForm({ projectId }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [errors, setErrors] = useState<ProjectValidationErrors>({});
  const [formData, setFormData] = useState<Project>({
    name: '',
    description: '',
    status: 'planning',
    start_date: '',
    end_date: '',
    budget: 0,
    entities: [],
    members: [],
  });

  useEffect(() => {
    fetchEntities();
    fetchUsers();
    
    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const fetchEntities = async () => {
    try {
      const response = await fetch('/api/entities', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setEntities(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des entités:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const fetchProject = async () => {
    try {
      setLoading(true);
      const project = await ProjectService.getProject(projectId!);
      setFormData({
        ...project,
        budget: project.budget || 0,
        start_date: project.start_date || '',
        end_date: project.end_date || '',
      });
    } catch (error) {
      console.error('Erreur lors du chargement du projet:', error);
      setErrors({ general: 'Erreur lors du chargement du projet' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});

    try {
      const payload: ProjectFormData = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        start_date: formData.start_date,
        end_date: formData.end_date,
        budget: formData.budget,
        entity_ids: formData.entities.map(e => e.id),
        member_ids: formData.members.map(m => m.id),
      };

      // Validation côté client
      const validationErrors = ProjectService.validateProject(payload);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setSaving(false);
        return;
      }

      if (projectId) {
        await ProjectService.updateProject(projectId, payload);
      } else {
        await ProjectService.createProject(payload);
      }

      router.push('/projects');
    } catch (error) {
      console.error('Erreur:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEntityToggle = (entity: Entity) => {
    setFormData(prev => ({
      ...prev,
      entities: prev.entities.some(e => e.id === entity.id)
        ? prev.entities.filter(e => e.id !== entity.id)
        : [...prev.entities, entity]
    }));
  };

  const handleMemberToggle = (user: User) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.some(m => m.id === user.id)
        ? prev.members.filter(m => m.id !== user.id)
        : [...prev.members, { ...user, role: 'member' }]
    }));
  };

  const validateDates = () => {
    if (formData.start_date && formData.end_date) {
      return new Date(formData.start_date) <= new Date(formData.end_date);
    }
    return true;
  };

  const handleFieldChange = (field: keyof Project, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field as keyof ProjectValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informations du projet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du projet *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="Nom du projet"
                required
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Description du projet"
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Date de début</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleFieldChange('start_date', e.target.value)}
                  className={`pl-10 ${errors.start_date ? 'border-red-500' : ''}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Date de fin</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleFieldChange('end_date', e.target.value)}
                  className={`pl-10 ${errors.end_date ? 'border-red-500' : ''}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (DT)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.budget || ''}
                  onChange={(e) => handleFieldChange('budget', parseFloat(e.target.value) || 0)}
                  className={`pl-10 ${errors.budget ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {errors.start_date && (
            <p className="text-sm text-red-600">{errors.start_date}</p>
          )}
          {errors.end_date && (
            <p className="text-sm text-red-600">{errors.end_date}</p>
          )}
          {errors.budget && (
            <p className="text-sm text-red-600">{errors.budget}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Entités associées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entities.map((entity) => (
              <div key={entity.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`entity-${entity.id}`}
                  checked={formData.entities.some(e => e.id === entity.id)}
                  onCheckedChange={() => handleEntityToggle(entity)}
                />
                <Label htmlFor={`entity-${entity.id}`} className="text-sm">
                  {entity.name} ({entity.type})
                </Label>
              </div>
            ))}
          </div>
          {entities.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucune entité disponible</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membres de l'équipe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`user-${user.id}`}
                  checked={formData.members.some(m => m.id === user.id)}
                  onCheckedChange={() => handleMemberToggle(user)}
                />
                <Label htmlFor={`user-${user.id}`} className="text-sm">
                  {user.name} ({user.email})
                </Label>
              </div>
            ))}
          </div>
          {users.length === 0 && (
            <p className="text-sm text-muted-foreground">Aucun utilisateur disponible</p>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={saving || Object.keys(errors).length > 0}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          <X className="h-4 w-4 mr-2" />
          Annuler
        </Button>
      </div>
    </form>
  );
}
