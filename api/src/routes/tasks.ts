// Tasks API Routes - Multi-tenant task management with Kanban boards
import { Hono } from 'hono';
import { Env } from '../types';
import { authMiddleware, type AuthEnv } from '../auth/middleware';

const tasks = new Hono<AuthEnv>();

// Apply auth middleware to all routes
tasks.use('*', authMiddleware);

// ============================================
// BOARDS
// ============================================

// List all boards for the organization
tasks.get('/boards', async (c) => {
  const orgId = c.get('orgId');

  const result = await c.env.DB.prepare(`
    SELECT * FROM task_boards WHERE org_id = ? ORDER BY created_at DESC
  `).bind(orgId).all();

  // Parse columns JSON for each board
  const boards = (result.results || []).map((board: Record<string, unknown>) => ({
    ...board,
    columns: board.columns ? JSON.parse(board.columns as string) : [],
    settings: board.settings ? JSON.parse(board.settings as string) : null,
  }));

  return c.json(boards);
});

// Get a specific board with tasks
tasks.get('/boards/:id', async (c) => {
  const orgId = c.get('orgId');
  const boardId = c.req.param('id');

  const board = await c.env.DB.prepare(`
    SELECT * FROM task_boards WHERE id = ? AND org_id = ?
  `).bind(boardId, orgId).first();

  if (!board) {
    return c.json({ error: 'Board not found' }, 404);
  }

  // Get all tasks for this board
  const tasksResult = await c.env.DB.prepare(`
    SELECT t.*, u.name as assignee_name, u.email as assignee_email, u.avatar_url as assignee_avatar
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.board_id = ?
    ORDER BY t.column_id, t.order ASC
  `).bind(boardId).all();

  return c.json({
    ...board,
    columns: board.columns ? JSON.parse(board.columns as string) : [],
    settings: board.settings ? JSON.parse(board.settings as string) : null,
    tasks: (tasksResult.results || []).map((task: Record<string, unknown>) => ({
      ...task,
      labels: task.labels ? JSON.parse(task.labels as string) : [],
      assignee: task.assignee_id ? {
        id: task.assignee_id,
        name: task.assignee_name,
        email: task.assignee_email,
        avatar_url: task.assignee_avatar,
      } : null,
    })),
  });
});

