import React, { createContext, useContext, useState } from 'react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'graded';
}

interface AssignmentState {
  assignments: Assignment[];
  addAssignment: (assignment: Assignment) => void;
  updateAssignment: (assignment: Assignment) => void;
  deleteAssignment: (id: string) => void;
}

const AssignmentContext = createContext<AssignmentState | undefined>(undefined);

export const AssignmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const addAssignment = (assignment: Assignment) => {
    setAssignments(prev => [...prev, assignment]);
  };

  const updateAssignment = (updatedAssignment: Assignment) => {
    setAssignments(prev =>
      prev.map(assignment =>
        assignment.id === updatedAssignment.id ? updatedAssignment : assignment
      )
    );
  };

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(assignment => assignment.id !== id));
  };

  return (
    <AssignmentContext.Provider
      value={{
        assignments,
        addAssignment,
        updateAssignment,
        deleteAssignment,
      }}
    >
      {children}
    </AssignmentContext.Provider>
  );
};

export const useAssignmentState = () => {
  const context = useContext(AssignmentContext);
  if (context === undefined) {
    throw new Error('useAssignmentState must be used within an AssignmentProvider');
  }
  return context;
};
