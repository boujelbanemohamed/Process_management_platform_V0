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
import { MoreHorizontal, Eye } from 'lucide-react';
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
            <DropdownMenuItem onClick={() => onEdit(task)}>Modifier</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(task)} className="text-red-600">Supprimer</DropdownMenuItem>
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

  const fetchAllData = async () => { /* ... (inchangé) ... */ };
  useEffect(() => { fetchAllData(); }, []);

  const filteredTasks = useMemo(() => { /* ... (inchangé) ... */ }, [allTasks, /* ... */]);

  const handleEdit = (task: Task) => { setEditingTask(task); setIsFormModalOpen(true); };
  const handleDelete = (task: Task) => { setDeletingTask(task); setIsDeleteAlertOpen(true); };
  const handleView = (task: Task) => { setViewingTask(task); setIsViewModalOpen(true); };

  const confirmDelete = async () => { /* ... (inchangé) ... */ };

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

  if (loading) { /* ... */ }
  if (error) { /* ... */ }

  const getTasksByStatus = (status: Task['status']) => filteredTasks.filter(task => task.status === status);
  const uniqueProjects = [...new Map(allTasks.map(task => [task.project_id, {id: task.project_id, name: task.project_name}])).values()];

  return (
    <DashboardLayout>
      {/* ... (Header et Filtres) */}

      <div className="flex gap-6">
        {STATUSES.map(status => <KanbanColumn key={status} title={status} tasks={getTasksByStatus(status)} onEdit={handleEdit} onDelete={handleDelete} onView={handleView} />)}
      </div>

      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>{/* ... */}</DialogTitle></DialogHeader><TaskForm onSuccess={handleFormSuccess} task={editingTask} /></DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        {/* ... */}
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
