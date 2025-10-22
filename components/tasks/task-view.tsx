// components/tasks/task-view.tsx
"use client";

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';

// --- Types et Constantes ---
type TaskStatus = 'À faire' | 'En cours' | 'En attente de validation' | 'Terminé';
const STATUSES: TaskStatus[] = ['À faire', 'En cours', 'En attente de validation', 'Terminé'];

type Task = {
  id: number;
  project_id: number; // Ajout pour le lien
  task_number: string;
  name: string;
  description?: string;
  status: TaskStatus;
  project_name: string;
  assignee_name: string;
  priority: string;
  start_date: string;
  end_date: string;
  completion_date?: string;
  remarks?: string;
};

interface TaskViewProps {
  task: Task;
  onTaskUpdate: () => void; // Callback générique pour rafraîchir
}

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null;
  return (
    <div>
      <p className="text-sm font-semibold text-gray-500">{label}</p>
      <p className="text-gray-800 whitespace-pre-wrap">{value}</p>
    </div>
  );
};

export function TaskView({ task, onTaskUpdate }: TaskViewProps) {
  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/tasks?id=${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Échec de la mise à jour");
      toast.success("Statut de la tâche mis à jour !");
      onTaskUpdate(); // Notifier le parent de rafraîchir les données
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du statut.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="pb-2 border-b">
        <Link href={`/projects/${task.project_id}`} className="text-sm text-blue-600 hover:underline cursor-pointer">{task.project_name}</Link>
        <h2 className="text-2xl font-bold">{task.name}</h2>
        <p className="text-lg text-gray-700 font-mono">{task.task_number}</p>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-4">
        <div>
            <p className="text-sm font-semibold text-gray-500">Statut</p>
            <Select onValueChange={handleStatusChange} defaultValue={task.status}>
                <SelectTrigger className="w-[200px] mt-1">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <DetailItem label="Priorité" value={task.priority} />
        <DetailItem label="Assigné à" value={task.assignee_name} />
        <div>
          <p className="text-sm font-semibold text-gray-500">Projet</p>
          <Link href={`/projects/${task.project_id}`} className="text-gray-800 hover:underline text-blue-600">
            {task.project_name}
          </Link>
        </div>
        <DetailItem label="Date de début" value={format(new Date(task.start_date), 'dd MMMM yyyy', { locale: fr })} />
        <DetailItem label="Date de fin" value={format(new Date(task.end_date), 'dd MMMM yyyy', { locale: fr })} />
      </div>

      <DetailItem label="Description" value={task.description} />
      <DetailItem label="Remarques" value={task.remarks} />

      {task.completion_date && (
        <DetailItem
          label="Date de finalisation"
          value={format(new Date(task.completion_date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
        />
      )}
    </div>
  );
}
