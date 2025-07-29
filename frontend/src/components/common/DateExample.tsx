import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import React from 'react';
import {
  ActivityDate,
  AssignmentDate,
  DateDisplay,
  DateOnly,
  DateRange,
  DateTime,
  RelativeDate,
  SubmissionDate,
} from './DateDisplay';

/**
 * Example component demonstrating the date formatting system
 * This shows how to use the various date display components throughout the app
 */
export const DateExample: React.FC = () => {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Date Formatting Examples
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        These examples show how dates are automatically formatted according to user preferences.
        Change your date format in Settings to see the difference.
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Date Display */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Date Display
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography>
                  <strong>Today:</strong> <DateOnly date={now} />
                </Typography>
                <Typography>
                  <strong>Yesterday:</strong> <DateOnly date={yesterday} />
                </Typography>
                <Typography>
                  <strong>Tomorrow:</strong> <DateOnly date={tomorrow} />
                </Typography>
                <Typography>
                  <strong>With Day Name:</strong> <DateOnly date={now} showDayName />
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Date and Time */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Date and Time
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography>
                  <strong>Current Time:</strong> <DateTime date={now} />
                </Typography>
                <Typography>
                  <strong>Date Only:</strong> <DateTime date={now} includeTime={false} />
                </Typography>
                <Typography>
                  <strong>Submission Time:</strong> <SubmissionDate date={now} />
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Relative Dates */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Relative Dates
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography>
                  <strong>Today:</strong> <RelativeDate date={now} />
                </Typography>
                <Typography>
                  <strong>Yesterday:</strong> <RelativeDate date={yesterday} />
                </Typography>
                <Typography>
                  <strong>Last Week:</strong> <RelativeDate date={lastWeek} />
                </Typography>
                <Typography>
                  <strong>Next Week:</strong> <RelativeDate date={nextWeek} />
                </Typography>
                <Typography>
                  <strong>Activity:</strong> <ActivityDate date={yesterday} />
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Date Ranges */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Date Ranges
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography>
                  <strong>Week Range:</strong> <DateRange date={now} endDate={nextWeek} />
                </Typography>
                <Typography>
                  <strong>Same Day:</strong> <DateRange date={now} endDate={now} />
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Assignment Dates */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Assignment Dates
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography>
                  <strong>Due Today:</strong> <AssignmentDate date={now} isDeadline />
                </Typography>
                <Typography>
                  <strong>Overdue:</strong> <AssignmentDate date={yesterday} isDeadline isOverdue />
                </Typography>
                <Typography>
                  <strong>Future Due:</strong> <AssignmentDate date={nextWeek} isDeadline />
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Custom Formatting */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Custom Formatting
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography>
                  <strong>Custom Display:</strong>
                  <DateDisplay
                    date={now}
                    format="datetime"
                    children={formattedDate => (
                      <span style={{ color: 'blue', fontWeight: 'bold' }}>{formattedDate}</span>
                    )}
                  />
                </Typography>
                <Typography>
                  <strong>With Fallback:</strong>{' '}
                  <DateDisplay date="invalid-date" fallback="No date available" />
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          How to Use in Your Components
        </Typography>
        <Typography
          variant="body2"
          component="pre"
          sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, overflow: 'auto' }}
        >
          {`// Import the components you need
import { DateOnly, DateTime, RelativeDate, AssignmentDate } from '../common/DateDisplay';

// Use in your component
function MyComponent() {
  return (
    <div>
      <DateOnly date={new Date()} />
      <DateTime date={new Date()} />
      <RelativeDate date={new Date()} />
      <AssignmentDate date={new Date()} isDeadline />
    </div>
  );
}`}
        </Typography>
      </Box>
    </Box>
  );
};
