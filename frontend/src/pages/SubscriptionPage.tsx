import { Box, Container, Tab, Tabs, Typography } from '@mui/material';
import React from 'react';
import PlanComparison from '../components/subscription/PlanComparison';
import SubscriptionStatus from '../components/subscription/SubscriptionStatus';
import UsageDashboard from '../components/usage/UsageDashboard';

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
      id={`subscription-tabpanel-${index}`}
      aria-labelledby={`subscription-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `subscription-tab-${index}`,
    'aria-controls': `subscription-tabpanel-${index}`,
  };
}

const SubscriptionPage: React.FC = () => {
  const [value, setValue] = React.useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Subscription Management
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="subscription tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Current Plan" {...a11yProps(0)} />
            <Tab label="Available Plans" {...a11yProps(1)} />
            <Tab label="Usage Dashboard" {...a11yProps(2)} />
          </Tabs>
        </Box>

        <TabPanel value={value} index={0}>
          <SubscriptionStatus />
        </TabPanel>

        <TabPanel value={value} index={1}>
          <PlanComparison />
        </TabPanel>

        <TabPanel value={value} index={2}>
          <UsageDashboard />
        </TabPanel>
      </Box>
    </Container>
  );
};

export default SubscriptionPage;
