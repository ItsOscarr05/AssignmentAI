import { Info as InfoIcon, Lock as LockIcon, Upgrade as UpgradeIcon } from '@mui/icons-material';
import { Alert, AlertTitle, Box, Button, Card, CardContent, Chip, Typography } from '@mui/material';
import React from 'react';
import { FeatureAccessError } from '../../services/WorkshopService';

interface FeatureAccessErrorProps {
  error: FeatureAccessError;
  onUpgrade: () => void;
  onDismiss: () => void;
}

const getFeatureDisplayName = (feature: string): string => {
  const featureNames: Record<string, string> = {
    diagram_generation: 'Diagram Generation',
    image_analysis: 'Image Analysis',
    code_analysis: 'Code Analysis',
    data_analysis: 'Data Analysis',
    advanced_writing_analysis: 'Advanced Writing Analysis',
    style_tone_suggestions: 'Style & Tone Suggestions',
    priority_response_time: 'Priority Response Time',
    extended_templates: 'Extended Templates Library',
    ad_free_experience: 'Ad-Free Experience',
    citation_management: 'Citation Management',
    basic_plagiarism_detection: 'Basic Plagiarism Check',
    advanced_analytics: 'Advanced Analytics Dashboard',
    priority_support: 'Priority Support',
    custom_templates: 'Custom Assignment Templates',
  };

  return featureNames[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getPlanDisplayName = (plan: string): string => {
  const planNames: Record<string, string> = {
    free: 'Free',
    plus: 'Plus',
    pro: 'Pro',
    max: 'Max',
  };

  return planNames[plan] || plan;
};

const getUpgradeButtonText = (currentPlan: string): string => {
  const upgradeTexts: Record<string, string> = {
    free: 'Upgrade to Plus',
    plus: 'Upgrade to Pro',
    pro: 'Upgrade to Max',
    max: 'Contact Support',
  };

  return upgradeTexts[currentPlan] || 'Upgrade Plan';
};

export const FeatureAccessErrorComponent: React.FC<FeatureAccessErrorProps> = ({
  error,
  onUpgrade,
  onDismiss,
}) => {
  const featureName = getFeatureDisplayName(error.feature);
  const planName = getPlanDisplayName(error.current_plan);
  const upgradeText = getUpgradeButtonText(error.current_plan);

  return (
    <Card sx={{ mb: 2, border: '1px solid #ff9800' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <LockIcon color="warning" sx={{ mr: 1 }} />
          <Typography variant="h6" color="warning.main">
            Feature Not Available
          </Typography>
        </Box>

        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Upgrade Required</AlertTitle>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>{featureName}</strong> is not available in your current plan.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error.upgrade_message}
          </Typography>
        </Alert>

        <Box display="flex" alignItems="center" mb={2}>
          <Chip label={`Current Plan: ${planName}`} color="default" size="small" sx={{ mr: 1 }} />
          <Chip label={`Required: ${featureName}`} color="warning" size="small" />
        </Box>

        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            variant="contained"
            color="primary"
            startIcon={<UpgradeIcon />}
            onClick={onUpgrade}
            size="small"
          >
            {upgradeText}
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            startIcon={<InfoIcon />}
            onClick={() => window.open('/dashboard/price-plan', '_blank')}
            size="small"
          >
            View Plans
          </Button>

          <Button variant="text" color="inherit" onClick={onDismiss} size="small">
            Dismiss
          </Button>
        </Box>

        <Box mt={2} p={1} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="caption" color="text.secondary">
            <strong>Tip:</strong> Upgrade your plan to unlock premium features and get more value
            from AssignmentAI.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
