import {
  Assignment as AssignmentIcon,
  Apartment as DepartmentIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  Feedback as FeedbackIcon,
  Grade as GradeIcon,
  Login as LoginIcon,
  Save as SaveIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserProfile as UserProfileType, UserProfileUpdate } from '../../types/user';
import { FileUpload } from '../common/FileUpload';
import LoadingSpinner from '../common/LoadingSpinner';
import { Toast } from '../common/Toast';

const UserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfileType>>({});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (error) {
      setToast({
        open: true,
        message: 'Failed to load profile',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!profile) return;
    setEditForm({
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio,
      institution: profile.institution,
      department: profile.department,
    });
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const formData = new FormData();

      // Add profile data
      const updateData: UserProfileUpdate = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        bio: editForm.bio,
        institution: editForm.institution,
        department: editForm.department,
      };
      formData.append('profile', JSON.stringify(updateData));

      // Add avatar if changed
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setEditing(false);
      setEditForm({});
      setAvatarFile(null);
      setToast({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success',
      });
    } catch (error) {
      setToast({
        open: true,
        message: 'Failed to update profile',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = (file: File) => {
    setAvatarFile(file);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'submission':
        return <AssignmentIcon />;
      case 'grade':
        return <GradeIcon />;
      case 'feedback':
        return <FeedbackIcon />;
      case 'login':
        return <LoginIcon />;
      default:
        return <AssignmentIcon />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography variant="h6">Profile not found</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Profile</Typography>
        <Button
          variant="contained"
          startIcon={editing ? <SaveIcon /> : <EditIcon />}
          onClick={editing ? handleSave : handleEdit}
          disabled={loading}
        >
          {editing ? 'Save Changes' : 'Edit Profile'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Box position="relative" display="inline-block">
              <Avatar
                src={editing ? URL.createObjectURL(avatarFile || new Blob()) : profile.avatar}
                sx={{ width: 120, height: 120, mb: 2 }}
              />
              {editing && (
                <Box position="absolute" bottom={0} right={0}>
                  <FileUpload
                    onFileSelect={handleAvatarUpload}
                    accept="image/*"
                    maxSize={5 * 1024 * 1024} // 5MB
                    multiple={false}
                  />
                </Box>
              )}
            </Box>
            <Typography variant="h5" gutterBottom>
              {editing ? (
                <TextField
                  fullWidth
                  value={editForm.firstName || ''}
                  onChange={e => setEditForm({ ...editForm, firstName: e.target.value })}
                  placeholder="First Name"
                  size="small"
                  label="First Name"
                  inputProps={{ 'data-testid': 'first-name-input' }}
                />
              ) : (
                `${profile.firstName} ${profile.lastName}`
              )}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              {profile.email}
            </Typography>
            <Chip
              label={profile.role}
              color={
                profile.role === 'admin'
                  ? 'error'
                  : profile.role === 'teacher'
                  ? 'primary'
                  : 'success'
              }
              size="small"
              sx={{ mb: 2 }}
            />
            {editing ? (
              <TextField
                fullWidth
                multiline
                rows={3}
                value={editForm.bio || ''}
                onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Bio"
                size="small"
                sx={{ mb: 2 }}
                label="Bio"
                inputProps={{ 'data-testid': 'bio-input' }}
              />
            ) : (
              profile.bio && (
                <Typography variant="body2" paragraph>
                  {profile.bio}
                </Typography>
              )
            )}
          </Paper>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{profile.statistics.totalAssignments}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Assignments
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{profile.statistics.averageGrade}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Grade
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{profile.statistics.submissionRate}%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Submission Rate
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4">{profile.statistics.feedbackReceived}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Feedback Received
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Additional Information */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Additional Information
            </Typography>
            <List>
              {editing ? (
                <>
                  <ListItem>
                    <ListItemIcon>
                      <SchoolIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <TextField
                          fullWidth
                          value={editForm.institution || ''}
                          onChange={e =>
                            setEditForm({
                              ...editForm,
                              institution: e.target.value,
                            })
                          }
                          placeholder="Institution"
                          size="small"
                          label="Institution"
                          inputProps={{ 'data-testid': 'institution-input' }}
                        />
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <DepartmentIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <TextField
                          fullWidth
                          value={editForm.department || ''}
                          onChange={e =>
                            setEditForm({
                              ...editForm,
                              department: e.target.value,
                            })
                          }
                          placeholder="Department"
                          size="small"
                          label="Department"
                          inputProps={{ 'data-testid': 'department-input' }}
                        />
                      }
                    />
                  </ListItem>
                </>
              ) : (
                <>
                  {profile.institution && (
                    <ListItem>
                      <ListItemIcon>
                        <SchoolIcon />
                      </ListItemIcon>
                      <ListItemText primary={profile.institution} />
                    </ListItem>
                  )}
                  {profile.department && (
                    <ListItem>
                      <ListItemIcon>
                        <DepartmentIcon />
                      </ListItemIcon>
                      <ListItemText primary={profile.department} />
                    </ListItem>
                  )}
                </>
              )}
              <ListItem>
                <ListItemIcon>
                  <DescriptionIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Member Since"
                  secondary={format(new Date(profile.createdAt), 'MMM d, yyyy')}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <LoginIcon />
                </ListItemIcon>
                <ListItemText
                  primary="Last Login"
                  secondary={format(new Date(profile.lastLogin), 'MMM d, yyyy h:mm a')}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <List>
              {profile.recentActivity.map(activity => (
                <ListItem key={activity.id}>
                  <ListItemIcon>{getActivityIcon(activity.type)}</ListItemIcon>
                  <ListItemText
                    primary={activity.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2">
                          {activity.description}
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption" color="text.secondary">
                          {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Box>
  );
};

export default UserProfile;
