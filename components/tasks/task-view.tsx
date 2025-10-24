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

// --- Types et Constantes ---
type TaskStatus = 'À faire' | 'En cours' | 'En attente de validation' | 'Terminé';
const STATUSES: TaskStatus[] = ['À faire', 'En cours', 'En attente de validation', 'Terminé'];

type Task = {
  id: number;
  project_id: number;
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

type Comment = {
  id: number;
  content: string;
  created_at: string;
  author_name: string;
};

interface TaskViewProps {
  task: Task;
  onTaskUpdate: () => void;
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const response = await fetch(`/api/comments?task_id=${task.id}`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Erreur lors du chargement des commentaires.");
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (task.id) fetchComments();
  }, [task.id]);

  const handleStatusChange = async (newStatus: TaskStatus) => {
    // ... (logique de changement de statut)
  };

  const handleCommentSubmit = async () => {
    const currentUser = AuthService.getCurrentUser();
    if (!newComment.trim() || !currentUser) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, userId: currentUser.id, content: newComment }),
      });
      if (!response.ok) throw new Error('Failed to post comment');
      const savedComment = await response.json();
      setComments([savedComment, ...comments]);
      setNewComment('');
      toast.success("Commentaire ajouté !");
    } catch (error) {
      toast.error("Erreur lors de l'ajout du commentaire.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Détails de la tâche */}
      <div className="space-y-4">
        {/* ... (détails de la tâche) */}
      </div>

      {/* Section Commentaires */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-lg font-semibold">Commentaires</h3>
        <div className="space-y-2">
          <Textarea
            placeholder="Ajouter un commentaire..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button onClick={handleCommentSubmit}>Ajouter le commentaire</Button>
        </div>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          {loadingComments ? <p>Chargement...</p> : comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 p-3 rounded-lg border">
              <p className="text-gray-800">{comment.content}</p>
              <div className="text-xs text-gray-500 mt-2 flex justify-between">
                <span>Par {comment.author_name}</span>
                <span>{format(new Date(comment.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
