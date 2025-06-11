import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { AssignmentAnalytics } from './AssignmentAnalytics';
import { CustomReports } from './CustomReports';
import { PerformanceMetrics } from './PerformanceMetrics';
import { StudentProgress } from './StudentProgress';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const AnalyticsDashboard: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" gutterBottom>
              Analytics & Reporting
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Access comprehensive analytics and generate custom reports to track student
              performance, assignment statistics, and overall progress.
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label="analytics tabs">
                  <Tab label="Performance Overview" />
                  <Tab label="Assignment Analytics" />
                  <Tab label="Student Progress" />
                  <Tab label="Custom Reports" />
                </Tabs>
              </Box>

              <TabPanel value={currentTab} index={0}>
                <PerformanceMetrics />
              </TabPanel>

              <TabPanel value={currentTab} index={1}>
                <AssignmentAnalytics />
              </TabPanel>

              <TabPanel value={currentTab} index={2}>
                <StudentProgress />
              </TabPanel>

              <TabPanel value={currentTab} index={3}>
                <CustomReports />
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};
