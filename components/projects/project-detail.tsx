'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users, Building2, Edit, Trash2, ArrowLeft, FileText, Download, Eye } from 'lucide-react';
import Link from 'next/link';
import { ProjectService, Project } from '@/lib/projects';


interface ProjectDetailProps {
  projectId: string;
}

interface Document {
  id: number;
  name: string;
  description: string;
  type: string;
  size: number;
  version: string;
  url: string;
  uploaded_at: string;
  uploaded_by: number;
}

const statusColors = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  planning: 'Planification',
  active: 'Actif',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
    fetchDocuments();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const data = await ProjectService.getProject(projectId);
      setProject(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors du chargement du projet');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const response = await fetch(`/api/documents?projectId=${projectId}`);
      if (!response.ok) throw new Error('Erreur lors du chargement des documents');
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error('Erreur chargement documents:', err);
      setDocuments([]);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      return;
    }

    try {
      await ProjectService.deleteProject(projectId);
      router.push('/projects');
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la suppression du projet');
    }
  };

  const formatDate = ProjectService.formatDate;
  const formatCurrency = ProjectService.formatCurrency;
  const formatDateTime = ProjectService.formatDateTime;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <div className="flex gap-4 justify-center">
          <Button onClick={fetchProject}>Réessayer</Button>
          <Button variant="outline" onClick={() => router.push('/projects')}>
            Retour aux projets
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Projet non trouvé</p>
        <Button variant="outline" onClick={() => router.push('/projects')} className="mt-4">
          Retour aux projets
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">
              Créé par {project.created_by_name} le {formatDate(project.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={ProjectService.getStatusColor(project.status)}>
            {ProjectService.getStatusLabel(project.status)}
          </Badge>
          {project.project_type && (
            <Badge variant="outline">
              {ProjectService.getProjectTypeLabel(project.project_type)}
            </Badge>
          )}
          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{project.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {project.tags && project.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Info */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Planning
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date de début:</span>
              <span>{formatDate(project.start_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date de fin:</span>
              <span>{formatDate(project.end_date)}</span>
            </div>
            {project.budget && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget (TND):</span>
                <span className="font-medium">{formatCurrency(project.budget)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Équipe ({project.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.members.length > 0 ? (
              <div className="space-y-2">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant="outline">{member.role}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Aucun membre assigné</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Entities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Entités associées ({project.entities.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {project.entities.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {project.entities.map((entity) => (
                <div key={entity.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{entity.name}</p>
                    <p className="text-sm text-muted-foreground">{entity.type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">Aucune entité associée</p>
          )}
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents associés ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingDocuments ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{document.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {document.description || 'Aucune description'} • 
                        {new Date(document.uploaded_at).toLocaleDateString('fr-FR')} • 
                        Version {document.version}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(document.url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = document.url;
                        link.download = document.name;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun document associé à ce projet</p>
              <Link href="/documents/upload">
                <Button variant="outline" className="mt-4">
                  <FileText className="h-4 w-4 mr-2" />
                  Ajouter un document
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
