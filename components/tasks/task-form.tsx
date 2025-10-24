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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// --- Schéma de validation ---
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

// --- Types ---
type Task = { id: number, project_id: number, name: string, description?: string, assignee_type: string, assignee_id: number, start_date: string, end_date: string, priority: string, status: string };
type Project = { id: number, name: string, end_date: string, members: { id: number, name: string }[], entities: { id: number, name: string }[] };
type User = { id: number, name: string };
type Entity = { id: number, name: string };

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
    defaultValues: {
      projectId: task?.project_id.toString() || '',
      name: task?.name || '',
      description: task?.description || '',
      assigneeType: task?.assignee_type || '',
      assigneeId: task?.assignee_id.toString() || '',
      startDate: task ? format(new Date(task.start_date), 'yyyy-MM-dd') : '',
      endDate: task ? format(new Date(task.end_date), 'yyyy-MM-dd') : '',
      priority: task?.priority || '',
      status: task?.status || '',
    },
  });

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
    form.setValue('assigneeId', ''); // Reset assignee on project change
    const project = projects.find(p => p.id.toString() === projectId);
    setSelectedProject(project || null);
  };

  const onSubmit = async (values: z.infer<typeof taskSchema>) => {
    try {
      const url = task ? `/api/tasks?id=${task.id}` : '/api/tasks';
      const method = task ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Une erreur est survenue.');
      }
      toast.success(task ? "Tâche modifiée !" : "Tâche créée !");
      onSuccess();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* ... (champs du formulaire) ... */}
        <FormField name="projectId" control={form.control} render={({ field }) => (
          <FormItem>
            <FormLabel>Projet</FormLabel>
            <Select onValueChange={handleProjectChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger></FormControl>
              <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}/>

        {/* ... autres champs ... */}

        <Button type="submit">{task ? 'Modifier' : 'Créer'}</Button>
      </form>
    </Form>
  );
}
