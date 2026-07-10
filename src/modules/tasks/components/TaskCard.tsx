import React, { useState } from 'react';
import { 
  CheckCircle, 
  Circle, 
  Trash2, 
  Edit3, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  GitBranch, 
  Calendar,
  X,
  Check
} from 'lucide-react';
import type { Task, Subtask } from '../types';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (taskId: string, currentStatus: boolean) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string, currentStatus: boolean) => void;
  onDeleteSubtask: (taskId: string, subtaskId: string) => void;
  onEditSubtask: (taskId: string, subtaskId: string, title: string, isCompleted: boolean) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask,
  onEditSubtask,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');

  // Calculate completion percentage
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.is_completed).length || 0;
  const percentComplete = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const handleSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      onAddSubtask(task._id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
    }
  };

  const startEditSubtask = (subtask: Subtask) => {
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskText(subtask.title);
  };

  const saveSubtaskEdit = (subtask: Subtask) => {
    if (editingSubtaskText.trim() && editingSubtaskText.trim() !== subtask.title) {
      onEditSubtask(task._id, subtask.id, editingSubtaskText.trim(), subtask.is_completed);
    }
    setEditingSubtaskId(null);
  };

  return (
    <div className={`p-5 rounded-2xl bg-white border border-slate-150 shadow-sm transition-all duration-200 hover:shadow-md animate-task-card ${
      task.is_completed ? 'border-emerald-100 bg-emerald-50/10' : ''
    }`}>
      {/* Task Header */}
      <div className="flex items-start gap-4">
        {/* Toggle Button */}
        <button 
          onClick={() => onToggleComplete(task._id, task.is_completed)}
          className="mt-1 text-slate-400 hover:text-primary-500 transition-colors duration-150 checkbox-pulse"
        >
          {task.is_completed ? (
            <CheckCircle className="w-6 h-6 text-emerald-500 fill-emerald-50" />
          ) : (
            <Circle className="w-6 h-6 text-slate-350 hover:text-slate-400" />
          )}
        </button>

        {/* Task Title & Description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`text-base font-semibold truncate ${
              task.is_completed ? 'text-slate-400 line-through decoration-slate-300 font-medium' : 'text-slate-800'
            }`}>
              {task.title}
            </h4>
            
            {/* Show Origin Task (Migrated indicator) */}
            {task.origin_task_id && (
              <span
                title="This task was migrated forward from a previous day's backlog"
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100 select-none"
              >
                <GitBranch size={10} />
                <span>Migrated</span>
              </span>
            )}
          </div>
          
          {task.description && (
            <p className={`mt-1 text-sm ${
              task.is_completed ? 'text-slate-400 line-through decoration-slate-200' : 'text-slate-500'
            }`}>
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{task.date}</span>
            </div>
            
            {totalSubtasks > 0 && (
              <div>
                <span>{completedSubtasks}/{totalSubtasks} subtasks ({percentComplete}%)</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions Button Bar */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onEditTask(task)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
            title="Edit Task"
          >
            <Edit3 size={16} />
          </button>
          
          <button 
            onClick={() => onDeleteTask(task._id)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete Task"
          >
            <Trash2 size={16} />
          </button>
          
          {totalSubtasks > 0 && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar for Subtasks */}
      {totalSubtasks > 0 && isExpanded && (
        <div className="mt-4 px-10">
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div 
              className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtasks Section */}
      {isExpanded && (
        <div className="mt-4 pl-10 space-y-2">
          {task.subtasks?.map((subtask) => (
            <div key={subtask.id} className="flex items-center justify-between group py-1.5 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Subtask Checkbox */}
                <button
                  onClick={() => onToggleSubtask(task._id, subtask.id, subtask.is_completed)}
                  className="text-slate-450 hover:text-primary-500 transition-colors checkbox-pulse shrink-0"
                >
                  {subtask.is_completed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300" />
                  )}
                </button>

                {/* Subtask Title */}
                {editingSubtaskId === subtask.id ? (
                  <div className="flex flex-col gap-2 w-[70%] mt-1">
                    <input
                      type="text"
                      value={editingSubtaskText}
                      onChange={(e) => setEditingSubtaskText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveSubtaskEdit(subtask);
                        if (e.key === 'Escape') setEditingSubtaskId(null);
                      }}
                      className="text-sm px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white w-full"
                      autoFocus
                    />
                    <div className="flex items-center gap-2 select-none">
                      <button 
                        onClick={() => saveSubtaskEdit(subtask)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        <Check size={11} />
                        <span>Save</span>
                      </button>
                      <button 
                        onClick={() => setEditingSubtaskId(null)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        <X size={11} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <span 
                    onDoubleClick={() => startEditSubtask(subtask)}
                    className={`text-sm cursor-text truncate select-none ${
                      subtask.is_completed 
                        ? 'text-slate-400 line-through decoration-slate-200' 
                        : 'text-slate-650 hover:text-slate-900'
                    }`}
                    title="Double click to edit"
                  >
                    {subtask.title}
                  </span>
                )}
              </div>

              {/* Subtask Actions */}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                <button
                  onClick={() => startEditSubtask(subtask)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-50"
                  title="Rename Subtask"
                >
                  <Edit3 size={12} />
                </button>
                <button
                  onClick={() => onDeleteSubtask(task._id, subtask.id)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50"
                  title="Delete Subtask"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}

          {/* Add Subtask Input Form */}
          {isAddingSubtask ? (
            <form onSubmit={handleSubtaskSubmit} className="flex items-center gap-2 mt-2">
              <input
                type="text"
                placeholder="Enter subtask title..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white flex-1 max-w-md"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-semibold hover:bg-primary-600 transition-colors shadow-sm"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingSubtask(false);
                  setNewSubtaskTitle('');
                }}
                className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setIsAddingSubtask(true);
                setIsExpanded(true);
              }}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 py-1.5 hover:underline"
            >
              <Plus size={14} />
              <span>Add Subtask</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
