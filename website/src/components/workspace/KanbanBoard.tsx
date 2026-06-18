import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useReducer,
  useMemo,
  Fragment,
} from 'react';
import { useSocketContext } from '../../context/SocketContext';
import { useSocket } from '../../hooks/useSocket';
import {
  Plus,
  AlertCircle,
  GripVertical,
  Calendar,
  Layout,
  List,
  Users,
  Clock,
  Tag,
  Paperclip,
  CheckSquare,
  MessageSquare,
  RefreshCw,
  Timer,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
}

interface Task {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  status: 'Ideas' | 'Planning' | 'In_Progress' | 'Review' | 'Done';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo?: { _id?: string; name?: string };
  dueDate?: string;
  startDate?: string;
  createdAt?: string;
  checklist?: { text: string; completed: boolean }[];
  attachments?: number;
  comments?: number;
  dependencies?: string[]; // IDs of tasks this task depends on
  timeSpent?: number; // in minutes
  isRecurring?: boolean;
}

interface Column {
  id: Task['status'];
  title: string;
  border: string;
  headerBg: string;
}

interface KanbanState {
  tasks: Task[];
  snapshot: Task[] | null;
  error: string | null;
}

type KanbanAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | {
      type: 'OPTIMISTIC_MOVE';
      payload: { taskId: string; status: Task['status'] };
    }
  | { type: 'CONFIRM' }
  | { type: 'ROLLBACK'; payload?: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'ADD_TASK'; payload: Task }
  | {
      type: 'UPDATE_TASK';
      payload: Partial<Task> & { _id?: string; id?: string };
    }
  | { type: 'REMOVE_TASK'; payload: string };

const COLUMNS: Column[] = [
  {
    id: 'Ideas',
    title: 'Ideas',
    border: 'border-pink-500/30',
    headerBg: 'bg-pink-500',
  },
  {
    id: 'Planning',
    title: 'Planning',
    border: 'border-purple-500/30',
    headerBg: 'bg-purple-500',
  },
  {
    id: 'In_Progress',
    title: 'In Progress',
    border: 'border-indigo-500/30',
    headerBg: 'bg-indigo-500',
  },
  {
    id: 'Review',
    title: 'Review',
    border: 'border-orange-500/30',
    headerBg: 'bg-orange-500',
  },
  {
    id: 'Done',
    title: 'Done',
    border: 'border-emerald-500/30',
    headerBg: 'bg-emerald-500',
  },
];

const TEMPLATES = {
  hackathon: [
    { title: 'Define Problem Statements', status: 'Planning', priority: 'High' },
    { title: 'Secure Venue Sponsor', status: 'In_Progress', priority: 'Critical' },
    {
      title: 'Open Registration',
      status: 'Planning',
      priority: 'Medium',
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    },
    { title: 'Finalize Judges', status: 'Ideas', priority: 'Low' },
  ],
  workshop: [
    {
      title: 'Prepare Slide Deck',
      status: 'Planning',
      priority: 'High',
      checklist: [{ text: 'Intro slides', completed: false }],
    },
    { title: 'Setup GitHub Repo', status: 'In_Progress', priority: 'Medium' },
    { title: 'Promotional Poster', status: 'Done', priority: 'Low' },
  ],
  social: [
    { title: 'Choose Theme', status: 'Ideas', priority: 'Medium' },
    { title: 'Book Catering', status: 'Planning', priority: 'High' },
    { title: 'Create Playlist', status: 'In_Progress', priority: 'Low' },
  ],
  conference: [
    { title: 'Speaker Outreach', status: 'Planning', priority: 'Critical' },
    { title: 'Sponsorship Prospectus', status: 'Planning', priority: 'High' },
    { title: 'Badge Printing', status: 'Ideas', priority: 'Medium' },
  ],
};

function isSameTask(a: Task, id: string): boolean {
  return a._id === id || a.id === id;
}

function findTask(tasks: Task[], id: string): Task | undefined {
  return tasks.find((t) => isSameTask(t, id));
}

function kanbanReducer(state: KanbanState, action: KanbanAction): KanbanState {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload, snapshot: null, error: null };

    case 'OPTIMISTIC_MOVE': {
      const { taskId, status } = action.payload;
      const next = state.tasks.map((t) => (isSameTask(t, taskId) ? { ...t, status } : t));
      return { ...state, tasks: next, snapshot: state.tasks, error: null };
    }

    case 'CONFIRM':
      return { ...state, snapshot: null };

    case 'ROLLBACK':
      return {
        ...state,
        tasks: state.snapshot ?? state.tasks,
        snapshot: null,
        error: action.payload ?? 'Update failed. Changes reverted.',
      };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };

    case 'UPDATE_TASK': {
      const patch = action.payload;
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          isSameTask(t, patch._id ?? '') || isSameTask(t, patch.id ?? '') ? { ...t, ...patch } : t
        ),
      };
    }

    case 'REMOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((t) => !isSameTask(t, action.payload)),
      };

    default:
      return state;
  }
}

