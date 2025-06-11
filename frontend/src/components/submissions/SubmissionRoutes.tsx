import React, { useEffect, useState } from 'react';
import { Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Assignment, Submission } from '../../types';
import { SubmissionDetail } from './SubmissionDetail';
import { SubmissionForm } from './SubmissionForm';
import { SubmissionList } from './SubmissionList';

export const SubmissionRoutes: React.FC = () => {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const response = await api.get(`/assignments/${id}`);
        setAssignment(response.data);
      } catch (error) {
        console.error('Error fetching assignment:', error);
        setError('Failed to fetch assignment');
      }
    };

    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/assignments/${id}/submissions`);
        setSubmissions(response.data);
      } catch (error) {
        console.error('Error fetching submissions:', error);
        setError('Failed to fetch submissions');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAssignment();
      fetchSubmissions();
    }
  }, [id]);

  const handleView = (submission: Submission) => {
    navigate(`/submissions/${submission.id}`);
  };

  const handleEdit = (submission: Submission) => {
    navigate(`/submissions/${submission.id}/edit`);
  };

  const handleDelete = async (submission: Submission) => {
    try {
      await api.delete(`/submissions/${submission.id}`);
      setSubmissions(submissions.filter(s => s.id !== submission.id));
    } catch (error) {
      console.error('Error deleting submission:', error);
      setError('Failed to delete submission');
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <SubmissionList
            submissions={submissions}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            loading={loading}
            error={error}
          />
        }
      />
      <Route path="/new" element={<SubmissionForm assignment={assignment!} />} />
      <Route path="/:id" element={<SubmissionDetail />} />
      <Route path="/:id/edit" element={<SubmissionForm assignment={assignment!} />} />
    </Routes>
  );
};
