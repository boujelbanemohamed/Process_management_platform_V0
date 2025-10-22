// app/tasks/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from '@/components/tasks/task-form';
import { TaskView } from '@/components/tasks/task-view';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

// --- Types ---
type Task = { id: number; task_number: string; name: string; status: 'À faire' | 'En cours' | 'En attente de validation' | 'Terminé'; project_id: number; project_name: string; assignee_id: number; assignee_type: string; assignee_name: string; priority: string; start_date: string; end_date: string; [key: string]: any; };
type User = { id: number; name: string; };
type Entity = { id: number; name: string; };

const STATUSES: Task['status'][] = ['À faire', 'En cours', 'En attente de validation', 'Terminé'];
const PRIORITIES = ["Basse", "Moyenne", "Haute", "Critique"];

// --- Composants ---
function TaskCard({ task, onEdit, onDelete, onView }: { task: Task; onEdit: (task: Task) => void; onDelete: (task: Task) => void; onView: (task: Task) => void; }) {
  return (
    <div className="bg-white p-3 mb-4 rounded-lg shadow-sm border border-gray-200 group text-sm">
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-gray-800 pr-2">{task.task_number}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onView(task)}><Eye className="mr-2 h-4 w-4" />Voir</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(task)}><Pencil className="mr-2 h-4 w-4" />Modifier</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" />Supprimer</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="font-semibold text-gray-900 mb-1">{task.name}</p>
      <p className="text-xs text-gray-500 mb-2">{task.project_name}</p>

      <div className="text-xs text-gray-600 space-y-1 mb-3">
        <p>Début: {format(new Date(task.start_date), 'dd MMM yyyy', { locale: fr })}</p>
        <p>Fin: {format(new Date(task.end_date), 'dd MMM yyyy', { locale: fr })}</p>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-600">{task.assignee_name}</span>
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
            task.priority === 'Critique' ? 'bg-red-100 text-red-800' :
            task.priority === 'Haute' ? 'bg-orange-100 text-orange-800' :
            task.priority === 'Moyenne' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
        }`}>
          {task.priority}
        </span>
      </div>
    </div>
  );
}

function KanbanColumn({ title, tasks, onEdit, onDelete, onView }: { title: string; tasks: Task[]; onEdit: (task: Task) => void; onDelete: (task: Task) => void; onView: (task: Task) => void; }) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg flex-1">
      <h2 className="font-semibold text-lg mb-4 text-gray-700">{title}</h2>
      <div>{tasks.map(task => <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} onView={onView} />)}</div>
    </div>
  );
}

export default function TasksPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [tasksRes, usersRes, entitiesRes] = await Promise.all([ fetch('/api/tasks'), fetch('/api/users'), fetch('/api/entities') ]);
      if (!tasksRes.ok || !usersRes.ok || !entitiesRes.ok) throw new Error('Erreur de chargement des données');

      setAllTasks(await tasksRes.json());
      setUsers(await usersRes.json());
      setEntities(await entitiesRes.json());

    } catch (err) { setError(err instanceof Error ? err.message : 'Erreur inconnue'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAllData(); }, []);

  const filteredTasks = useMemo(() => {
    if (!allTasks) return []; // Garde pour éviter l'erreur de rendu

    const startFilter = startDateFilter ? parseISO(startDateFilter) : null;
    const endFilter = endDateFilter ? parseISO(endDateFilter) : null;

    return allTasks.filter(task => {
      const searchMatch = searchTerm === "" || task.name.toLowerCase().includes(searchTerm.toLowerCase()) || task.project_name.toLowerCase().includes(searchTerm.toLowerCase());
      const projectMatch = projectFilter === "all" || task.project_id.toString() === projectFilter;
      const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
      const statusMatch = statusFilter === "all" || task.status === statusFilter;

      const [assigneeType, assigneeId] = assigneeFilter.split('_');
      const assigneeMatch = assigneeFilter === "all" || (task.assignee_type === assigneeType && task.assignee_id.toString() === assigneeId);

      const taskStart = parseISO(task.start_date);
      const taskEnd = parseISO(task.end_date);
      const startDateMatch = !startFilter || taskStart >= startFilter;
      const endDateMatch = !endFilter || taskEnd <= endFilter;

      return searchMatch && projectMatch && priorityMatch && statusMatch && assigneeMatch && startDateMatch && endDateMatch;
    });
  }, [allTasks, searchTerm, projectFilter, priorityFilter, statusFilter, assigneeFilter, startDateFilter, endDateFilter]);

  const handleEdit = (task: Task) => { setEditingTask(task); setIsFormModalOpen(true); };
  const handleDelete = (task: Task) => { setDeletingTask(task); setIsDeleteAlertOpen(true); };
  const handleView = (task: Task) => { setViewingTask(task); setIsViewModalOpen(true); };

  const confirmDelete = async () => {
    if (!deletingTask) return;
    try {
      await fetch(`/api/tasks?id=${deletingTask.id}`, { method: 'DELETE' });
      toast.success("Tâche supprimée !");
      fetchAllData();
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
    fetchAllData();
  };

  const handleTaskUpdate = () => {
    setIsViewModalOpen(false);
    fetchAllData();
  };

  const openCreateModal = () => { setEditingTask(null); setIsFormModalOpen(true); }

  if (loading) {
      return <DashboardLayout><div>Chargement...</div></DashboardLayout>;
  }
  if (error) {
      return <DashboardLayout><div className="text-red-500">Erreur: {error}</div></DashboardLayout>;
  }

  const getTasksByStatus = (status: Task['status']) => filteredTasks.filter(task => task.status === status);
  const uniqueProjects = [...new Map(allTasks.map(task => [task.project_id, {id: task.project_id, name: task.project_name}])).values()];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tâches</h1>
        <Button onClick={openCreateModal}>Ajouter une tâche</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
        <Input placeholder="Rechercher par nom, projet..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="col-span-full"/>
        <Select value={projectFilter} onValueChange={setProjectFilter}><SelectTrigger><SelectValue placeholder="Filtrer par projet"/></SelectTrigger><SelectContent><SelectItem value="all">Tous les projets</SelectItem>{uniqueProjects.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}</SelectContent></Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}><SelectTrigger><SelectValue placeholder="Filtrer par priorité"/></SelectTrigger><SelectContent><SelectItem value="all">Toutes les priorités</SelectItem>{PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder="Filtrer par statut"/></SelectTrigger><SelectContent><SelectItem value="all">Tous les statuts</SelectItem>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}><SelectTrigger><SelectValue placeholder="Filtrer par assigné"/></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les assignés</SelectItem>
            <SelectGroup><SelectLabel>Utilisateurs</SelectLabel>{users.map(u => <SelectItem key={`user_${u.id}`} value={`user_${u.id}`}>{u.name}</SelectItem>)}</SelectGroup>
            <SelectGroup><SelectLabel>Entités</SelectLabel>{entities.map(e => <SelectItem key={`entity_${e.id}`} value={`entity_${e.id}`}>{e.name}</SelectItem>)}</SelectGroup>
          </SelectContent>
        </Select>
        <div className="col-span-2 grid grid-cols-2 gap-4">
            <Input type="date" value={startDateFilter} onChange={e => setStartDateFilter(e.target.value)} />
            <Input type="date" value={endDateFilter} onChange={e => setEndDateFilter(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-6">
        {STATUSES.map(status => <KanbanColumn key={status} title={status} tasks={getTasksByStatus(status)} onEdit={handleEdit} onDelete={handleDelete} onView={handleView} />)}
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

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la Tâche</DialogTitle>
          </DialogHeader>
          {viewingTask && <TaskView task={viewingTask} onTaskUpdate={handleTaskUpdate} />}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
