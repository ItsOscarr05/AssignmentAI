import React, { createContext, useContext, useState } from 'react';

interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  content: string;
  status: 'pending' | 'submitted' | 'graded';
  submittedAt: string;
  grade?: number;
  feedback?: string;
}

interface SubmissionState {
  submissions: Submission[];
  addSubmission: (submission: Submission) => void;
  updateSubmissionStatus: (id: string, status: Submission['status']) => void;
  updateSubmission: (submission: Submission) => void;
  deleteSubmission: (id: string) => void;
}

const SubmissionContext = createContext<SubmissionState | undefined>(undefined);

export const SubmissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const addSubmission = (submission: Submission) => {
    setSubmissions(prev => [...prev, submission]);
  };

  const updateSubmissionStatus = (id: string, status: Submission['status']) => {
    setSubmissions(prev =>
      prev.map(submission => (submission.id === id ? { ...submission, status } : submission))
    );
  };

  const updateSubmission = (updatedSubmission: Submission) => {
    setSubmissions(prev =>
      prev.map(submission =>
        submission.id === updatedSubmission.id ? updatedSubmission : submission
      )
    );
  };

  const deleteSubmission = (id: string) => {
    setSubmissions(prev => prev.filter(submission => submission.id !== id));
  };

  return (
    <SubmissionContext.Provider
      value={{
        submissions,
        addSubmission,
        updateSubmissionStatus,
        updateSubmission,
        deleteSubmission,
      }}
    >
      {children}
    </SubmissionContext.Provider>
  );
};

export const useSubmissionState = () => {
  const context = useContext(SubmissionContext);
  if (context === undefined) {
    throw new Error('useSubmissionState must be used within a SubmissionProvider');
  }
  return context;
};
