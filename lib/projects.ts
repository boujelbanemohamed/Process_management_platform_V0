export interface Project {
  id?: number;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  project_type?: 'interne' | 'externe' | 'communautaire';
  start_date?: string;
  end_date?: string;
  budget?: number;
  tags?: string[];
  entity_ids?: number[];
  created_by?: number;
  created_by_name?: string;
  created_by_email?: string;
  created_at?: string;
  updated_at?: string;
  entities?: Array<{ id: number; name: string; type: string }>;
  members?: Array<{ id: number; name: string; email: string; role: string; joined_at?: string }>;
  entity_count?: number;
  member_count?: number;
}

export interface ProjectFormData {
  name: string;
  description: string;
  status: string;
  project_type: string;
  start_date: string;
  end_date: string;
  budget: number;
  tags: string[];
  entity_ids: number[];
  member_ids: number[];
}

export interface ProjectValidationErrors {
  name?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  budget?: string;
  general?: string;
}

export class ProjectService {
  static async getProjects(): Promise<Project[]> {
    const response = await fetch('/api/projects', {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des projets');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  static async getProject(id: string): Promise<Project> {
    const response = await fetch(`/api/projects?id=${id}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Projet non trouvé');
      }
      throw new Error('Erreur lors du chargement du projet');
    }

    return response.json();
  }

  static async createProject(projectData: ProjectFormData): Promise<Project> {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la création du projet');
    }

    return response.json();
  }

  static async updateProject(id: string, projectData: ProjectFormData): Promise<Project> {
    const response = await fetch(`/api/projects?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(projectData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la mise à jour du projet');
    }

    return response.json();
  }

  static async deleteProject(id: string): Promise<void> {
    const response = await fetch(`/api/projects?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la suppression du projet');
    }
  }

  static validateProject(data: Partial<ProjectFormData>): ProjectValidationErrors {
    const errors: ProjectValidationErrors = {};

    // Nom requis
    if (!data.name || data.name.trim().length === 0) {
      errors.name = 'Le nom du projet est requis';
    } else if (data.name.trim().length < 3) {
      errors.name = 'Le nom doit contenir au moins 3 caractères';
    } else if (data.name.trim().length > 255) {
      errors.name = 'Le nom ne peut pas dépasser 255 caractères';
    }

    // Description optionnelle mais limitée
    if (data.description && data.description.length > 1000) {
      errors.description = 'La description ne peut pas dépasser 1000 caractères';
    }

    // Validation des dates
    if (data.start_date && data.end_date) {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);

      if (endDate < startDate) {
        errors.end_date = 'La date de fin doit être postérieure à la date de début';
      }

      // Vérifier que la durée n'est pas trop longue (par exemple, 5 ans max)
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 1825) { // 5 ans
        errors.end_date = 'La durée du projet ne peut pas dépasser 5 ans';
      }
    }

    // Validation du budget
    if (data.budget !== undefined && data.budget !== null) {
      if (data.budget < 0) {
        errors.budget = 'Le budget ne peut pas être négatif';
      } else if (data.budget > 999999999.99) {
        errors.budget = 'Le budget ne peut pas dépasser 999 999 999,99 DT';
      }
    }

    return errors;
  }

  static formatCurrency(amount: number): string {
    if (!amount) return 'Non défini';
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 3,
      maximumFractionDigits: 3,
    }).format(amount);
  }

  static getProjectTypeLabel(type: string): string {
    const labels = {
      'interne': 'Projet Interne',
      'externe': 'Projet Externe',
      'communautaire': 'Projet Communautaire'
    };
    return labels[type as keyof typeof labels] || type;
  }

  static formatDate(dateString: string): string {
    if (!dateString) return 'Non défini';
    return new Date(dateString).toLocaleDateString('fr-FR');
  }

  static formatDateTime(dateString: string): string {
    if (!dateString) return 'Non défini';
    return new Date(dateString).toLocaleString('fr-FR');
  }

  static getStatusColor(status: string): string {
    const colors = {
      planning: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  }

  static getStatusLabel(status: string): string {
    const labels = {
      planning: 'Planification',
      active: 'Actif',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };
    return labels[status as keyof typeof labels] || status;
  }

  static getStatusOptions() {
    return [
      { value: 'planning', label: 'Planification' },
      { value: 'active', label: 'Actif' },
      { value: 'completed', label: 'Terminé' },
      { value: 'cancelled', label: 'Annulé' },
    ];
  }
}
