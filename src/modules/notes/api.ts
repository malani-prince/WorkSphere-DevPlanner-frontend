import apiClient from '../../core/api';
import type { 
  NoteCategory, 
  Note, 
  NoteCategoryCreateInput, 
  NoteCreateInput, 
  NoteUpdateInput 
} from './types';

export const notesApi = {
  // 4.1 List Folders (Categories)
  getCategories: (): Promise<NoteCategory[]> => {
    return apiClient.get('/note-categories');
  },

  // 4.2 Create Folder
  createCategory: (data: NoteCategoryCreateInput): Promise<NoteCategory> => {
    return apiClient.post('/note-categories', data);
  },

  // 4.3 Rename Folder
  renameCategory: (folderId: string, data: NoteCategoryCreateInput): Promise<NoteCategory> => {
    return apiClient.put(`/note-categories/${folderId}`, data);
  },

  // 4.4 Delete Folder
  deleteCategory: (folderId: string): Promise<boolean> => {
    return apiClient.delete(`/note-categories/${folderId}`);
  },

  // 4.5 List Notes under Folder
  getNotes: (
    folderId: string,
    params?: { search?: string; sort_by?: 'alphabetical' | 'recently_added' | 'recently_updated' }
  ): Promise<Note[]> => {
    return apiClient.get(`/note-categories/${folderId}/notes`, { params });
  },

  // 4.6 Create Note in Folder
  createNote: (folderId: string, data: NoteCreateInput): Promise<Note> => {
    return apiClient.post(`/note-categories/${folderId}/notes`, data);
  },

  // 4.7 Get Single Note (Markdown Content)
  getNote: (noteId: string): Promise<Note> => {
    return apiClient.get(`/notes/${noteId}`);
  },

  // 4.8 Update Note details
  updateNote: (noteId: string, data: NoteUpdateInput): Promise<Note> => {
    return apiClient.put(`/notes/${noteId}`, data);
  },

  // 4.9 Delete Note
  deleteNote: (noteId: string): Promise<boolean> => {
    return apiClient.delete(`/notes/${noteId}`);
  },

  // 4.10 Global Notes Search
  globalSearchNotes: (query: string): Promise<Note[]> => {
    return apiClient.get('/notes/search', { params: { q: query } });
  },
};
