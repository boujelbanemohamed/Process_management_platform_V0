// components/tasks/task-form.tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Types ---
type Task = { id: number; [key: string]: any; };
type Project = { id: string; name: string; members: any[]; entities: any[] };
type User = { id: string; name: string };
type Entity = { id: string; name: string };

// --- Schéma et Props ---
const formSchema = z.object({
  projectId: z.string().min(1, "Le projet est requis."),
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères."),
  description: z.string().optional(),
  assignee: z.string().min(1, "L'assigné est requis."),
  startDate: z.string().min(1, "La date de début est requise."),
  endDate: z.string().min(1, "La date de fin est requise."),
  priority: z.enum(["Basse", "Moyenne", "Haute", "Critique"]),
  status: z.enum(["À faire", "En cours", "En attente de validation", "Terminé"]),
  remarks: z.string().optional(),
});

type TaskFormValues = z.infer<typeof formSchema>;

interface TaskFormProps {
  onSuccess: () => void;
  task?: Task | null;
}

// --- Composant ---
export function TaskForm({ onSuccess, task }: TaskFormProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<User[]>([]);
  const [assignableEntities, setAssignableEntities] = useState<Entity[]>([]);

  const isEditMode = !!task;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", projectId: "", assignee: "", status: "À faire", priority: "Moyenne", description: "", remarks: "" },
  });

  const selectedProjectId = form.watch("projectId");

  useEffect(() => {
    async function fetchProjects() {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data);
    }
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const selectedProject = projects.find(p => p.id.toString() === selectedProjectId);
      if (selectedProject) {
        setAssignableUsers(selectedProject.members || []);
        setAssignableEntities(selectedProject.entities || []);
      }
    } else {
      setAssignableUsers([]);
      setAssignableEntities([]);
    }
    if (!isEditMode || (task && selectedProjectId !== task.project_id.toString())) {
      form.setValue("assignee", "");
    }
  }, [selectedProjectId, projects, form, isEditMode, task]);

  useEffect(() => {
    if (isEditMode && task && projects.length > 0) {
      form.reset({
        projectId: task.project_id.toString(),
        name: task.name,
        description: task.description,
        assignee: `${task.assignee_type}_${task.assignee_id}`,
        startDate: new Date(task.start_date).toISOString().split('T')[0],
        endDate: new Date(task.end_date).toISOString().split('T')[0],
        priority: task.priority,
        status: task.status,
        remarks: task.remarks,
      });
    }
  }, [task, projects, form, isEditMode]);

  async function onSubmit(data: TaskFormValues) {
    const [assigneeType, assigneeId] = data.assignee.split('_');
    const submissionData = { ...data, assigneeId, assigneeType };

    try {
      const response = await fetch(
        isEditMode ? `/api/tasks?id=${task.id}` : '/api/tasks',
        {
          method: isEditMode ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissionData),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Une erreur est survenue");
      }
      toast.success(`Tâche ${isEditMode ? 'mise à jour' : 'créée'} !`);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Échec de la ${isEditMode ? 'mise à jour' : 'création'}.`);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
        <FormField control={form.control} name="projectId" render={({ field }) => (
          <FormItem><FormLabel>Projet</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger></FormControl><SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Nom de la tâche</FormLabel><FormControl><Input placeholder="Ex: Rédiger le rapport" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Description détaillée de la tâche..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="assignee" render={({ field }) => (
          <FormItem><FormLabel>Assigné à</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!selectedProjectId}><FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un membre du projet" /></SelectTrigger></FormControl><SelectContent><SelectGroup><SelectLabel>Utilisateurs</SelectLabel>{assignableUsers.map(u => <SelectItem key={`user_${u.id}`} value={`user_${u.id}`}>{u.name}</SelectItem>)}</SelectGroup><SelectGroup><SelectLabel>Entités</SelectLabel>{assignableEntities.map(e => <SelectItem key={`entity_${e.id}`} value={`entity_${e.id}`}>{e.name}</SelectItem>)}</SelectGroup></SelectContent></Select><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="startDate" render={({ field }) => (
            <FormItem><FormLabel>Date de début</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="endDate" render={({ field }) => (
            <FormItem><FormLabel>Date de fin</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <FormField control={form.control} name="priority" render={({ field }) => (
            <FormItem><FormLabel>Priorité</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="status" render={({ field }) => (
            <FormItem><FormLabel>Statut</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="remarks" render={({ field }) => (
            <FormItem><FormLabel>Remarques</FormLabel><FormControl><Textarea placeholder="Commentaires internes..." {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <Button type="submit">{isEditMode ? 'Mettre à jour la tâche' : 'Enregistrer la tâche'}</Button>
      </form>
    </Form>
  );
}
