export interface Subtask {
  id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  is_completed: boolean;
  completed_at?: string;
  origin_task_id: string | null;
  subtasks: Subtask[];
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  status: string;
  version: number;
}

export interface DashboardStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  total_subtasks: number;
  completed_subtasks: number;
}

export interface TaskCreateInput {
  title: string;
  description?: string;
  date: string;
  subtasks?: { title: string; is_completed: boolean }[];
}

export interface TaskUpdateInput {
  title: string;
  description?: string;
  date: string;
}
