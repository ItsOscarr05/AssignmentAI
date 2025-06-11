export type AssignmentStatus = 'Completed' | 'In Progress' | 'Overdue' | 'Not Started';

interface StatusUpdate {
  status: AssignmentStatus;
  progress: number;
}

export const updateAssignmentStatus = async (
  assignmentId: string,
  status: AssignmentStatus,
  progress: number
): Promise<void> => {
  try {
    const response = await fetch(`/api/assignments/${assignmentId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, progress }),
    });

    if (!response.ok) {
      throw new Error('Failed to update assignment status');
    }
  } catch (error) {
    console.error('Error updating assignment status:', error);
    throw error;
  }
};

export const getAssignmentStatus = async (assignmentId: string): Promise<StatusUpdate> => {
  try {
    const response = await fetch(`/api/assignments/${assignmentId}/status`);
    if (!response.ok) {
      throw new Error('Failed to get assignment status');
    }
    return await response.json();
  } catch (error) {
    console.error('Error getting assignment status:', error);
    throw error;
  }
};

export const calculateStatus = (dueDate: string, progress: number): AssignmentStatus => {
  const now = new Date();
  const due = new Date(dueDate);

  if (progress === 100) {
    return 'Completed';
  }

  if (now > due) {
    return 'Overdue';
  }

  if (progress > 0) {
    return 'In Progress';
  }

  return 'Not Started';
};
