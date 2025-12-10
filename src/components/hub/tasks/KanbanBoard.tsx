'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, MoreHorizontal } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Task, TaskColumn, TaskBoard } from '@/lib/hub/types';

interface KanbanBoardProps {
  board: TaskBoard;
  tasks: Task[];
  onTaskMove?: (taskId: string, newColumnId: string, newOrder: number) => void;
  onTaskClick?: (task: Task) => void;
  onAddTask?: (columnId: string) => void;
}

interface KanbanColumnProps {
  column: TaskColumn;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onAddTask?: () => void;
}

const columnColors: Record<string, string> = {
  backlog: 'border-t-neutral-500',
  todo: 'border-t-blue-500',
  'in-progress': 'border-t-yellow-500',
  'in-review': 'border-t-purple-500',
  done: 'border-t-green-500',
};

function KanbanColumn({ column, tasks, onTaskClick, onAddTask }: KanbanColumnProps) {
  const colorClass = column.color ? `border-t-${column.color}-500` : columnColors[column.id] || 'border-t-neutral-500';

  return (
    <div className="flex-shrink-0 w-72 bg-neutral-900/50 rounded-lg border border-neutral-800">
      {/* Column header */}
      <div className={`p-3 border-b border-neutral-800 border-t-2 ${colorClass} rounded-t-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-neutral-100">{column.name}</h3>
            <span className="text-xs text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded-full">
              {tasks.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onAddTask}
              className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-300px)] overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-neutral-500">
            <p className="text-sm">No tasks</p>
            <button
              onClick={onAddTask}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              + Add a task
            </button>
          </div>
        )}
      </div>

      {/* Add task button */}
      <div className="p-2 border-t border-neutral-800">
        <button
          onClick={onAddTask}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add task
        </button>
      </div>
    </div>
  );
}

export function KanbanBoard({ board, tasks, onTaskMove, onTaskClick, onAddTask }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  // Update local tasks when props change
  useMemo(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    board.columns.forEach(col => {
      grouped[col.id] = localTasks
        .filter(t => t.column_id === col.id)
        .sort((a, b) => a.order - b.order);
    });
    return grouped;
  }, [localTasks, board.columns]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = localTasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = localTasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Find which column the task is being dragged over
    let overColumnId = over.id as string;

    // Check if over is a task
    const overTask = localTasks.find(t => t.id === over.id);
    if (overTask) {
      overColumnId = overTask.column_id;
    }

    // If the column is different, update the task's column
    if (activeTask.column_id !== overColumnId && board.columns.some(c => c.id === overColumnId)) {
      setLocalTasks(prev => prev.map(t =>
        t.id === activeTask.id ? { ...t, column_id: overColumnId } : t
      ));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = localTasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Find the column and calculate new order
    const columnTasks = tasksByColumn[activeTask.column_id] || [];
    const overTask = localTasks.find(t => t.id === over.id);

    let newOrder = 0;
    if (overTask && overTask.id !== activeTask.id) {
      const overIndex = columnTasks.findIndex(t => t.id === over.id);
      const activeIndex = columnTasks.findIndex(t => t.id === active.id);

      if (overIndex !== -1) {
        const newTasks = arrayMove(columnTasks, activeIndex, overIndex);
        newOrder = overIndex;

        // Update local state
        setLocalTasks(prev => {
          const otherTasks = prev.filter(t => t.column_id !== activeTask.column_id);
          return [...otherTasks, ...newTasks.map((t, i) => ({ ...t, order: i }))];
        });
      }
    }

    // Notify parent
    onTaskMove?.(activeTask.id, activeTask.column_id, newOrder);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[500px]">
        {board.columns
          .sort((a, b) => a.order - b.order)
          .map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn[column.id] || []}
              onTaskClick={onTaskClick}
              onAddTask={() => onAddTask?.(column.id)}
            />
          ))}

        {/* Add column button */}
        <div className="flex-shrink-0 w-72">
          <button className="w-full h-12 flex items-center justify-center gap-2 text-neutral-400 hover:text-neutral-100 border border-dashed border-neutral-700 hover:border-neutral-600 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Add column
          </button>
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard task={activeTask} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  );
}
