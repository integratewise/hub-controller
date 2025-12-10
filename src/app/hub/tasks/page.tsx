'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, LayoutGrid, List, Calendar, Settings } from 'lucide-react';
import { KanbanBoard } from '@/components/hub/tasks/KanbanBoard';
import { Section } from '@/components/hub/Section';
import type { Task, TaskBoard, TaskColumn } from '@/lib/hub/types';

// Default board configuration
const defaultColumns: TaskColumn[] = [
  { id: 'backlog', name: 'Backlog', color: 'neutral', order: 0 },
  { id: 'todo', name: 'To Do', color: 'blue', order: 1 },
  { id: 'in-progress', name: 'In Progress', color: 'yellow', order: 2 },
  { id: 'in-review', name: 'In Review', color: 'purple', order: 3 },
  { id: 'done', name: 'Done', color: 'green', order: 4 },
];

// Sample tasks for demo
const sampleTasks: Task[] = [
  {
    id: '1',
    board_id: 'main',
    column_id: 'todo',
    title: 'Design new landing page',
    description: 'Create wireframes and mockups for the new marketing landing page',
    priority: 'high',
    labels: ['design', 'marketing'],
    order: 0,
    due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
    comments_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    board_id: 'main',
    column_id: 'todo',
    title: 'Implement user authentication',
    description: 'Add login, signup, and password reset functionality',
    priority: 'urgent',
    labels: ['backend', 'security'],
    order: 1,
    due_date: new Date(Date.now() + 86400000).toISOString(),
    comments_count: 5,
    attachments_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    board_id: 'main',
    column_id: 'in-progress',
    title: 'API integration with Stripe',
    description: 'Connect payment processing for subscription plans',
    priority: 'high',
    labels: ['backend', 'payments'],
    order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    board_id: 'main',
    column_id: 'in-progress',
    title: 'Write API documentation',
    priority: 'medium',
    labels: ['docs'],
    order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    board_id: 'main',
    column_id: 'in-review',
    title: 'Mobile responsive design',
    description: 'Ensure all pages work correctly on mobile devices',
    priority: 'medium',
    labels: ['frontend', 'design'],
    order: 0,
    comments_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    board_id: 'main',
    column_id: 'done',
    title: 'Set up CI/CD pipeline',
    priority: 'high',
    labels: ['devops'],
    order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    board_id: 'main',
    column_id: 'backlog',
    title: 'Add dark mode support',
    priority: 'low',
    labels: ['frontend'],
    order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    board_id: 'main',
    column_id: 'backlog',
    title: 'Performance optimization',
    description: 'Identify and fix performance bottlenecks',
    priority: 'medium',
    labels: ['performance'],
    order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

type ViewMode = 'board' | 'list' | 'calendar';

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('main');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskColumnId, setNewTaskColumnId] = useState<string | null>(null);

  const board: TaskBoard = {
    id: 'main',
    org_id: 'org-1',
    name: 'Main Board',
    columns: defaultColumns,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTaskMove = (taskId: string, newColumnId: string, newOrder: number) => {
    setTasks(prev => prev.map(task =>
      task.id === taskId
        ? { ...task, column_id: newColumnId, order: newOrder, updated_at: new Date().toISOString() }
        : task
    ));
    // TODO: API call to persist the change
  };

  const handleTaskClick = (task: Task) => {
    // TODO: Open task detail modal
    console.log('Task clicked:', task);
  };

  const handleAddTask = (columnId: string) => {
    setNewTaskColumnId(columnId);
    setShowNewTaskModal(true);
  };

  const taskStats = {
    total: tasks.length,
    todo: tasks.filter(t => t.column_id === 'todo').length,
    inProgress: tasks.filter(t => t.column_id === 'in-progress').length,
    done: tasks.filter(t => t.column_id === 'done').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Tasks</h1>
          <p className="text-sm text-neutral-400 mt-1">
            {taskStats.total} tasks · {taskStats.inProgress} in progress · {taskStats.overdue > 0 && (
              <span className="text-red-400">{taskStats.overdue} overdue</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex items-center bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('board')}
              className={`p-2 rounded ${viewMode === 'board' ? 'bg-neutral-700 text-neutral-100' : 'text-neutral-400 hover:text-neutral-100'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-neutral-700 text-neutral-100' : 'text-neutral-400 hover:text-neutral-100'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded ${viewMode === 'calendar' ? 'bg-neutral-700 text-neutral-100' : 'text-neutral-400 hover:text-neutral-100'}`}
            >
              <Calendar className="w-4 h-4" />
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25">
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          />
        </div>

        <button className="flex items-center gap-2 px-3 py-2 text-neutral-400 hover:text-neutral-100 bg-neutral-800 border border-neutral-700 rounded-lg transition-colors">
          <Filter className="w-4 h-4" />
          Filter
        </button>

        <button className="flex items-center gap-2 px-3 py-2 text-neutral-400 hover:text-neutral-100 bg-neutral-800 border border-neutral-700 rounded-lg transition-colors">
          <Settings className="w-4 h-4" />
          Board Settings
        </button>
      </div>

      {/* Board view */}
      {viewMode === 'board' && (
        <KanbanBoard
          board={board}
          tasks={filteredTasks}
          onTaskMove={handleTaskMove}
          onTaskClick={handleTaskClick}
          onAddTask={handleAddTask}
        />
      )}

      {/* List view placeholder */}
      {viewMode === 'list' && (
        <Section title="Task List">
          <div className="space-y-2">
            {filteredTasks.map(task => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className="flex items-center gap-4 p-3 bg-neutral-800/50 border border-neutral-700/50 rounded-lg hover:bg-neutral-800 cursor-pointer transition-colors"
              >
                <input type="checkbox" className="rounded border-neutral-600 bg-neutral-700" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-neutral-100">{task.title}</div>
                  {task.description && (
                    <div className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{task.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' :
                    task.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {task.priority}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {defaultColumns.find(c => c.id === task.column_id)?.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Calendar view placeholder */}
      {viewMode === 'calendar' && (
        <Section title="Calendar View">
          <div className="flex items-center justify-center h-64 text-neutral-500">
            <p>Calendar view coming soon...</p>
          </div>
        </Section>
      )}
    </div>
  );
}
