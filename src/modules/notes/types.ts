export interface NoteCategory {
  _id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  status: string;
  version: number;
}

export interface Note {
  _id: string;
  category_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  status: string;
  version: number;
}

export interface NoteCategoryCreateInput {
  name: string;
}

export interface NoteCreateInput {
  title: string;
  content: string;
}

export interface NoteUpdateInput {
  title?: string;
  content?: string;
  category_id?: string;
}
