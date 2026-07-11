import apiClient from '../../core/api';
import type { Task } from '../tasks/types';

export type DayStatus = 'none' | 'completed' | 'pending' | 'mixed';

export interface MonthOverviewResponse {
  [date: string]: DayStatus;
}

export const calendarApi = {
  // Get monthly highlights for a specific year and month
  getMonthOverview: (year: number, month: number): Promise<MonthOverviewResponse> => {
    return apiClient.get(`/calendar/${year}/${month}`);
  },

  // Get tasks for a specific calendar day
  getTasksForDay: (date: string): Promise<Task[]> => {
    return apiClient.get(`/calendar/day/${date}/strict`);
  },
};
