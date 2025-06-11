import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AssignmentForm } from '../components/assignments/AssignmentForm';
import AssignmentList from '../components/assignments/AssignmentList';
import { useToast } from '../hooks/useToast';
import { api } from '../services/api';
import { Assignment } from '../types/types';

const AssignmentRoutes: React.FC = () => {
  const { showToast } = useToast();

  const handleDelete = async (assignment: Assignment) => {
    try {
      await api.delete(`/assignments/${assignment.id}`);
      showToast('Assignment deleted successfully', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete assignment', 'error');
    }
  };

  return (
    <Routes>
      <Route index element={<AssignmentList onDelete={handleDelete} />} />
      <Route path="new" element={<AssignmentForm onSubmit={async () => {}} />} />
      <Route path=":id/edit" element={<AssignmentForm onSubmit={async () => {}} />} />
      <Route path="*" element={<Navigate to="/assignments" replace />} />
    </Routes>
  );
};

export default AssignmentRoutes;
