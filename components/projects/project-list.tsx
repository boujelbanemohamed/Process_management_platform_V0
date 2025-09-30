'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users, Building2, Edit, Trash2, Eye, Plus, FileText } from 'lucide-react';
import Link from 'next/link';
import { ProjectService, Project } from '@/lib/projects';
import { ProjectSearch } from './project-search';

export function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await ProjectService.getProjects();
      setProjects(data);
      setFilteredProjects(data);
      
      // Extraire tous les tags disponibles
      const allTags = data.flatMap(project => project.tags || []);
      const uniqueTags = [...new Set(allTags)];
      setAvailableTags(uniqueTags);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string, tags: string[]) => {
    let filtered = projects;

    // Filtrage par texte
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(project => 
        project.name.toLowerCase().includes(searchTerm) ||
        (project.description && project.description.toLowerCase().includes(searchTerm))
      );
    }

    // Filtrage par tags
    if (tags.length > 0) {
      filtered = filtered.filter(project => 
        project.tags && project.tags.some(tag => tags.includes(tag))
      );
    }

    setFilteredProjects(filtered);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      return;
    }

    try {
      await ProjectService.deleteProject(id.toString());
      const updatedProjects = projects.filter(project => project.id !== id);
      setProjects(updatedProjects);
      setFilteredProjects(updatedProjects);
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la suppression du projet');
    }
  };

  const formatDate = ProjectService.formatDate;
  const formatCurrency = ProjectService.formatCurrency;

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <div className="mb-6">
            <div className="mx-auto h-24 w-24 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <svg className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Erreur de chargement</h3>
            <p className="text-red-700 mb-6">{error}</p>
          </div>
          <Button onClick={fetchProjects} size="lg" className="w-full sm:w-auto">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <div className="mb-6">
            <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg className="h-12 w-12 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Il n'y a pas de projet</h3>
            <p className="text-muted-foreground mb-6">
              C'est le moment d'en créer un ! Commencez par créer votre premier projet pour organiser vos équipes et suivre vos objectifs.
            </p>
          </div>
          <Link href="/projects/create">
            <Button size="lg" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Créer mon premier projet
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProjectSearch onSearch={handleSearch} availableTags={availableTags} />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <CardDescription>
                    Créé par {project.created_by_name}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  <Badge className={ProjectService.getStatusColor(project.status)}>
                    {ProjectService.getStatusLabel(project.status)}
                  </Badge>
                  {project.project_type && (
                    <Badge variant="outline" className="text-xs">
                      {ProjectService.getProjectTypeLabel(project.project_type)}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.description}
                </p>
              )}
              
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {project.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Début:</span>
                  <span>{formatDate(project.start_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Fin:</span>
                  <span>{formatDate(project.end_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Membres:</span>
                  <span>{project.member_count}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Entités:</span>
                  <span>{project.entity_count}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Documents:</span>
                  <span>{project.document_count || 0}</span>
                </div>
              </div>

              {project.budget && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground font-medium">TND</span>
                  <span className="text-muted-foreground">Budget:</span>
                  <span className="font-medium">{formatCurrency(project.budget)}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Link href={`/projects/${project.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-1" />
                    Voir
                  </Button>
                </Link>
                <Link href={`/projects/${project.id}/edit`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Edit className="h-4 w-4 mr-1" />
                    Modifier
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(project.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}