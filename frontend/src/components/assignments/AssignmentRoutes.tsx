import React from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import AssignmentDetail from './AssignmentDetail';
import { AssignmentForm } from './AssignmentForm';
import AssignmentList from './AssignmentList';

const AssignmentRoutes: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (data: any) => {
    try {
      await api.post('/api/assignments', data);
      navigate('/assignments');
    } catch (error) {
      console.error('Failed to create assignment:', error);
    }
  };

  const handleEdit = async (data: any) => {
    try {
      await api.put(`/api/assignments/${data.id}`, data);
      navigate('/assignments');
    } catch (error) {
      console.error('Failed to update assignment:', error);
    }
  };

  return (
    <Routes>
      <Route path="/" element={<AssignmentList />} />
      <Route path="/new" element={<AssignmentForm onSubmit={handleSubmit} />} />
      <Route path="/:id" element={<AssignmentDetail />} />
      <Route path="/:id/edit" element={<AssignmentForm onSubmit={handleEdit} />} />
      <Route path="*" element={<Navigate to="/assignments" replace />} />
    </Routes>
  );
};

export default AssignmentRoutes;
