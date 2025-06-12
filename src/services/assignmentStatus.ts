export type AssignmentStatus = 'pending' | 'in_progress' | 'completed';

export const getStatusColor = (status: AssignmentStatus): string => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'warning';
    case 'pending':
      return 'default';
    default:
      return 'default';
  }
};

export const getStatusLabel = (status: AssignmentStatus): string => {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'pending':
      return 'Pending';
    default:
      return 'Unknown';
  }
};

export const calculateStatus = (progress: number): AssignmentStatus => {
  if (progress === 100) {
    return 'completed';
  }

  if (progress > 0) {
    return 'in_progress';
  }

  return 'pending';
};
