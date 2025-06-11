import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Switch,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

const AISettings: React.FC = () => {
  const [settings, setSettings] = useState({
    responseLength: 50,
    creativityLevel: 3,
    languageModel: 'gpt-4',
    autoSave: true,
    showSuggestions: true,
    darkMode: false,
    notifications: true,
  });

  const handleChange = (name: string) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings({ ...settings, [name]: value });
  };

  const handleSliderChange = (name: string) => (_event: any, newValue: number | number[]) => {
    setSettings({ ...settings, [name]: newValue });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom className="page-title">
        AI Settings
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Response Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography gutterBottom>Response Length</Typography>
                <Slider
                  value={settings.responseLength}
                  onChange={handleSliderChange('responseLength')}
                  min={10}
                  max={100}
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography gutterBottom>Creativity Level</Typography>
                <Slider
                  value={settings.creativityLevel}
                  onChange={handleSliderChange('creativityLevel')}
                  min={1}
                  max={5}
                  marks
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Language Model</InputLabel>
                  <Select
                    value={settings.languageModel}
                    onChange={handleChange('languageModel')}
                    label="Language Model"
                  >
                    <MenuItem value="gpt-4">GPT-4</MenuItem>
                    <MenuItem value="gpt-3.5">GPT-3.5</MenuItem>
                    <MenuItem value="claude">Claude</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch checked={settings.autoSave} onChange={handleChange('autoSave')} />
                  }
                  label="Auto-save Responses"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.showSuggestions}
                      onChange={handleChange('showSuggestions')}
                    />
                  }
                  label="Show Suggestions"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch checked={settings.darkMode} onChange={handleChange('darkMode')} />
                  }
                  label="Dark Mode"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications}
                      onChange={handleChange('notifications')}
                    />
                  }
                  label="Enable Notifications"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Advanced Settings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Button variant="contained" color="primary">
                  Reset to Default
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" color="secondary">
                  Export Settings
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AISettings;
