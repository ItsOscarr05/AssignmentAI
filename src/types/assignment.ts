export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  progress: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface AssignmentCreate {
  title: string;
  description: string;
  subject: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export interface AssignmentUpdate {
  title?: string;
  description?: string;
  subject?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  progress?: number;
}

export interface AssignmentSort {
  field: 'title' | 'createdAt' | 'status' | 'priority';
  direction: 'asc' | 'desc';
}

export interface AssignmentFilter {
  status?: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  subject?: string;
  search?: string;
}

export interface Subject {
  id: string;
  name: string;
  userId: string;
}
