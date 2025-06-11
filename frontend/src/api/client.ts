import { Rubric } from '../types';

export const createRubric = async (data: Partial<Rubric>): Promise<Rubric> => {
  const response = await fetch('/api/rubrics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create rubric');
  }

  return response.json();
};

export const updateRubric = async (id: string, data: Partial<Rubric>): Promise<Rubric> => {
  const response = await fetch(`/api/rubrics/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update rubric');
  }

  return response.json();
};
