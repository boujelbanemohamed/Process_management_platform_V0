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
import { MoreHorizontal } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from '@/components/tasks/task-form';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

// --- Types ---
type Task = { id: number; task_number: string; name: string; status: 'À faire' | 'En cours' | 'En attente de validation' | 'Terminé'; project_id: number; project_name: string; assignee_id: number; assignee_type: string; assignee_name: string; priority: string; start_date: string; end_date: string; [key: string]: any; };
type User = { id: number; name: string; };
type Entity = { id: number; name: string; };

const STATUSES: Task['status'][] = ['À faire', 'En cours', 'En attente de validation', 'Terminé'];
const PRIORITIES = ["Basse", "Moyenne", "Haute", "Critique"];

// --- Composants ---
function TaskCard({ task, onEdit, onDelete }: { task: Task; onEdit: (task: Task) => void; onDelete: (task: Task) => void; }) { /* ... inchangé ... */ }
function KanbanColumn({ title, tasks, onEdit, onDelete }: { title: string; tasks: Task[]; onEdit: (task: Task) => void; onDelete: (task: Task) => void; }) { /* ... inchangé ... */ }

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

  // ... (toutes les fonctions de handler, inchangées)

  if (loading) { /* ... */ }
  if (error) { /* ... */ }

  const uniqueProjects = [...new Map(allTasks.map(task => [task.project_id, {id: task.project_id, name: task.project_name}])).values()];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tâches</h1>
        <Button onClick={() => { setEditingTask(null); setIsFormModalOpen(true); }}>Ajouter une tâche</Button>
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
        {STATUSES.map(status => <KanbanColumn key={status} title={status} tasks={filteredTasks.filter(task => task.status === status)} onEdit={(task) => { setEditingTask(task); setIsFormModalOpen(true); }} onDelete={(task) => { setDeletingTask(task); setIsDeleteAlertOpen(true); }} />)}
      </div>

      {/* ... (Modales Dialog et AlertDialog, inchangées) ... */}
    </DashboardLayout>
  );
}
