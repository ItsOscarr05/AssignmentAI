import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import React, { useState } from 'react';

interface Submission {
  id: number;
  assignmentTitle: string;
  studentName: string;
  status: string;
  grade?: number;
  feedback?: string;
  submittedAt: string;
}

interface SubmissionCardProps {
  submission: Submission;
  onView: (submission: Submission) => void;
  onGrade: (submission: Submission) => void;
  onDelete: (submission: Submission) => void;
  statusComponent?: React.ComponentType<{ status: string }>;
  actionsComponent?: React.ComponentType<{ submission: Submission }>;
  loading?: boolean;
  disabled?: boolean;
}

export const SubmissionCard: React.FC<SubmissionCardProps> = ({
  submission,
  onView,
  onGrade,
  onDelete,
  statusComponent: StatusComponent,
  actionsComponent: ActionsComponent,
  loading = false,
  disabled = false,
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setIsDeleteDialogOpen(false);
    onDelete(submission);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
      case 'submitted':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'graded':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'late':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
    if (grade >= 70) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200';
    return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <CircularProgress />
      </div>
    );
  }

  return (
    <article
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
      aria-label={`Submission: ${submission.assignmentTitle} by ${submission.studentName}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold dark:text-white">{submission.assignmentTitle}</h3>
          <p className="text-gray-600 dark:text-gray-300">{submission.studentName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Submitted on {new Date(submission.submittedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {StatusComponent ? (
            <StatusComponent status={submission.status} />
          ) : (
            <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(submission.status)}`}>
              {submission.status}
            </span>
          )}
          {submission.grade !== undefined && (
            <span className={`px-2 py-1 rounded-full text-sm ${getGradeColor(submission.grade)}`}>
              {submission.grade}%
            </span>
          )}
          {submission.grade === undefined && (
            <span className="px-2 py-1 rounded-full text-sm bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
              Not Graded
            </span>
          )}
        </div>
      </div>

      {submission.feedback ? (
        <p className="text-gray-700 dark:text-gray-300 mb-4">{submission.feedback}</p>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 italic mb-4">No feedback</p>
      )}

      {ActionsComponent ? (
        <ActionsComponent submission={submission} />
      ) : (
        <div className="flex justify-end gap-2">
          <Button
            variant="outlined"
            onClick={() => onView(submission)}
            disabled={disabled}
            aria-label="View submission"
            tabIndex={0}
          >
            View
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => onGrade(submission)}
            disabled={disabled}
            aria-label="Grade submission"
            tabIndex={0}
          >
            Grade
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={disabled}
            aria-label="Open delete confirmation"
            tabIndex={0}
          >
            Delete
          </Button>
        </div>
      )}

      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete this submission?</DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsDeleteDialogOpen(false)}
            tabIndex={0}
            aria-label="Cancel delete"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            autoFocus
            tabIndex={0}
            aria-label="Confirm delete submission"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </article>
  );
};
