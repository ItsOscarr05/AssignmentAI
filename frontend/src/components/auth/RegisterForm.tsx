import { Alert, Box, Button, TextField } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../services/auth/authStore';

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { register, error: authError } = useAuthStore();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters long';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      await register(
        formData.email,
        formData.password,
        `${formData.firstName} ${formData.lastName}`
      );
      navigate('/dashboard');
    } catch (err) {
      setErrors({
        submit: err instanceof Error ? err.message : 'Registration failed',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <TextField
        margin="normal"
        required
        fullWidth
        id="firstName"
        label="First Name"
        name="firstName"
        autoComplete="given-name"
        autoFocus
        value={formData.firstName}
        onChange={handleChange}
        error={!!errors.firstName}
        helperText={errors.firstName}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="lastName"
        label="Last Name"
        name="lastName"
        autoComplete="family-name"
        value={formData.lastName}
        onChange={handleChange}
        error={!!errors.lastName}
        helperText={errors.lastName}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email"
        name="email"
        autoComplete="email"
        value={formData.email}
        onChange={handleChange}
        error={!!errors.email}
        helperText={errors.email}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="password"
        type="password"
        id="password"
        autoComplete="new-password"
        value={formData.password}
        onChange={handleChange}
        error={!!errors.password}
        helperText={errors.password}
        InputLabelProps={{
          shrink: true,
          required: false,
          style: { textTransform: 'none' },
        }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="confirm password"
        type="password"
        id="confirmPassword"
        autoComplete="new-password"
        value={formData.confirmPassword}
        onChange={handleChange}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword}
        InputLabelProps={{
          shrink: true,
          required: false,
          style: { textTransform: 'none' },
        }}
      />
      {Object.keys(errors).length > 0 && (
        <Alert severity="error" role="alert" sx={{ mt: 2 }} data-testid="form-error">
          {Object.values(errors)[0]}
        </Alert>
      )}
      {errors.submit && (
        <Alert severity="error" role="alert" sx={{ mt: 2 }} data-testid="submit-error">
          {errors.submit}
        </Alert>
      )}
      {authError && (
        <Alert severity="error" role="alert" sx={{ mt: 2 }} data-testid="auth-error">
          {authError}
        </Alert>
      )}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
        data-testid="submit-button"
      >
        {loading ? 'Registering...' : 'Register'}
      </Button>
    </Box>
  );
};

export default RegisterForm;
