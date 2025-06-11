import { useContext } from 'react';
import { SubmissionContext } from '../contexts/SubmissionContext';

export const useSubmissionState = () => {
  const context = useContext(SubmissionContext);
  if (context === undefined) {
    throw new Error('useSubmissionState must be used within a SubmissionProvider');
  }
  return context;
};