// Create a new board
tasks.post('/boards', async (c) => {
  const orgId = c.get('orgId');
  const userId = c.get('userId');
  const data = await c.req.json();

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Default columns if not provided
  const defaultColumns = [
    { id: 'backlog', name: 'Backlog', color: 'neutral', order: 0 },
    { id: 'todo', name: 'To Do', color: 'blue', order: 1 },
    { id: 'in-progress', name: 'In Progress', color: 'yellow', order: 2 },
    { id: 'in-review', name: 'In Review', color: 'purple', order: 3 },
    { id: 'done', name: 'Done', color: 'green', order: 4 },
  ];

  await c.env.DB.prepare(`
    INSERT INTO task_boards (id, org_id, name, description, columns, settings, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    orgId,
    data.name,
    data.description || null,
    JSON.stringify(data.columns || defaultColumns),
    data.settings ? JSON.stringify(data.settings) : null,
    userId,
    now,
    now
  ).run();

  return c.json({
    id,
    org_id: orgId,
    name: data.name,
    description: data.description,
    columns: data.columns || defaultColumns,
    settings: data.settings || null,
    created_at: now,
    updated_at: now,
  }, 201);
});

// Update a board
tasks.put('/boards/:id', async (c) => {
  const orgId = c.get('orgId');
  const boardId = c.req.param('id');
  const data = await c.req.json();
  const now = new Date().toISOString();

  // Build update query dynamically
  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  if (data.columns !== undefined) {
    updates.push('columns = ?');
    values.push(JSON.stringify(data.columns));
  }
  if (data.settings !== undefined) {
    updates.push('settings = ?');
    values.push(data.settings ? JSON.stringify(data.settings) : null);
  }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(boardId);
  values.push(orgId);

  await c.env.DB.prepare(`
    UPDATE task_boards SET ${updates.join(', ')} WHERE id = ? AND org_id = ?
  `).bind(...values).run();

  const board = await c.env.DB.prepare(`
    SELECT * FROM task_boards WHERE id = ? AND org_id = ?
  `).bind(boardId, orgId).first();

  if (!board) {
    return c.json({ error: 'Board not found' }, 404);
  }

  return c.json({
    ...board,
    columns: board.columns ? JSON.parse(board.columns as string) : [],
    settings: board.settings ? JSON.parse(board.settings as string) : null,
  });
});

// Delete a board
tasks.delete('/boards/:id', async (c) => {
  const orgId = c.get('orgId');
  const boardId = c.req.param('id');

  // Delete all tasks in the board first
  await c.env.DB.prepare(`
    DELETE FROM tasks WHERE board_id = ?
  `).bind(boardId).run();

  // Delete the board
  const result = await c.env.DB.prepare(`
    DELETE FROM task_boards WHERE id = ? AND org_id = ?
  `).bind(boardId, orgId).run();

  if (!result.meta.changes) {
    return c.json({ error: 'Board not found' }, 404);
  }

  return c.json({ success: true });
});

// ============================================
// TASKS
// ============================================

// List all tasks (optionally filtered)
tasks.get('/', async (c) => {
  const orgId = c.get('orgId');
  const boardId = c.req.query('board_id');
  const columnId = c.req.query('column_id');
  const assigneeId = c.req.query('assignee_id');
  const priority = c.req.query('priority');
  const limit = parseInt(c.req.query('limit') || '100');
  const offset = parseInt(c.req.query('offset') || '0');

  let query = `
    SELECT t.*, u.name as assignee_name, u.email as assignee_email, u.avatar_url as assignee_avatar,
           b.name as board_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    JOIN task_boards b ON t.board_id = b.id
    WHERE b.org_id = ?
  `;
  const params: (string | number)[] = [orgId];

  if (boardId) {
    query += ' AND t.board_id = ?';
    params.push(boardId);
  }
  if (columnId) {
    query += ' AND t.column_id = ?';
    params.push(columnId);
  }
  if (assigneeId) {
    query += ' AND t.assignee_id = ?';
    params.push(assigneeId);
  }
  if (priority) {
    query += ' AND t.priority = ?';
    params.push(priority);
  }

  query += ' ORDER BY t.column_id, t.order ASC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const result = await c.env.DB.prepare(query).bind(...params).all();

  const tasksData = (result.results || []).map((task: Record<string, unknown>) => ({
    ...task,
    labels: task.labels ? JSON.parse(task.labels as string) : [],
    assignee: task.assignee_id ? {
      id: task.assignee_id,
      name: task.assignee_name,
      email: task.assignee_email,
      avatar_url: task.assignee_avatar,
    } : null,
  }));

  return c.json(tasksData);
});

// Get a specific task
tasks.get('/:id', async (c) => {
  const orgId = c.get('orgId');
  const taskId = c.req.param('id');

  const task = await c.env.DB.prepare(`
    SELECT t.*, u.name as assignee_name, u.email as assignee_email, u.avatar_url as assignee_avatar,
           b.name as board_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    JOIN task_boards b ON t.board_id = b.id
    WHERE t.id = ? AND b.org_id = ?
  `).bind(taskId, orgId).first();

  if (!task) {
    return c.json({ error: 'Task not found' }, 404);
  }

  // Get comments count
  const commentsResult = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM task_comments WHERE task_id = ?
  `).bind(taskId).first<{ count: number }>();

  return c.json({
    ...task,
    labels: task.labels ? JSON.parse(task.labels as string) : [],
    assignee: task.assignee_id ? {
      id: task.assignee_id,
      name: task.assignee_name,
      email: task.assignee_email,
      avatar_url: task.assignee_avatar,
    } : null,
    comments_count: commentsResult?.count || 0,
  });
});

