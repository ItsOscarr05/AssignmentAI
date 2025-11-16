import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SchoolIcon from '@mui/icons-material/School';
import ApartmentIcon from '@mui/icons-material/Apartment';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

interface UserStatistics {
  totalAssignments: number;
  averageGrade: number;
  submissionRate: number;
  feedbackReceived: number;
}

interface UserActivity {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}

interface UserProfileResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  bio?: string;
  institution?: string;
  department?: string;
  createdAt?: string;
  lastLogin?: string;
  statistics?: UserStatistics;
  recentActivity?: UserActivity[];
}

const MAX_AVATAR_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

const formatPercentage = (value: number | undefined) =>
  typeof value === 'number' ? `${value}%` : '0%';

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const userId = id ?? '1';

  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    institution: '',
    department: '',
  });

  const resetFormState = useCallback((data: UserProfileResponse) => {
    setFormState({
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
      email: data.email ?? '',
      bio: data.bio ?? '',
      institution: data.institution ?? '',
      department: data.department ?? '',
    });
    setAvatarPreview(data.avatar ?? null);
    setAvatarFile(null);
    setAlertMessage(null);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error('Profile not found');
        }
        const data: UserProfileResponse = await response.json();
        if (active) {
          setProfile(data);
          resetFormState(data);
        }
      } catch (err) {
        if (active) {
          setError('Profile not found');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchProfile();
    return () => {
      active = false;
    };
  }, [resetFormState, userId]);

  const handleEditToggle = () => {
    if (!profile) {
      return;
    }
    if (!isEditing) {
      resetFormState(profile);
    }
    setStatusMessage(null);
    setAlertMessage(null);
    setIsEditing(prev => !prev);
  };

  const handleInputChange = (field: keyof typeof formState) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { value } = event.target;
    setFormState(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setAlertMessage('Invalid file type');
      setAvatarFile(null);
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setAlertMessage('File size exceeds limit');
      setAvatarFile(null);
      return;
    }

    setAlertMessage(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveChanges = async () => {
    if (!profile) {
      return;
    }
    setSaving(true);
    setStatusMessage(null);
    setAlertMessage(null);

    try {
      const formData = new FormData();
      formData.append('firstName', formState.firstName);
      formData.append('lastName', formState.lastName);
      formData.append('email', formState.email);
      formData.append('bio', formState.bio);
      formData.append('institution', formState.institution);
      formData.append('department', formState.department);

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile: UserProfileResponse = await response.json();
      setProfile(updatedProfile);
      resetFormState(updatedProfile);
      setStatusMessage('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setStatusMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const statistics = useMemo(() => profile?.statistics ?? null, [profile]);
  const activities = profile?.recentActivity ?? [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error ?? 'Profile not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {(saving || loading) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <CircularProgress />
        </Box>
      )}

      {statusMessage && (
        <Box sx={{ mb: 2 }}>
          <Alert severity={statusMessage.includes('successfully') ? 'success' : 'error'}>
            {statusMessage}
          </Alert>
        </Box>
      )}

      {alertMessage && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="error" data-testid="alert">
            {alertMessage}
          </Alert>
        </Box>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3} display="flex" justifyContent="center">
            <Avatar
              src={avatarPreview ?? profile.avatar}
              alt={`${profile.firstName} ${profile.lastName}`}
              sx={{ width: 120, height: 120 }}
            />
          </Grid>
          <Grid item xs={12} sm={9}>
            <Typography variant="h5" gutterBottom>
              {profile.firstName} {profile.lastName}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {profile.email}
            </Typography>
            {profile.bio && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {profile.bio}
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleEditToggle}
                disabled={saving}
                sx={{ mr: 1 }}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {isEditing && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Edit Profile
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={formState.firstName}
                onChange={handleInputChange('firstName')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={formState.lastName}
                onChange={handleInputChange('lastName')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={formState.email}
                onChange={handleInputChange('email')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                multiline
                rows={3}
                value={formState.bio}
                onChange={handleInputChange('bio')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Institution"
                value={formState.institution}
                onChange={handleInputChange('institution')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Department"
                value={formState.department}
                onChange={handleInputChange('department')}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                sx={{ mr: 2 }}
              >
                Upload Avatar
                <input
                  type="file"
                  hidden
                  accept="image/png, image/jpeg"
                  onChange={handleFileChange}
                  aria-label="Upload File"
                />
              </Button>
              {avatarFile && <Chip label={avatarFile.name} color="primary" size="small" />}
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={handleSaveChanges}
                disabled={saving}
              >
                Save Changes
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Profile Details
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <SchoolIcon />
                </ListItemIcon>
                <ListItemText primary={profile.institution ?? 'Not specified'} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <ApartmentIcon />
                </ListItemIcon>
                <ListItemText primary={profile.department ?? 'Not specified'} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText primary={`Role: ${profile.role}`} />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
                  <Typography variant="subtitle2">Assignments</Typography>
                  <Typography variant="h6">
                    {statistics?.totalAssignments ?? 0}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
                  <Typography variant="subtitle2">Average Grade</Typography>
                  <Typography variant="h6">
                    {formatPercentage(statistics?.averageGrade)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
                  <Typography variant="subtitle2">Submission Rate</Typography>
                  <Typography variant="h6">
                    {formatPercentage(statistics?.submissionRate)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }} variant="outlined">
                  <Typography variant="subtitle2">Feedback</Typography>
                  <Typography variant="h6">
                    {statistics?.feedbackReceived ?? 0}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recent Activity
        </Typography>
        {activities.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No recent activity.
          </Typography>
        ) : (
          <List>
            {activities.map(activity => (
              <ListItem key={activity.id}>
                <ListItemIcon>
                  <AssignmentIcon />
                </ListItemIcon>
                <ListItemText
                  primary={activity.title}
                  secondary={activity.description}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default UserProfile;

