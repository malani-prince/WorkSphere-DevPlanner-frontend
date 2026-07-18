import apiClient from '../../core/api';
import type { Task, DashboardStats, TaskCreateInput, TaskUpdateInput } from './types';

export const tasksApi = {
  // Get tasks for a specific date with filters
  getTasks: (params: {
    date?: string;
    search?: string;
    status?: 'completed' | 'pending';
    sort_by?: 'alphabetical' | 'recently_added' | 'recently_updated';
  }): Promise<Task[]> => {
    return apiClient.get('/tasks', { params });
  },

  // Create a new task
  createTask: (data: TaskCreateInput): Promise<Task> => {
    return apiClient.post('/tasks', data);
  },

  // Update a task details
  updateTask: (taskId: string, data: TaskUpdateInput): Promise<Task> => {
    return apiClient.put(`/tasks/${taskId}`, data);
  },

  // Soft delete a task
  deleteTask: (taskId: string): Promise<boolean> => {
    return apiClient.delete(`/tasks/${taskId}`);
  },

  // Toggle task completion
  toggleTaskCompletion: (taskId: string, isCompleted?: boolean): Promise<Task> => {
    const params = isCompleted !== undefined ? { is_completed: isCompleted } : {};
    return apiClient.patch(`/tasks/${taskId}/complete`, null, { params });
  },

  // Global search tasks
  globalSearchTasks: (query: string): Promise<Task[]> => {
    return apiClient.get('/tasks/search', { params: { q: query } });
  },

  // Add subtask to a task
  addSubtask: (taskId: string, data: { title: string; is_completed?: boolean }): Promise<Task> => {
    return apiClient.post(`/tasks/${taskId}/subtasks`, data);
  },

  // Edit subtask details
  editSubtask: (
    taskId: string,
    subtaskId: string,
    data: { title: string; is_completed: boolean }
  ): Promise<Task> => {
    return apiClient.put(`/tasks/${taskId}/subtasks/${subtaskId}`, data);
  },

  // Delete subtask
  deleteSubtask: (taskId: string, subtaskId: string): Promise<Task> => {
    return apiClient.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
  },

  // Toggle subtask completion
  toggleSubtaskCompletion: (
    taskId: string,
    subtaskId: string,
    isCompleted?: boolean
  ): Promise<Task> => {
    const params = isCompleted !== undefined ? { is_completed: isCompleted } : {};
    return apiClient.patch(`/tasks/${taskId}/subtasks/${subtaskId}/complete`, null, { params });
  },

  // Get dashboard statistics
  getDashboardStats: (date?: string): Promise<DashboardStats> => {
    return apiClient.get('/dashboard/stats', { params: { date } });
  },

  // Get tasks completed on a specific date
  getTasksCompletedOnDate: (date: string): Promise<Task[]> => {
    return apiClient.get(`/tasks/completed-on/${date}`);
  },
};