// Create a new task
tasks.post('/', async (c) => {
  const userId = c.get('userId');
  const data = await c.req.json();

  if (!data.board_id || !data.title) {
    return c.json({ error: 'board_id and title are required' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  // Get the max order in the column
  const maxOrderResult = await c.env.DB.prepare(`
    SELECT MAX("order") as max_order FROM tasks WHERE board_id = ? AND column_id = ?
  `).bind(data.board_id, data.column_id || 'backlog').first<{ max_order: number | null }>();

  const order = (maxOrderResult?.max_order ?? -1) + 1;

  await c.env.DB.prepare(`
    INSERT INTO tasks (id, board_id, column_id, title, description, priority, assignee_id, due_date, labels, "order", parent_id, created_by, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    data.board_id,
    data.column_id || 'backlog',
    data.title,
    data.description || null,
    data.priority || 'medium',
    data.assignee_id || null,
    data.due_date || null,
    data.labels ? JSON.stringify(data.labels) : null,
    order,
    data.parent_id || null,
    userId,
    now,
    now
  ).run();

  return c.json({
    id,
    board_id: data.board_id,
    column_id: data.column_id || 'backlog',
    title: data.title,
    description: data.description,
    priority: data.priority || 'medium',
    assignee_id: data.assignee_id,
    due_date: data.due_date,
    labels: data.labels || [],
    order,
    parent_id: data.parent_id,
    created_by: userId,
    created_at: now,
    updated_at: now,
  }, 201);
});

// Update a task
tasks.put('/:id', async (c) => {
  const orgId = c.get('orgId');
  const taskId = c.req.param('id');
  const data = await c.req.json();
  const now = new Date().toISOString();

  // Verify task belongs to org
  const existing = await c.env.DB.prepare(`
    SELECT t.* FROM tasks t
    JOIN task_boards b ON t.board_id = b.id
    WHERE t.id = ? AND b.org_id = ?
  `).bind(taskId, orgId).first();

  if (!existing) {
    return c.json({ error: 'Task not found' }, 404);
  }

  // Build update query
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
  if (data.column_id !== undefined) { updates.push('column_id = ?'); values.push(data.column_id); }
  if (data.priority !== undefined) { updates.push('priority = ?'); values.push(data.priority); }
  if (data.assignee_id !== undefined) { updates.push('assignee_id = ?'); values.push(data.assignee_id); }
  if (data.due_date !== undefined) { updates.push('due_date = ?'); values.push(data.due_date); }
  if (data.labels !== undefined) { updates.push('labels = ?'); values.push(JSON.stringify(data.labels)); }
  if (data.order !== undefined) { updates.push('"order" = ?'); values.push(data.order); }
  if (data.parent_id !== undefined) { updates.push('parent_id = ?'); values.push(data.parent_id); }

  updates.push('updated_at = ?');
  values.push(now);
  values.push(taskId);

  await c.env.DB.prepare(`
    UPDATE tasks SET ${updates.join(', ')} WHERE id = ?
  `).bind(...values).run();

  // Return updated task
  const task = await c.env.DB.prepare(`
    SELECT t.*, u.name as assignee_name, u.email as assignee_email
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    WHERE t.id = ?
  `).bind(taskId).first();

  return c.json({
    ...task,
    labels: task?.labels ? JSON.parse(task.labels as string) : [],
    assignee: task?.assignee_id ? {
      id: task.assignee_id,
      name: task.assignee_name,
      email: task.assignee_email,
    } : null,
  });
});

// Move a task (change column and/or order)
tasks.post('/:id/move', async (c) => {
  const orgId = c.get('orgId');
  const taskId = c.req.param('id');
  const { column_id, order } = await c.req.json();
  const now = new Date().toISOString();

  // Verify task belongs to org
  const existing = await c.env.DB.prepare(`
    SELECT t.*, b.org_id FROM tasks t
    JOIN task_boards b ON t.board_id = b.id
    WHERE t.id = ? AND b.org_id = ?
  `).bind(taskId, orgId).first();

  if (!existing) {
    return c.json({ error: 'Task not found' }, 404);
  }

  await c.env.DB.prepare(`
    UPDATE tasks SET column_id = ?, "order" = ?, updated_at = ? WHERE id = ?
  `).bind(column_id, order, now, taskId).run();

  return c.json({ success: true, column_id, order });
});

// Delete a task
tasks.delete('/:id', async (c) => {
  const orgId = c.get('orgId');
  const taskId = c.req.param('id');

  // Delete comments first
  await c.env.DB.prepare(`
    DELETE FROM task_comments WHERE task_id = ?
  `).bind(taskId).run();

  // Delete the task
  const result = await c.env.DB.prepare(`
    DELETE FROM tasks WHERE id = ? AND board_id IN (
      SELECT id FROM task_boards WHERE org_id = ?
    )
  `).bind(taskId, orgId).run();

  if (!result.meta.changes) {
    return c.json({ error: 'Task not found' }, 404);
  }

  return c.json({ success: true });
});

// ============================================
// TASK COMMENTS
// ============================================

// Get comments for a task
tasks.get('/:id/comments', async (c) => {
  const taskId = c.req.param('id');

  const result = await c.env.DB.prepare(`
    SELECT c.*, u.name as user_name, u.email as user_email, u.avatar_url as user_avatar
    FROM task_comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.task_id = ?
    ORDER BY c.created_at ASC
  `).bind(taskId).all();

  const comments = (result.results || []).map((comment: Record<string, unknown>) => ({
    id: comment.id,
    task_id: comment.task_id,
    content: comment.content,
    user: {
      id: comment.user_id,
      name: comment.user_name,
      email: comment.user_email,
      avatar_url: comment.user_avatar,
    },
    created_at: comment.created_at,
    updated_at: comment.updated_at,
  }));

  return c.json(comments);
});

// Add a comment
tasks.post('/:id/comments', async (c) => {
  const userId = c.get('userId');
  const taskId = c.req.param('id');
  const { content } = await c.req.json();

  if (!content) {
    return c.json({ error: 'Content is required' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await c.env.DB.prepare(`
    INSERT INTO task_comments (id, task_id, user_id, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, taskId, userId, content, now, now).run();

  const user = c.get('user');

  return c.json({
    id,
    task_id: taskId,
    content,
    user: {
      id: userId,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
    },
    created_at: now,
    updated_at: now,
  }, 201);
});

export { tasks as taskRoutes };
