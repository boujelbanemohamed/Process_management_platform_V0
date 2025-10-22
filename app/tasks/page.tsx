// app/tasks/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from '@/components/tasks/task-form';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

// --- Types ---
type Task = {
  id: number;
  name: string;
  status: 'À faire' | 'En cours' | 'En attente de validation' | 'Terminé';
  project_id: number;
  project_name: string;
  assignee_id: number;
  assignee_type: string;
  assignee_name: string;
  priority: string;
  end_date: string;
  [key: string]: any; // Pour l'accès dynamique
};
const STATUSES: Task['status'][] = ['À faire', 'En cours', 'En attente de validation', 'Terminé'];
const PRIORITIES = ["Basse", "Moyenne", "Haute", "Critique"];

// --- Composants Enfants ---
function TaskCard({ task, onEdit, onDelete }: { task: Task; onEdit: (task: Task) => void; onDelete: (task: Task) => void; }) {
  return (
    <div className="bg-white p-4 mb-4 rounded-lg shadow-sm border border-gray-200 group">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-gray-800 pr-2">{task.name}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onEdit(task)}>Modifier</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task)} className="text-red-600">Supprimer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="text-sm text-gray-500">{task.project_name}</p>
      <div className="mt-2 flex justify-between items-center">
        <span className="text-xs text-gray-600">{task.assignee_name}</span>
        <span className={`px-2 py-1 text-xs rounded-full ${ task.priority === 'Critique' ? 'bg-red-100 text-red-800' : task.priority === 'Haute' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}>{task.priority}</span>
      </div>
    </div>
  );
}

function KanbanColumn({ title, tasks, onEdit, onDelete }: { title: string; tasks: Task[]; onEdit: (task: Task) => void; onDelete: (task: Task) => void; }) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg flex-1">
      <h2 className="font-semibold text-lg mb-4 text-gray-700">{title}</h2>
      <div>{tasks.map(task => <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />)}</div>
    </div>
  );
}

// --- Composant Principal ---
export default function TasksPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Erreur lors du chargement');
      const data = await response.json();
      setAllTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchTasks(); }, []);

  const filteredTasks = useMemo(() => {
    return allTasks.filter(task => {
      const searchMatch = searchTerm === "" || task.name.toLowerCase().includes(searchTerm.toLowerCase()) || task.project_name.toLowerCase().includes(searchTerm.toLowerCase());
      const projectMatch = projectFilter === "all" || task.project_id.toString() === projectFilter;
      const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
      return searchMatch && projectMatch && priorityMatch;
    });
  }, [allTasks, searchTerm, projectFilter, priorityFilter]);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormModalOpen(true);
  };

  const handleDelete = (task: Task) => {
    setDeletingTask(task);
    setIsDeleteAlertOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingTask) return;
    try {
      await fetch(`/api/tasks?id=${deletingTask.id}`, { method: 'DELETE' });
      toast.success("Tâche supprimée !");
      fetchTasks();
    } catch {
      toast.error("Échec de la suppression.");
    } finally {
      setIsDeleteAlertOpen(false);
      setDeletingTask(null);
    }
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setEditingTask(null);
    fetchTasks();
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setIsFormModalOpen(true);
  }

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="text-red-500">Erreur: {error}</div>;

  const getTasksByStatus = (status: Task['status']) => filteredTasks.filter(task => task.status === status);
  const uniqueProjects = [...new Map(allTasks.map(task => [task.project_id, {id: task.project_id, name: task.project_name}])).values()];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tâches</h1>
        <Button onClick={openCreateModal}>Ajouter une tâche</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs"/>
        <Select value={projectFilter} onValueChange={setProjectFilter}><SelectTrigger><SelectValue placeholder="Projet"/></SelectTrigger><SelectContent><SelectItem value="all">Tous les projets</SelectItem>{uniqueProjects.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent></Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}><SelectTrigger><SelectValue placeholder="Priorité"/></SelectTrigger><SelectContent><SelectItem value="all">Toutes les priorités</SelectItem>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
      </div>

      <div className="flex gap-6">
        {STATUSES.map(status => <KanbanColumn key={status} title={status} tasks={getTasksByStatus(status)} onEdit={handleEdit} onDelete={handleDelete} />)}
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editingTask ? 'Modifier la tâche' : 'Créer une tâche'}</DialogTitle></DialogHeader><TaskForm onSuccess={handleFormSuccess} task={editingTask} /></DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>Supprimer</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
