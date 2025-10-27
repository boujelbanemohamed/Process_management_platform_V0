// components/tasks/task-form.tsx
"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const taskSchema = z.object({
  projectId: z.string().min(1, "Le projet est obligatoire."),
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères."),
  description: z.string().optional(),
  assigneeType: z.string().min(1, "Le type d'assigné est obligatoire."),
  assigneeId: z.string().min(1, "L'assigné est obligatoire."),
  startDate: z.string().min(1, "La date de début est obligatoire."),
  endDate: z.string().min(1, "La date de fin est obligatoire."),
  priority: z.string().min(1, "La priorité est obligatoire."),
  status: z.string().min(1, "Le statut est obligatoire."),
});

type Task = { id: number, project_id: number, name: string, description?: string, assignee_type: string, assignee_id: number, start_date: string, end_date: string, priority: string, status: string };
type Project = { id: number, name: string, end_date: string, members: { id: number, name: string }[], entities: { id: number, name: string }[] };

interface TaskFormProps {
  onSuccess: () => void;
  task?: Task | null;
}

const PRIORITIES = ["Basse", "Moyenne", "Haute", "Critique"];
const STATUSES = ['À faire', 'En cours', 'En attente de validation', 'Terminé'];

export function TaskForm({ onSuccess, task }: TaskFormProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    // Le pré-remplissage est géré par le `useEffect` ci-dessous pour plus de fiabilité
  });

  // Logique de pré-remplissage améliorée
  useEffect(() => {
    if (task) {
      form.reset({
        projectId: task.project_id.toString(),
        name: task.name,
        description: task.description || '',
        assigneeType: task.assignee_type,
        assigneeId: task.assignee_id.toString(),
        startDate: format(new Date(task.start_date), 'yyyy-MM-dd'),
        endDate: format(new Date(task.end_date), 'yyyy-MM-dd'),
        priority: task.priority,
        status: task.status,
      });
    }
  }, [task, form]);

  useEffect(() => {
    async function fetchProjects() {
      try {
        const response = await fetch('/api/projects?include_members=true');
        if (!response.ok) throw new Error('Failed to fetch projects');
        const data = await response.json();
        setProjects(data);
        if (task) {
          const project = data.find((p: Project) => p.id === task.project_id);
          setSelectedProject(project || null);
        }
      } catch (error) {
        toast.error("Erreur lors du chargement des projets.");
      }
    }
    fetchProjects();
  }, [task]);

  const handleProjectChange = (projectId: string) => {
    form.setValue('projectId', projectId);
    form.setValue('assigneeId', '');
    const project = projects.find(p => p.id.toString() === projectId);
    setSelectedProject(project || null);
  };

  const onSubmit = async (values: z.infer<typeof taskSchema>) => {
    // ... (logique de soumission) ...
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* ... (tous les champs du formulaire avec FormField) ... */}

        <Button type="submit">{task ? 'Modifier' : 'Créer'}</Button>
      </form>
    </Form>
  );
}
