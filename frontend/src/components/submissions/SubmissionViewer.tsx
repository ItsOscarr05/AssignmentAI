import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import React from 'react';
import { Assignment } from '../../types';

interface Student {
  id: string;
  name: string;
  email: string;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  content?: string;
}

interface InlineComment {
  line: number;
  comment: string;
}

interface Feedback {
  id: string;
  submissionId: string;
  graderId: string;
  grader: Student;
  grade: number;
  comments: string;
  submittedAt: string;
}

interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  student: Student;
  content: string;
  comments: string;
  attachments: Attachment[];
  submittedAt: string;
  status: string;
  submissionCount: number;
  inlineComments?: InlineComment[];
}

interface ClassStatistics {
  averageGrade: number;
  highestGrade: number;
  lowestGrade: number;
  totalSubmissions: number;
}

interface SubmissionViewerProps {
  assignment: Assignment;
  submission: Submission;
  feedback?: Feedback | null;
  classStatistics?: ClassStatistics;
}

export const SubmissionViewer: React.FC<SubmissionViewerProps> = ({
  assignment,
  submission,
  feedback,
  classStatistics,
}) => {
  const isLate = new Date(submission.submittedAt) > new Date(assignment.dueDate);
  const submissionDate = new Date(submission.submittedAt).toLocaleDateString();
  const feedbackDate = feedback ? new Date(feedback.submittedAt).toLocaleDateString() : null;

  const renderAttachment = (attachment: Attachment) => {
    const isImage = attachment.type.startsWith('image/');
    const fileSize = `${(attachment.size / 1024).toFixed(2)} KB`;

    return (
      <ListItem key={attachment.id}>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Link href={attachment.url} download={attachment.name}>
                {attachment.name}
              </Link>
              <Typography variant="body2" color="textSecondary">
                ({fileSize})
              </Typography>
            </Box>
          }
        />
        {isImage && (
          <Box sx={{ mt: 1 }}>
            <img src={attachment.url} alt={attachment.name} style={{ maxWidth: '200px' }} />
          </Box>
        )}
      </ListItem>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        {/* Submission Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" gutterBottom>
            {assignment.title}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Submitted by: {submission.student.name} ({submission.student.email})
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Submitted: {submissionDate}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Submission #{submission.submissionCount}
          </Typography>
          <Chip
            label={isLate ? 'Submitted Late' : 'Submitted'}
            color={isLate ? 'warning' : 'success'}
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Assignment Requirements */}
        {assignment.requirements && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Requirements
            </Typography>
            <List>
              {assignment.requirements.map((requirement, index) => (
                <ListItem key={index}>
                  <ListItemText primary={requirement} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Submission Content */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Submission Content
          </Typography>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {submission.content}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Comments */}
        {submission.comments && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Comments
            </Typography>
            <Typography variant="body1">{submission.comments}</Typography>
          </Box>
        )}

        {/* Attachments */}
        {submission.attachments.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Attachments
            </Typography>
            <List>{submission.attachments.map(renderAttachment)}</List>
          </Box>
        )}

        {/* Class Statistics */}
        {classStatistics && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Class Statistics
            </Typography>
            <Typography variant="body1">Average Grade: {classStatistics.averageGrade}</Typography>
            <Typography variant="body1">Highest Grade: {classStatistics.highestGrade}</Typography>
            <Typography variant="body1">Lowest Grade: {classStatistics.lowestGrade}</Typography>
            <Typography variant="body1">
              Total Submissions: {classStatistics.totalSubmissions}
            </Typography>
          </Box>
        )}

        {/* Feedback */}
        {feedback && (
          <Box sx={{ mt: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              Feedback
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Grade: {feedback.grade}</Typography>
              <Typography variant="body2" color="textSecondary">
                Graded by: {feedback.grader.name}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Feedback provided: {feedbackDate}
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {feedback.comments}
            </Typography>

            {/* Rubric Scores section removed */}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SubmissionViewer;