export default function KanbanBoard({
  roomId,
  user,
  onBack,
}: {
  roomId: string;
  user: User;
  onBack?: () => void;
}) {
  const { socket, isConnected } = useSocketContext();
  const [state, dispatch] = useReducer(kanbanReducer, {
    tasks: [],
    snapshot: null,
    error: null,
  });

  const [editingColumn, setEditingColumn] = useState<Task['status'] | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<'kanban' | 'timeline'>('kanban');

  const [dropTarget, setDropTarget] = useState<Task['status'] | null>(null);
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tasksByStatus = useMemo(() => {
    const map: Record<Task['status'], Task[]> = {
      In_Progress: [],
      Review: [],
      Done: [],
      Ideas: [],
      Planning: [],
    };
    for (const t of state.tasks) {
      if (map[t.status]) map[t.status].push(t);
    }
    return map;
  }, [state.tasks]);

  useSocket(
    'task_updated',
    (payload: { taskId: string; status: Task['status']; roomId: string }) => {
      if (!payload || payload.roomId !== roomId) return;
      dispatch({
        type: 'UPDATE_TASK',
        payload: { _id: payload.taskId, status: payload.status },
      });
    }
  );

  useSocket('task_created', (payload: Task & { roomId: string }) => {
    if (!payload || payload.roomId !== roomId) return;
    dispatch({ type: 'ADD_TASK', payload });
  });

  useSocket('typing_start', (payload: { socketId: string; user?: { name: string } }) => {
    if (!payload || payload.socketId === socket?.id) return;
    setTypingUsers((prev) => ({
      ...prev,
      [payload.socketId]: payload.user?.name ?? 'Someone',
    }));
  });

  useSocket('typing_stop', (payload: { socketId: string }) => {
    if (!payload) return;
    setTypingUsers((prev) => {
      const next = { ...prev };
      delete next[payload.socketId];
      return next;
    });
  });

  useSocket('presence_update', (payload: { users: User[] }) => {
    if (!payload) return;
    setCollaborators(payload.users.filter((u) => u.id !== user.id));
  });

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('join_room', roomId, (res: { success: boolean; error?: string }) => {
      if (!res?.success) {
        dispatch({
          type: 'ROLLBACK',
          payload: `Failed to join room: ${res?.error ?? 'unknown'}`,
        });
      }
    });

    return () => {
      socket.emit('leave_room', roomId);
    };
  }, [socket, roomId]);

  useEffect(() => {
    if (!state.error) return;
    const t = setTimeout(() => dispatch({ type: 'CLEAR_ERROR' }), 5000);
    return () => clearTimeout(t);
  }, [state.error]);

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (socket && roomId) {
        socket.emit('typing_stop', { roomId });
      }
    };
  }, [socket, roomId]);

  const moveTask = useCallback(
    (taskId: string, newStatus: Task['status']) => {
      const task = findTask(state.tasks, taskId);
      if (!task || task.status === newStatus) return;

      const previousStatus = task.status;
      dispatch({
        type: 'OPTIMISTIC_MOVE',
        payload: { taskId, status: newStatus },
      });

      if (!socket) return;

      const timeout = setTimeout(() => {
        dispatch({
          type: 'ROLLBACK',
          payload: 'Server did not respond. Changes reverted.',
        });
      }, 8000);

      socket.emit(
        'task_update_status',
        {
          roomId,
          taskId,
          status: newStatus,
          previousStatus,
          updatedBy: user?.id ?? user?.name ?? null,
        },
        (response: { success: boolean; error?: string }) => {
          clearTimeout(timeout);
          if (response?.success) {
            dispatch({ type: 'CONFIRM' });
          } else {
            dispatch({
              type: 'ROLLBACK',
              payload: response?.error ?? 'Server rejected update.',
            });
          }
        }
      );
    },
    [state.tasks, socket, roomId, user]
  );

  const emitTyping = useCallback(() => {
    if (!socket || !roomId) return;

    socket.emit('typing_start', { roomId, user });

    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing_stop', { roomId });
    }, 1500);
  }, [socket, roomId, user]);

  const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task._id ?? task.id ?? '');
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, status: Task['status']) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropTarget(status);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, status: Task['status']) => {
      e.preventDefault();
      if (!draggedTask) return;
      const id = draggedTask._id ?? draggedTask.id;
      if (id) moveTask(id, status);
      setDropTarget(null);
    },
    [draggedTask, moveTask]
  );

  const handleAddTask = useCallback(
    (status: Task['status']) => {
      const title = newTaskTitle.trim();
      if (!title) return;

      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newTask: Task = {
        _id: tempId,
        title,
        description: '',
        status,
        priority: 'Medium',
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_TASK', payload: newTask });
      setNewTaskTitle('');
      setEditingColumn(null);

      if (socket) {
        socket.emit(
          'task_create',
          { roomId, task: newTask },
          (response: { success: boolean; task?: Task; error?: string }) => {
            if (response?.success && response.task) {
              dispatch({
                type: 'UPDATE_TASK',
                payload: {
                  _id: tempId,
                  id: response.task._id ?? response.task.id,
                },
              });
            } else {
              dispatch({ type: 'REMOVE_TASK', payload: tempId });
              dispatch({
                type: 'ROLLBACK',
                payload: response?.error ?? 'Failed to create task.',
              });
            }
          }
        );
      }
    },
    [newTaskTitle, socket, roomId]
  );

  const applyTemplate = useCallback(
    (type: keyof typeof TEMPLATES) => {
      const templateTasks = TEMPLATES[type];
      templateTasks.forEach((t, index) => {
        const tempId = `template-${Date.now()}-${index}`;
        const task: Task = {
          _id: tempId,
          title: t.title,
          status: t.status as Task['status'],
          priority: t.priority as Task['priority'],
          createdAt: new Date().toISOString(),
        };
        dispatch({ type: 'ADD_TASK', payload: task });
        if (socket) socket.emit('task_create', { roomId, task });
      });
    },
    [socket, roomId]
  );

  const typingText = useMemo(() => {
    const names = Object.values(typingUsers);
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names[0]} and ${names.length - 1} others are typing...`;
  }, [typingUsers]);

  return (
    <div className="flex flex-col h-full min-h-screen bg-[#0a0a0a] text-white">
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#111] shrink-0">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="text-white/50 hover:text-white transition-colors text-sm"
            >
              &larr; Back
            </button>
          )}
          <h1 className="text-base font-semibold tracking-tight">Kanban Board</h1>
          <span className="text-[11px] text-white/40 bg-white/5 px-2 py-0.5 rounded-full font-mono">
            {roomId}
          </span>
          <span className="text-xs text-white/40">
            {state.tasks.length} task{state.tasks.length !== 1 ? 's' : ''}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              isConnected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
            }`}
          >
            {isConnected ? 'connected' : 'disconnected'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/5 p-1 rounded-lg mr-4">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white/10 text-white' : 'text-white/40'}`}
            >
              <Layout size={16} />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'timeline' ? 'bg-white/10 text-white' : 'text-white/40'}`}
            >
              <Calendar size={16} />
            </button>
          </div>

          <div className="flex -space-x-2 mr-4">
            {collaborators.map((c) => (
              <div
                key={c.id}
                className="w-7 h-7 rounded-full border-2 border-[#111] bg-blue-500 flex items-center justify-center text-[10px] font-bold"
                title={`${c.name} is online`}
              >
                {c.name[0].toUpperCase()}
              </div>
            ))}
          </div>

          <select
            onChange={(e) => applyTemplate(e.target.value as any)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-white/30"
            defaultValue=""
          >
            <option value="" disabled>
              Templates
            </option>
            <option value="hackathon">Hackathon</option>
            <option value="workshop">Workshop</option>
          </select>

          {typingText && (
            <span className="text-xs text-emerald-400/70 animate-pulse flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {typingText}
            </span>
          )}

          {state.error && (
            <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <AlertCircle size={12} />
              {state.error}
            </span>
          )}
        </div>
      </header>

      {viewMode === 'kanban' ? (
        <div className="flex-1 flex gap-4 p-6 overflow-x-auto items-start">
          {COLUMNS.map((col) => {
            const tasks = tasksByStatus[col.id];
            const isOver = dropTarget === col.id;

            return (
              <div
                key={col.id}
                className={`flex flex-col rounded-xl border min-w-[280px] w-[280px] max-h-full transition-all duration-150 ${
                  col.border
                } ${isOver ? 'ring-2 ring-white/20 scale-[1.01]' : ''}`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div
                  className={`flex items-center justify-between px-4 py-3 rounded-t-xl ${col.headerBg}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-white/60" />
                    <h2 className="text-sm font-semibold text-white drop-shadow-sm">{col.title}</h2>
                    <span className="text-xs text-white/80 bg-white/20 px-1.5 py-0.5 rounded-full font-medium">
                      {tasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingColumn(col.id);
                      setNewTaskTitle('');
                    }}
                    className="text-white/70 hover:text-white transition-colors p-0.5"
                    aria-label={`Add task to ${col.title}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="flex flex-col gap-2 p-3 overflow-y-auto max-h-[calc(100vh-220px)]">
                  {tasks.map((task) => {
                    const taskId = task._id ?? task.id ?? '';
                    return (
                      <div
                        key={taskId}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                        className="group bg-[#1a1a1a] border border-white/5 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-white/20 transition-all duration-150 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5"
                      >
                        <div className="flex items-start gap-2">
                          <GripVertical
                            size={14}
                            className="mt-0.5 shrink-0 text-white/20 group-hover:text-white/40 transition-colors"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white/90 leading-snug break-words">
                              {task.title}
                            </p>
                            {task.description && (
                              <p className="text-xs text-white/40 mt-1.5 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5">
                          <div className="flex items-center gap-2">
                            {task.priority && (
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                  task.priority === 'Critical'
                                    ? 'bg-red-600/30 text-red-200 border border-red-500/50'
                                    : task.priority === 'High'
                                      ? 'bg-red-500/20 text-red-300'
                                      : task.priority === 'Medium'
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : 'bg-slate-500/20 text-slate-300'
                                }`}
                              >
                                {task.priority}
                              </span>
                            )}

                            {task.assignedTo && (
                              <span
                                className="w-5 h-5 rounded-full bg-white/10 border border-[#1a1a1a] flex items-center justify-center text-[9px] font-medium text-white/60 shrink-0"
                                title={task.assignedTo.name ?? 'Assigned'}
                              >
                                {(task.assignedTo.name?.[0] ?? '?').toUpperCase()}
                              </span>
                            )}

                            {task.isRecurring && (
                              <RefreshCw
                                size={12}
                                className="text-emerald-400/60"
                                title="Recurring task"
                              />
                            )}
                            {task.timeSpent && (
                              <div className="flex items-center gap-1 text-[10px] text-white/30">
                                <Timer size={10} />
                                {task.timeSpent}m
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2.5">
                            {(task.checklist?.length ?? 0) > 0 && (
                              <span className="flex items-center gap-1 text-[10px] text-white/30">
                                <CheckSquare size={10} />
                                {task.checklist?.filter((i) => i.completed).length}/
                                {task.checklist?.length}
                              </span>
                            )}
                            <button
                              className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation(); /* trigger upload */
                              }}
                            >
                              <Paperclip size={10} />
                              {task.attachments || 0}
                            </button>
                            {task.dueDate && (
                              <span className="text-[10px] text-white/30">
                                {new Date(task.dueDate).toLocaleDateString([], {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-white/15 text-xs select-none">
                      <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center mb-2">
                        <Plus size={14} />
                      </div>
                      <span>Drop tasks here</span>
                    </div>
                  )}
                </div>

                {editingColumn === col.id && (
                  <div className="p-3 border-t border-white/5">
                    <input
                      autoFocus
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTask(col.id);
                        if (e.key === 'Escape') {
                          setEditingColumn(null);
                          setNewTaskTitle('');
                        }
                        emitTyping();
                      }}
                      placeholder="Task title..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 focus:bg-white/[7%] transition-all"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleAddTask(col.id)}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-xs font-medium text-white rounded-lg py-1.5 transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setEditingColumn(null);
                          setNewTaskTitle('');
                        }}
                        className="text-white/40 hover:text-white/60 text-xs py-1.5 px-3 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 p-6 overflow-y-auto bg-[#0d0d0d]">
          <div className="grid grid-cols-1 gap-4">
            {state.tasks.map((task) => (
              <div
                key={task._id}
                className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 flex items-center gap-6"
              >
                <div className="w-48 font-semibold text-sm truncate">{task.title}</div>
                <div className="flex-1 h-2 bg-white/5 rounded-full relative">
                  <div
                    className="absolute h-full bg-blue-500 rounded-full"
                    style={{
                      left: task.startDate ? '5%' : '10%',
                      width: task.dueDate ? '60%' : '40%',
                    }}
                  ></div>
                </div>
                <div className="flex gap-3">
                  {task.dependencies && task.dependencies.length > 0 && (
                    <span
                      className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20"
                      title="Has dependencies"
                    >
                      Linked
                    </span>
                  )}
                </div>
                <div className="text-xs text-white/40">
                  <Clock size={12} className="inline mr-1" /> {task.dueDate || 'No Deadline'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
