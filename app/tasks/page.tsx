// app/tasks/page.tsx
"use client";

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskForm } from '@/components/tasks/task-form';
import { TaskView } from '@/components/tasks/task-view';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

// ... (Définitions des types Task, User, Entity et des constantes) ...

function TaskCard({ task, onEdit, onDelete, onView }: { task: Task; onEdit: (task: Task) => void; onDelete: (task: Task) => void; onView: (task: Task) => void; }) {
  // ... (JSX de la TaskCard avec les boutons visibles) ...
}

function KanbanColumn({ title, tasks, onEdit, onDelete, onView }: { title: string; tasks: Task[]; onEdit: (task: Task) => void; onDelete: (task: Task) => void; onView: (task: Task) => void; }) {
  // ... (JSX de la colonne Kanban) ...
}

export default function TasksPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  // ... (autres états) ...

  const fetchAllData = async () => {
    // ... (logique de fetch) ...
  };
  useEffect(() => { fetchAllData(); }, []);

  const filteredTasks = useMemo(() => {
    // ... (logique de filtrage) ...
    return allTasks;
  }, [allTasks /*, ...autres dépendances de filtre */]);

  // ... (gestionnaires d'événements handleEdit, handleDelete, etc.) ...

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tâches</h1>
        <Button onClick={() => { /* Ouvre le modal de création */ }}>Ajouter une tâche</Button>
      </div>

      {/* ... (Section des filtres) ... */}

      <div className="flex gap-6">
        {/* ... (Mapping des colonnes Kanban) ... */}
      </div>

      {/* Modals */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>{editingTask ? 'Modifier la tâche' : 'Créer une tâche'}</DialogTitle></DialogHeader><TaskForm onSuccess={handleFormSuccess} task={editingTask} /></DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        {/* ... (Contenu de l'alerte de suppression) ... */}
      </AlertDialog>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>Détails de la Tâche</DialogTitle></DialogHeader>
          {viewingTask && <TaskView task={viewingTask} onTaskUpdate={handleTaskUpdate} />}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
