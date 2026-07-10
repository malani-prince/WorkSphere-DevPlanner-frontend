export interface LinkCategory {
  _id: string;
  name: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  status: string;
  version: number;
}

export interface LinkItem {
  _id: string;
  category_id: string;
  title: string;
  subtitle: string;
  url: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  status: string;
  version: number;
}

export interface LinkCreateInput {
  title: string;
  subtitle: string;
  url: string;
  notes?: string;
}

export interface LinkUpdateInput {
  title?: string;
  subtitle?: string;
  url?: string;
  notes?: string;
  category_id?: string; // for moving folder
}
