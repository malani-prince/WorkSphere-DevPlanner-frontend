import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Briefcase, 
  CheckSquare as CheckIcon, 
  Clock, 
  AlertCircle,
  ChevronDown,
  Eye,
  EyeOff,
  X
} from 'lucide-react';
import { tasksApi } from '../api';
import type { Task, DashboardStats } from '../types';
import { TaskCard } from '../components/TaskCard';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { Modal } from '../../../components/ui/Modal';

const TaskSkeleton: React.FC = () => (
  <div className="p-5 rounded-2xl bg-white border border-slate-150 shadow-sm space-y-3">
    <div className="flex items-start gap-4">
      <div className="w-6 h-6 rounded-full shimmer-bg shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2.5">
        <div className="h-4 shimmer-bg rounded w-1/3" />
        <div className="h-3.5 shimmer-bg rounded w-1/2" />
        <div className="h-3 shimmer-bg rounded w-1/4" />
      </div>
    </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksCompletedToday, setTasksCompletedToday] = useState<Task[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'alphabetical' | 'recently_added' | 'recently_updated'>('recently_added');

  // New/Edit Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    date: new Date().toLocaleDateString('en-CA'), // local YYYY-MM-DD
  });

  const [tempSubtasks, setTempSubtasks] = useState<string[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'confirm' | 'alert' | 'error';
    confirmText?: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showErrorAlert = (message: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Action Error',
      message: message,
      type: 'error',
      onConfirm: () => {},
    });
  };

  // Settings Toggles (Matching Portal Controls layout in the reference image)
  const [showCompleted, setShowCompleted] = useState(false);

  // Load stats and tasks
  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      
      const todayStr = new Date().toLocaleDateString('en-CA');
      
      // Fetch stats
      const dashboardStats = await tasksApi.getDashboardStats(todayStr);
      setStats(dashboardStats);

      // Fetch tasks for today with query filters
      const params: any = {
        date: todayStr,
        sort_by: sortBy,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const taskList = await tasksApi.getTasks(params);
      setTasks(taskList);

      // Fetch tasks completed today (regardless of scheduled date)
      const completedTodayList = await tasksApi.getTasksCompletedOnDate(todayStr);
      setTasksCompletedToday(completedTodayList);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load task dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter, sortBy]);

  // Task Handlers
  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      await tasksApi.toggleTaskCompletion(taskId, !currentStatus);
      loadData(true);
    } catch (err: any) {
      showErrorAlert(err.message || 'Error toggling task completion');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Task',
      message: 'Are you sure you want to soft-delete this task?',
      type: 'confirm',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await tasksApi.deleteTask(taskId);
          loadData(true);
        } catch (err: any) {
          showErrorAlert(err.message || 'Error deleting task');
        }
      }
    });
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      date: new Date().toLocaleDateString('en-CA'),
    });
    setTempSubtasks([]);
    setNewSubtaskText('');
    setIsTaskModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setModalMode('edit');
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      date: task.date,
    });
    setTempSubtasks([]);
    setNewSubtaskText('');
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    try {
      if (modalMode === 'create') {
        const subtasks = tempSubtasks.map(title => ({
          title: title.trim(),
          is_completed: false
        }));

        await tasksApi.createTask({
          title: taskForm.title.trim(),
          description: taskForm.description.trim() || undefined,
          date: taskForm.date,
          subtasks: subtasks.length > 0 ? subtasks : undefined
        });
      } else if (modalMode === 'edit' && editingTask) {
        await tasksApi.updateTask(editingTask._id, {
          title: taskForm.title.trim(),
          description: taskForm.description.trim() || undefined,
          date: taskForm.date
        });
      }
      setIsTaskModalOpen(false);
      loadData(true);
    } catch (err: any) {
      showErrorAlert(err.message || 'Error saving task');
    }
  };

  const handleAddTempSubtask = () => {
    if (newSubtaskText.trim()) {
      setTempSubtasks([...tempSubtasks, newSubtaskText.trim()]);
      setNewSubtaskText('');
    }
  };

  const handleRemoveTempSubtask = (index: number) => {
    setTempSubtasks(tempSubtasks.filter((_, i) => i !== index));
  };

  // Subtask Handlers
  const handleAddSubtask = async (taskId: string, title: string) => {
    try {
      await tasksApi.addSubtask(taskId, { title });
      loadData(true);
    } catch (err: any) {
      showErrorAlert(err.message || 'Error adding subtask');
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string, currentStatus: boolean) => {
    try {
      await tasksApi.toggleSubtaskCompletion(taskId, subtaskId, !currentStatus);
      loadData(true);
    } catch (err: any) {
      showErrorAlert(err.message || 'Error updating subtask');
    }
  };

  const handleDeleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      await tasksApi.deleteSubtask(taskId, subtaskId);
      loadData(true);
    } catch (err: any) {
      showErrorAlert(err.message || 'Error deleting subtask');
    }
  };

  const handleEditSubtask = async (taskId: string, subtaskId: string, title: string, isCompleted: boolean) => {
    try {
      await tasksApi.editSubtask(taskId, subtaskId, { title, is_completed: isCompleted });
      loadData(true);
    } catch (err: any) {
      showErrorAlert(err.message || 'Error updating subtask text');
    }
  };



  // Divide tasks into pending and completed lists
  const pendingTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);

  // Merge tasks completed today (regardless of scheduled date) and tasks scheduled for today that are completed
  const mergedCompletedTasks = [...completedTasks];
  tasksCompletedToday.forEach(t => {
    if (!mergedCompletedTasks.some(mt => mt._id === t._id)) {
      mergedCompletedTasks.push(t);
    }
  });

  return (
    <div className="space-y-6">


      {/* 2. Stats Boxes (matching the metrics layout of the reference image) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Tasks Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-slate-500 font-medium">Total Tasks</span>
            <h2 className="text-4xl font-extrabold text-slate-850 mt-2">{stats?.total_tasks ?? 0}</h2>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Briefcase size={28} />
          </div>
        </div>

        {/* Completed Tasks Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-slate-500 font-medium">Completed Tasks</span>
            <h2 className="text-4xl font-extrabold text-emerald-600 mt-2">{stats?.completed_tasks ?? 0}</h2>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckIcon size={28} />
          </div>
        </div>

        {/* Subtask Status Box */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between md:col-span-2 lg:col-span-1">
          <div>
            <span className="text-sm font-semibold text-slate-500 font-medium">Subtasks Progress</span>
            <h2 className="text-4xl font-extrabold text-indigo-600 mt-2">
              {stats?.completed_subtasks ?? 0} <span className="text-lg font-medium text-slate-400">/ {stats?.total_subtasks ?? 0}</span>
            </h2>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Clock size={28} />
          </div>
        </div>
      </div>

      {/* 3. Main Tasks Workspace Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Workspace Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800">Task Workspace</h3>
            <span className="bg-primary-50 text-primary-600 text-xs font-semibold px-2 py-0.5 rounded-full">
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] md:max-w-xs">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Search today's tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Filter size={14} />
              </span>
              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white appearance-none cursor-pointer font-medium text-slate-700"
              >
                <option value="all">All Tasks</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                <ChevronDown size={14} />
              </div>
            </div>

            {/* Sorting */}
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <ArrowUpDown size={14} />
              </span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="pl-8 pr-8 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white appearance-none cursor-pointer font-medium text-slate-700"
              >
                <option value="recently_added">Recently Added</option>
                <option value="recently_updated">Recently Updated</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-slate-400">
                <ChevronDown size={14} />
              </div>
            </div>


            {/* Create Task Button */}
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors duration-150 shadow-sm shrink-0"
            >
              <Plus size={16} />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Task List Workspace */}
        <div className="p-6">
          {loading ? (
            <div className="space-y-4">
              <TaskSkeleton />
              <TaskSkeleton />
              <TaskSkeleton />
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-150 rounded-2xl text-red-700 text-sm">
              <AlertCircle size={20} className="shrink-0" />
              <span>{error}</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50/30">
              <p className="text-sm font-semibold text-slate-500 mb-1">No tasks found for today</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Get started by creating your first workspace task or schedule activities in the calendar.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus size={14} />
                <span>Create a Task</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Pending Tasks */}
              {pendingTasks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Active Tasks</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {pendingTasks.map(task => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onToggleComplete={handleToggleTask}
                        onDeleteTask={handleDeleteTask}
                        onEditTask={handleOpenEditModal}
                        onAddSubtask={handleAddSubtask}
                        onToggleSubtask={handleToggleSubtask}
                        onDeleteSubtask={handleDeleteSubtask}
                        onEditSubtask={handleEditSubtask}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Separator line between active & completed tasks */}
              {pendingTasks.length > 0 && mergedCompletedTasks.length > 0 && showCompleted && (
                <hr className="border-slate-100" />
              )}

              {/* Completed Tasks */}
              {mergedCompletedTasks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pl-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Tasks ({mergedCompletedTasks.length})</h4>
                    <button
                      type="button"
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-lg text-[11px] font-semibold transition-all duration-150 cursor-pointer select-none"
                    >
                      {showCompleted ? <EyeOff size={12} /> : <Eye size={12} />}
                      <span>{showCompleted ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  
                  {showCompleted && (
                    <div className="grid grid-cols-1 gap-4 opacity-80 animate-fade-in">
                      {mergedCompletedTasks.map(task => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          onToggleComplete={handleToggleTask}
                          onDeleteTask={handleDeleteTask}
                          onEditTask={handleOpenEditModal}
                          onAddSubtask={handleAddSubtask}
                          onToggleSubtask={handleToggleSubtask}
                          onDeleteSubtask={handleDeleteSubtask}
                          onEditSubtask={handleEditSubtask}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Task Creation & Editing Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        title={modalMode === 'create' ? 'Create New Task' : 'Edit Task Details'}
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Task Title</label>
            <input
              type="text"
              placeholder="e.g. Build API integration hooks"
              value={taskForm.title}
              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Description (Optional)</label>
            <textarea
              placeholder="Provide a short description about this development task..."
              value={taskForm.description}
              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Scheduled Date</label>
            <input
              type="date"
              value={taskForm.date}
              onChange={(e) => setTaskForm({ ...taskForm, date: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              required
            />
          </div>

          {modalMode === 'create' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Subtasks list</label>
              
              {tempSubtasks.length > 0 && (
                <div className="space-y-1.5">
                  {tempSubtasks.map((st, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-150 text-sm">
                      <span className="text-slate-700 font-medium">{st}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTempSubtask(index)}
                        className="text-slate-400 hover:text-red-500 rounded p-0.5 hover:bg-slate-100 cursor-pointer animate-fade-in"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter subtask title..."
                  value={newSubtaskText}
                  onChange={(e) => setNewSubtaskText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTempSubtask();
                    }
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddTempSubtask}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              {modalMode === 'create' ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
        confirmText={confirmDialog.confirmText}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
