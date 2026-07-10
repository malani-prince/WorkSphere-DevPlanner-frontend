import apiClient from '../../core/api';
import type { LinkCategory, LinkItem, LinkCreateInput, LinkUpdateInput } from './types';

export const linksApi = {
  // Get all active categories
  getCategories: (): Promise<LinkCategory[]> => {
    return apiClient.get('/link-categories');
  },

  // Create folder category
  createCategory: (name: string): Promise<LinkCategory> => {
    return apiClient.post('/link-categories', { name });
  },

  // Rename category folder
  renameCategory: (id: string, name: string): Promise<LinkCategory> => {
    return apiClient.put(`/link-categories/${id}`, { name });
  },

  // Delete category folder (soft-delete folder + nested links)
  deleteCategory: (id: string): Promise<boolean> => {
    return apiClient.delete(`/link-categories/${id}`);
  },

  // Get links inside a folder category with query options
  getLinks: (
    categoryId: string,
    params?: { search?: string; sort_by?: 'alphabetical' | 'recently_added' | 'recently_updated' }
  ): Promise<LinkItem[]> => {
    return apiClient.get(`/link-categories/${categoryId}/links`, { params });
  },

  // Add link inside category
  addLink: (categoryId: string, data: LinkCreateInput, preventDuplicate: boolean = true): Promise<LinkItem> => {
    return apiClient.post(`/link-categories/${categoryId}/links`, data, {
      params: { prevent_duplicate: preventDuplicate },
    });
  },

  // Edit details of a link card, or move to another folder
  editLink: (id: string, data: LinkUpdateInput): Promise<LinkItem> => {
    return apiClient.put(`/links/${id}`, data);
  },

  // Delete link card
  deleteLink: (id: string): Promise<boolean> => {
    return apiClient.delete(`/links/${id}`);
  },

  // Global search across all categories
  globalSearchLinks: (query: string): Promise<LinkItem[]> => {
    return apiClient.get('/links/search', { params: { q: query } });
  },
};
