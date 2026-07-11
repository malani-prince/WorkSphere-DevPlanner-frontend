import React, { useEffect, useState } from 'react';
import { Plus, X, ListPlus, AlertCircle, Eye, EyeOff } from 'lucide-react';
import type { Task } from '../../tasks/types';
import { tasksApi } from '../../tasks/api';
import { calendarApi } from '../api';
import { TaskCard } from '../../tasks/components/TaskCard';
import { Modal } from '../../../components/ui/Modal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

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

interface DayTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string; // YYYY-MM-DD
  onRefreshCalendar: () => void;
}

export const DayTasksModal: React.FC<DayTasksModalProps> = ({
  isOpen,
  onClose,
  dateStr,
  onRefreshCalendar,
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Task Creation Form State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

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

  const loadTasks = async (silent = false) => {
    if (!dateStr) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await calendarApi.getTasksForDay(dateStr);
      setTasks(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load tasks for selected day');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadTasks();
      setIsAddingTask(false);
      resetForm();
    }
  }, [isOpen, dateStr]);

  const resetForm = () => {
    setTaskTitle('');
    setTaskDesc('');
    setSubtasks([]);
    setNewSubtaskText('');
    setEditingTask(null);
  };

  const handleAddSubtaskInput = () => {
    if (newSubtaskText.trim()) {
      setSubtasks([...subtasks, newSubtaskText.trim()]);
      setNewSubtaskText('');
    }
  };

  const handleRemoveSubtaskInput = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    try {
      const subtaskPayload = subtasks.map(title => ({
        title,
        is_completed: false,
      }));

      await tasksApi.createTask({
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        date: dateStr,
        subtasks: subtaskPayload.length > 0 ? subtaskPayload : undefined,
      });

      setIsAddingTask(false);
      resetForm();
      loadTasks(true);
      onRefreshCalendar();
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !taskTitle.trim()) return;

    try {
      await tasksApi.updateTask(editingTask._id, {
        title: taskTitle.trim(),
        description: taskDesc.trim() || undefined,
        date: editingTask.date,
      });

      setEditingTask(null);
      resetForm();
      loadTasks(true);
      onRefreshCalendar();
    } catch (err: any) {
      showErrorAlert(err.message || 'Failed to update task');
    }
  };

  // Re-usable Task Card Action Handlers
  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      await tasksApi.toggleTaskCompletion(taskId, !currentStatus);
      loadTasks(true);
      onRefreshCalendar();
    } catch (err: any) {
      showErrorAlert(err.message || 'Error updating task completion');
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
          loadTasks(true);
          onRefreshCalendar();
        } catch (err: any) {
          showErrorAlert(err.message || 'Error deleting task');
        }
      }
    });
  };

  const handleTaskCardAddSubtask = async (taskId: string, title: string) => {
    try {
      await tasksApi.addSubtask(taskId, { title });
      loadTasks(true);
      onRefreshCalendar();
    } catch (err: any) {
      showErrorAlert(err.message || 'Error adding subtask');
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string, currentStatus: boolean) => {
    try {
      await tasksApi.toggleSubtaskCompletion(taskId, subtaskId, !currentStatus);
      loadTasks(true);
      onRefreshCalendar();
    } catch (err: any) {
      showErrorAlert(err.message || 'Error updating subtask');
    }
  };

  const handleDeleteSubtask = async (taskId: string, subtaskId: string) => {
    try {
      await tasksApi.deleteSubtask(taskId, subtaskId);
      loadTasks(true);
      onRefreshCalendar();
    } catch (err: any) {
      showErrorAlert(err.message || 'Error deleting subtask');
    }
  };

  const handleEditSubtask = async (taskId: string, subtaskId: string, title: string, isCompleted: boolean) => {
    try {
      await tasksApi.editSubtask(taskId, subtaskId, { title, is_completed: isCompleted });
      loadTasks(true);
      onRefreshCalendar();
    } catch (err: any) {
      showErrorAlert(err.message || 'Error updating subtask');
    }
  };

  const pendingTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);

  // Format date readable
  const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tasks for ${formattedDate}`}
    >
      <div className="space-y-6">
        {/* Toggle Button for Add Task */}
        {!isAddingTask && !editingTask ? (
          <button
            onClick={() => {
              setIsAddingTask(true);
              setEditingTask(null);
              resetForm();
            }}
            className="w-full flex items-center justify-center gap-1.5 py-3 border-2 border-dashed border-slate-200 hover:border-primary-400 text-slate-500 hover:text-primary-600 rounded-xl text-sm font-semibold transition-all hover:bg-primary-50/10 cursor-pointer"
          >
            <Plus size={16} />
            <span>Add New Task for this Day</span>
          </button>
        ) : (
          /* Task Creation & Editing Form */
          <form onSubmit={editingTask ? handleUpdateTask : handleSaveTask} className="bg-slate-50/50 border border-slate-150 p-4 rounded-2xl space-y-4 animate-fade-in">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {editingTask ? 'Edit Task Details' : 'Create Task'}
            </h4>
            
            <div>
              <input
                type="text"
                placeholder="Task Title..."
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
                required
              />
            </div>

            <div>
              <textarea
                placeholder="Description (optional)..."
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              />
            </div>

            {/* Subtasks builder - Only show for Creation, not for Editing */}
            {!editingTask && (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Subtasks list</label>
                
                {subtasks.length > 0 && (
                  <div className="space-y-1.5">
                    {subtasks.map((st, index) => (
                      <div key={index} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-slate-100 text-sm">
                        <span className="text-slate-700">{st}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtaskInput(index)}
                          className="text-slate-400 hover:text-red-500 rounded p-0.5 hover:bg-slate-50"
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
                        handleAddSubtaskInput();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtaskInput}
                    className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <ListPlus size={14} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingTask(false);
                  resetForm();
                }}
                className="px-3 py-1.5 border border-slate-200 text-slate-650 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                {editingTask ? 'Update Task' : 'Save Task'}
              </button>
            </div>
          </form>
        )}

        {/* Existing Tasks List */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <TaskSkeleton />
              <TaskSkeleton />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-slate-450 italic text-center py-8">
              No tasks scheduled for this day yet.
            </p>
          ) : (
            <div className="space-y-5">
              {/* Pending Tasks */}
              {pendingTasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">Active Tasks</h4>
                  <div className="space-y-3">
                    {pendingTasks.map(task => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onToggleComplete={handleToggleTask}
                        onDeleteTask={handleDeleteTask}
                        onEditTask={(t) => {
                          setEditingTask(t);
                          setTaskTitle(t.title);
                          setTaskDesc(t.description || '');
                          setIsAddingTask(false);
                        }}
                        onAddSubtask={handleTaskCardAddSubtask}
                        onToggleSubtask={handleToggleSubtask}
                        onDeleteSubtask={handleDeleteSubtask}
                        onEditSubtask={handleEditSubtask}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Separator line between active & completed tasks */}
              {pendingTasks.length > 0 && completedTasks.length > 0 && showCompleted && (
                <hr className="border-slate-100" />
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pl-1">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Tasks</h4>
                    <button
                      onClick={() => setShowCompleted(!showCompleted)}
                      className="text-xs font-semibold text-primary-605 hover:text-primary-750 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      {showCompleted ? (
                        <>
                          <EyeOff size={12} />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye size={12} />
                          <span>Show ({completedTasks.length})</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {showCompleted && (
                    <div className="space-y-3 opacity-80">
                      {completedTasks.map(task => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          onToggleComplete={handleToggleTask}
                          onDeleteTask={handleDeleteTask}
                          onEditTask={(t) => {
                            setEditingTask(t);
                            setTaskTitle(t.title);
                            setTaskDesc(t.description || '');
                            setIsAddingTask(false);
                          }}
                          onAddSubtask={handleTaskCardAddSubtask}
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
  </>
  );
};
