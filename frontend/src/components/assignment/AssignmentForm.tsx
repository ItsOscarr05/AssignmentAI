import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAssignment } from '../hooks/useAssignment';
import { ApiClient } from '../services/api/ApiClient';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface AssignmentFormProps {
  assignmentId?: string;
}

interface Assignment {
  id?: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  status: 'draft' | 'published' | 'archived';
  priority: 'high' | 'medium' | 'low';
  progress: number;
}

const AssignmentForm: React.FC<AssignmentFormProps> = ({ assignmentId }) => {
  const navigate = useNavigate();
  const { data: assignment, isLoading } = useAssignment(assignmentId || undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Assignment>>({
    title: '',
    subject: '',
    description: '',
    dueDate: '',
    status: 'draft',
    priority: 'medium',
    progress: 0,
  });

  const apiClient = ApiClient.getInstance();

  useEffect(() => {
    if (assignment) {
      setFormData(assignment);
    }
  }, [assignment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: Partial<Assignment>) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (assignmentId) {
        await apiClient.assignments.update(assignmentId, formData);
        toast.success('Assignment updated successfully');
      } else {
        await apiClient.assignments.create(formData);
        toast.success('Assignment created successfully');
      }
      navigate('/assignments');
    } catch (error) {
      toast.error('Failed to save assignment');
      console.error('Error saving assignment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2>{assignmentId ? 'Edit Assignment' : 'Create Assignment'}</h2>
      </div>
      <div className="card-content">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title">Title</label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="subject">Subject</label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
                rows={4}
              />
            </div>

            <div>
              <label htmlFor="dueDate">Due Date</label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="status">Status</label>
              <select
                value={formData.status}
                onChange={e => handleSelectChange('status', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority">Priority</label>
              <select
                value={formData.priority}
                onChange={e => handleSelectChange('priority', e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" onClick={() => navigate('/assignments')} variant="outline">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentForm;
