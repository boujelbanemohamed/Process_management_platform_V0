// components/tasks/task-view.tsx
"use client";

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AuthService } from '@/lib/auth';

// ... (Définitions des types Task, Comment, etc.) ...

interface TaskViewProps {
  task: Task;
  onTaskUpdate: () => void;
}

const DetailItem = ({ label, value }: { label: string; value?: string | null }) => {
    // ...
};

export function TaskView({ task, onTaskUpdate }: TaskViewProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);

  // ... (logique fetchComments, handleStatusChange, handleCommentSubmit) ...

  return (
    <div className="space-y-6">
      {/* Section Détails de la tâche */}
      <div className="space-y-4">
        <div className="pb-2 border-b">
          <div className="text-sm text-gray-500">
            Nom du projet :{' '}
            <Link href={`/projects/${task.project_id}`} className="text-blue-600 hover:underline cursor-pointer">{task.project_name}</Link>
          </div>
          <h2 className="text-2xl font-bold mt-1">{task.name}</h2>
          <p className="text-lg text-gray-700 font-mono">{task.task_number}</p>
        </div>
        {/* ... (autres détails de la tâche) ... */}
      </div>

      {/* Section Commentaires */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold">Commentaires</h3>
        {/* ... (formulaire d'ajout de commentaire) ... */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {/* ... (liste des commentaires) ... */}
        </div>
      </div>
    </div>
  );
}
