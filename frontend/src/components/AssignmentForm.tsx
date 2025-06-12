import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useApi } from '../hooks/useApi';
import { useAssignment } from '../hooks/useAssignment';
import Button from './ui/button';
import {
  default as Card,
  default as CardContent,
  default as CardHeader,
  default as CardTitle,
} from './ui/card';
import Input from './ui/input';
import Label from './ui/label';
import {
  default as Select,
  default as SelectContent,
  default as SelectItem,
  default as SelectTrigger,
  default as SelectValue,
} from './ui/select';
import Textarea from './ui/textarea';

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
  const api = useApi();
  const { data: assignment, isLoading } = useAssignment(assignmentId);
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (assignmentId) {
        await api.put(`/assignments/${assignmentId}`, formData);
        toast.success('Assignment updated successfully');
      } else {
        await api.post('/assignments', formData);
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
    <Card>
      <CardHeader>
        <CardTitle>{assignmentId ? 'Edit Assignment' : 'Create Assignment'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Due Date</Label>
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={value => handleSelectChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={value => handleSelectChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
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
      </CardContent>
    </Card>
  );
};

export default AssignmentForm;
