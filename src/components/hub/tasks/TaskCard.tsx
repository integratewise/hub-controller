'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, Paperclip, Flag, MoreHorizontal, User } from 'lucide-react';
import type { Task } from '@/lib/hub/types';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}

const priorityConfig = {
  urgent: { color: 'bg-red-500', label: 'Urgent', textColor: 'text-red-400' },
  high: { color: 'bg-orange-500', label: 'High', textColor: 'text-orange-400' },
  medium: { color: 'bg-yellow-500', label: 'Medium', textColor: 'text-yellow-400' },
  low: { color: 'bg-blue-500', label: 'Low', textColor: 'text-blue-400' },
};

const labelColors = [
  'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'bg-green-500/20 text-green-400 border-green-500/30',
  'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  'bg-pink-500/20 text-pink-400 border-pink-500/30',
];

export function TaskCard({ task, onClick, isDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityInfo = priorityConfig[task.priority];
  const isOverdue = task.due_date && new Date(task.due_date) < new Date();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        group bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 rounded-lg p-3
        cursor-pointer transition-all hover:border-neutral-600
        ${isDragging ? 'shadow-xl ring-2 ring-blue-500/50 rotate-2' : ''}
      `}
    >
      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map((label, i) => (
            <span
              key={label}
              className={`text-[10px] px-1.5 py-0.5 rounded border ${labelColors[i % labelColors.length]}`}
            >
              {label}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="text-[10px] text-neutral-500">+{task.labels.length - 3}</span>
          )}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium text-neutral-100 mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-neutral-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Priority */}
          <div className={`flex items-center gap-1 ${priorityInfo.textColor}`}>
            <Flag className="w-3 h-3" />
            <span className="text-[10px]">{priorityInfo.label}</span>
          </div>

          {/* Due date */}
          {task.due_date && (
            <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-neutral-500'}`}>
              <Calendar className="w-3 h-3" />
              <span>{formatDate(task.due_date)}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Comments count */}
          {task.comments_count && task.comments_count > 0 && (
            <div className="flex items-center gap-1 text-neutral-500 text-xs">
              <MessageSquare className="w-3 h-3" />
              <span>{task.comments_count}</span>
            </div>
          )}

          {/* Attachments */}
          {task.attachments_count && task.attachments_count > 0 && (
            <div className="flex items-center gap-1 text-neutral-500 text-xs">
              <Paperclip className="w-3 h-3" />
              <span>{task.attachments_count}</span>
            </div>
          )}

          {/* Assignee */}
          {task.assignee ? (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-medium">
              {task.assignee.name?.charAt(0) || task.assignee.email.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <User className="w-3 h-3 text-neutral-400" />
            </div>
          )}
        </div>
      </div>

      {/* Quick actions on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          // Open task menu
        }}
        className="absolute top-2 right-2 p-1 rounded bg-neutral-700 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <MoreHorizontal className="w-3 h-3 text-neutral-400" />
      </button>
    </div>
  );
}

// Simpler card without drag for modals/previews
export function TaskCardSimple({ task, onClick }: { task: Task; onClick?: () => void }) {
  const priorityInfo = priorityConfig[task.priority];

  return (
    <div
      onClick={onClick}
      className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg p-3 cursor-pointer hover:bg-neutral-800 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-neutral-100 flex-1">{task.title}</h4>
        <div className={`w-2 h-2 rounded-full ${priorityInfo.color}`} />
      </div>
      {task.due_date && (
        <div className="flex items-center gap-1 mt-2 text-xs text-neutral-500">
          <Calendar className="w-3 h-3" />
          <span>{new Date(task.due_date).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  );
}
