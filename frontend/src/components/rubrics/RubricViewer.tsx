import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';

interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  weight: number;
}

interface Rubric {
  id: string;
  assignmentId: string;
  assignment: {
    id: string;
    title: string;
    dueDate: string;
  };
  name: string;
  description: string;
  criteria: RubricCriterion[];
  totalMaxScore: number;
  passingScore: number;
  createdAt: string;
  updatedAt: string;
}

interface RubricScore {
  criterionId: string;
  score: number;
  comments: string;
}

interface Feedback {
  id: string;
  submissionId: string;
  submission: {
    id: string;
    assignmentId: string;
    studentId: string;
    student: {
      id: string;
      name: string;
      email: string;
    };
    content: string;
    submittedAt: string;
    status: string;
  };
  grade: number;
  comments: string;
  rubricScores: RubricScore[];
  submittedAt: string;
  grader: {
    id: string;
    name: string;
    email: string;
  };
}

interface RubricViewerProps {
  rubric: Rubric;
  feedback?: Feedback | null;
  feedbackHistory?: Feedback[];
}

const RubricViewer: React.FC<RubricViewerProps> = ({ rubric, feedback, feedbackHistory = [] }) => {
  const getGradePercentage = (grade: number) => {
    return ((grade / rubric.totalMaxScore) * 100).toFixed(0);
  };

  const getWeightedScore = (score: number, maxScore: number, weight: number) => {
    return ((score / maxScore) * weight * 100).toFixed(1);
  };

  const getStatusIndicator = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Good';
    if (percentage >= 70) return 'Satisfactory';
    if (percentage >= 60) return 'Needs Improvement';
    return 'Unsatisfactory';
  };

  const getStrengths = () => {
    if (!feedback) return [];
    return feedback.rubricScores
      .filter(score => {
        const criterion = rubric.criteria.find(c => c.id === score.criterionId);
        return criterion && score.score / criterion.maxScore >= 0.9;
      })
      .map(score => {
        const criterion = rubric.criteria.find(c => c.id === score.criterionId);
        return criterion?.name || '';
      });
  };

  const getRecommendations = () => {
    if (!feedback) return [];
    return feedback.rubricScores
      .filter(score => {
        const criterion = rubric.criteria.find(c => c.id === score.criterionId);
        return criterion && score.score / criterion.maxScore < 0.7;
      })
      .map(score => {
        const criterion = rubric.criteria.find(c => c.id === score.criterionId);
        return criterion?.name || '';
      });
  };

  const getFeedbackComparison = () => {
    if (feedbackHistory.length < 2) return null;
    const grades = feedbackHistory.map(f => f.grade);
    const average = grades.reduce((a, b) => a + b, 0) / grades.length;
    const highest = Math.max(...grades);
    const lowest = Math.min(...grades);
    return { average, highest, lowest };
  };

  return (
    <Box>
      {/* Rubric Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {rubric.name}
          </Typography>
          <Typography variant="body1" paragraph>
            {rubric.description}
          </Typography>
          <Grid container spacing={2}>
            <Grid item>
              <Typography variant="body2">Total max score: {rubric.totalMaxScore}</Typography>
            </Grid>
            <Grid item>
              <Typography variant="body2">Passing score: {rubric.passingScore}</Typography>
            </Grid>
            <Grid item>
              <Typography variant="body2">
                Created: {new Date(rubric.createdAt).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item>
              <Typography variant="body2">
                Updated: {new Date(rubric.updatedAt).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Feedback Summary */}
      {feedback ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Feedback Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  Grade: {feedback.grade} ({getGradePercentage(feedback.grade)}%)
                </Typography>
                <Typography variant="body1">
                  Status: {feedback.grade >= rubric.passingScore ? 'Passing' : 'Not Passing'}
                </Typography>
                <Typography variant="body1" paragraph>
                  Comments: {feedback.comments}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">Student: {feedback.submission.student.name}</Typography>
                <Typography variant="body1">Email: {feedback.submission.student.email}</Typography>
                <Typography variant="body1">
                  Submitted: {new Date(feedback.submission.submittedAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body1">Graded by: {feedback.grader.name}</Typography>
                <Typography variant="body1">Grader Email: {feedback.grader.email}</Typography>
                <Typography variant="body1">
                  Graded on: {new Date(feedback.submittedAt).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>

            {/* Feedback Comparison */}
            {feedbackHistory.length >= 2 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Feedback Comparison
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body1">
                      Average Grade: {getFeedbackComparison()?.average.toFixed(1)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body1">
                      Highest Grade: {getFeedbackComparison()?.highest}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography variant="body1">
                      Lowest Grade: {getFeedbackComparison()?.lowest}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Strengths and Areas for Improvement */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Strengths
              </Typography>
              <List>
                {getStrengths().map((strength, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={strength} />
                  </ListItem>
                ))}
              </List>

              <Typography variant="h6" gutterBottom>
                Areas for Improvement
              </Typography>
              <List>
                {getRecommendations().map((recommendation, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="body1">No feedback available</Typography>
          </CardContent>
        </Card>
      )}

      {/* Criteria and Scores */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Criterion</TableCell>
              <TableCell align="right">Max Score</TableCell>
              <TableCell align="right">Weight</TableCell>
              {feedback && (
                <>
                  <TableCell align="right">Score</TableCell>
                  <TableCell align="right">Weighted Score</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Comments</TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rubric.criteria.map(criterion => {
              const score = feedback?.rubricScores.find(s => s.criterionId === criterion.id);
              return (
                <TableRow key={criterion.id}>
                  <TableCell>
                    <Typography variant="subtitle2">{criterion.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {criterion.description}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">{criterion.maxScore} points</TableCell>
                  <TableCell align="right">{(criterion.weight * 100).toFixed(0)}%</TableCell>
                  {feedback && (
                    <>
                      <TableCell align="right">
                        {score ? `${score.score}/${criterion.maxScore}` : '-'}
                      </TableCell>
                      <TableCell align="right">
                        {score
                          ? `${getWeightedScore(
                              score.score,
                              criterion.maxScore,
                              criterion.weight
                            )}%`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {score ? getStatusIndicator(score.score, criterion.maxScore) : '-'}
                      </TableCell>
                      <TableCell>{score?.comments || '-'}</TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Feedback History */}
      {feedbackHistory.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Feedback History
            </Typography>
            <List>
              {feedbackHistory.map(history => (
                <React.Fragment key={history.id}>
                  <ListItem>
                    <ListItemText
                      primary={`Grade: ${history.grade} (${getGradePercentage(history.grade)}%)`}
                      secondary={`Submitted: ${new Date(
                        history.submittedAt
                      ).toLocaleDateString()} by ${history.grader.name}`}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RubricViewer;
