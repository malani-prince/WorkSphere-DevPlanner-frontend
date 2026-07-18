import React, { useState } from 'react';
import { 
  CheckCircle, 
  Circle, 
  Trash2, 
  Edit3, 
  Plus, 
  ChevronDown,
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
  const [isOpen, setIsOpen] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(s => s.is_completed).length || 0;
  const percentComplete = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  let isLate = false;
  const completionDateRaw = task.completed_at || (task.is_completed ? task.updated_at : null);
  if (task.is_completed && completionDateRaw) {
    const d = new Date(completionDateRaw);
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (str > task.date) isLate = true;
  }

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
    <div className={`rounded-2xl bg-white border transition-all duration-200 shadow-sm hover:shadow-md animate-task-card overflow-hidden ${
      task.is_completed ? 'border-emerald-100' : 'border-slate-150'
    } ${isOpen ? 'shadow-md' : ''}`}>

      {/* Card Header */}
      <div
        className={`flex items-start gap-3 px-4 py-3.5 transition-colors duration-150 ${
          totalSubtasks > 0 ? 'cursor-pointer select-none' : ''
        } ${
          isOpen ? 'bg-slate-50/70' : 'bg-white hover:bg-slate-50/50'
        }`}
        onClick={() => totalSubtasks > 0 && setIsOpen(!isOpen)}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleComplete(task._id, task.is_completed); }}
          className="shrink-0 mt-0.5 text-slate-400 hover:text-primary-500 transition-colors duration-150 checkbox-pulse"
        >
          {task.is_completed ? (
            <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-50" />
          ) : (
            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
          )}
        </button>

        {/* Title + Description + badges */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${
              task.is_completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-800'
            }`}>
              {task.title}
            </span>

            {task.origin_task_id && (
              <span
                title="Migrated from a previous day"
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100 shrink-0"
              >
                <GitBranch size={9} />
                <span>Migrated</span>
              </span>
            )}

            {task.is_completed && completionDateRaw && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium select-none shrink-0 ${
                isLate
                  ? 'text-amber-700 bg-amber-50 border border-amber-200'
                  : 'text-emerald-700 bg-emerald-50 border border-emerald-200'
              }`}>
                <span className="font-semibold">{isLate ? 'Late:' : 'Done:'}</span>
                <span>{new Date(completionDateRaw).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </span>
            )}
          </div>

          {/* Description always visible */}
          {task.description && (
            <p className={`mt-1 text-sm leading-relaxed ${
              task.is_completed ? 'text-slate-400 line-through decoration-slate-200' : 'text-slate-500'
            }`}>
              {task.description}
            </p>
          )}

          {/* Date + subtask count */}
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar size={10} />
              {task.date}
            </span>
            {totalSubtasks > 0 && (
              <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${
                percentComplete === 100 ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {completedSubtasks}/{totalSubtasks} subtasks
              </span>
            )}
          </div>
        </div>

        {/* Right side: mini progress bar + chevron (only when subtasks exist) */}
        {totalSubtasks > 0 && (
          <div className="flex flex-col items-end gap-1 shrink-0 w-[30%] max-w-[250px]">
            <div className="hidden sm:flex flex-col items-end gap-0.5 w-full">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400">{percentComplete}%</span>
            </div>
            <ChevronDown
              size={15}
              className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        )}

        {/* No subtasks: just show Edit/Delete inline */}
        {totalSubtasks === 0 && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Edit"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteTask(task._id); }}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Accordion Body — only renders when subtasks exist */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-5 pb-4 pt-3 border-t border-slate-100 bg-slate-50/30">

          {totalSubtasks > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Subtasks</span>
                <span className="text-[11px] text-slate-400">{completedSubtasks} of {totalSubtasks} done</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="bg-primary-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
            </div>
          )}

          {task.subtasks && task.subtasks.length > 0 && (
            <div className="space-y-0.5 mb-3">
              {task.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center justify-between group py-1.5 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleSubtask(task._id, subtask.id, subtask.is_completed)}
                      className="text-slate-400 hover:text-primary-500 transition-colors checkbox-pulse shrink-0"
                    >
                      {subtask.is_completed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500 fill-emerald-50" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </button>

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
                          <button onClick={() => saveSubtaskEdit(subtask)} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-colors cursor-pointer">
                            <Check size={11} /><span>Save</span>
                          </button>
                          <button onClick={() => setEditingSubtaskId(null)} className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold transition-colors cursor-pointer">
                            <X size={11} /><span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span
                        onDoubleClick={() => startEditSubtask(subtask)}
                        className={`text-sm cursor-text select-none break-words flex-1 ${
                          subtask.is_completed ? 'text-slate-400 line-through decoration-slate-200' : 'text-slate-700 hover:text-slate-900'
                        }`}
                        title="Double click to edit"
                      >
                        {subtask.title}
                      </span>
                    )}
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
                    <button onClick={() => startEditSubtask(subtask)} className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100" title="Rename">
                      <Edit3 size={12} />
                    </button>
                    <button onClick={() => onDeleteSubtask(task._id, subtask.id)} className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-red-50" title="Delete">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isAddingSubtask ? (
            <form onSubmit={handleSubtaskSubmit} className="flex flex-col gap-2 w-[70%] mt-2">
              <input
                type="text"
                placeholder="Enter subtask title..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                className="text-sm px-3 py-1.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white w-full"
                autoFocus
              />
              <div className="flex items-center gap-2 select-none">
                <button type="submit" className="flex items-center gap-1 px-2.5 py-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-colors cursor-pointer">
                  <Check size={11} /><span>Add</span>
                </button>
                <button type="button" onClick={() => { setIsAddingSubtask(false); setNewSubtaskTitle(''); }} className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg text-[11px] font-bold transition-colors cursor-pointer">
                  <X size={11} /><span>Cancel</span>
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingSubtask(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 py-1 hover:underline"
            >
              <Plus size={13} />
              <span>Add Subtask</span>
            </button>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onEditTask(task)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 text-xs font-semibold transition-colors"
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>
            <button
              onClick={() => onDeleteTask(task._id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 text-xs font-semibold transition-colors"
            >
              <Trash2 size={13} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
