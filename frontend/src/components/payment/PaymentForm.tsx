import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import React, { useState } from 'react';
import { api } from '../../services/api';

interface PaymentFormProps {
  priceId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

const PaymentForm: React.FC<PaymentFormProps> = ({ priceId, onSuccess, onError }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>(priceId);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    name: '',
  });
  const [errors, setErrors] = useState({
    cardNumber: '',
    expiryDate: '',
    cvc: '',
    name: '',
    plan: '',
  });

  React.useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get<Plan[]>('/plans');
      setPlans(response.data);
    } catch (error) {
      enqueueSnackbar('Failed to fetch available plans', { variant: 'error' });
    }
  };

  const validateForm = () => {
    const newErrors = {
      cardNumber: '',
      expiryDate: '',
      cvc: '',
      name: '',
      plan: '',
    };

    if (!formData.cardNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = 'Invalid card number';
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Invalid expiry date (MM/YY)';
    }

    if (!formData.cvc) {
      newErrors.cvc = 'CVC is required';
    } else if (!/^\d{3,4}$/.test(formData.cvc)) {
      newErrors.cvc = 'Invalid CVC';
    }

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!selectedPlan) {
      newErrors.plan = 'Please select a plan';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await api.post('/subscriptions/create', {
        plan_id: selectedPlan,
        payment_method: {
          card_number: formData.cardNumber.replace(/\s/g, ''),
          expiry_date: formData.expiryDate,
          cvc: formData.cvc,
          name: formData.name,
        },
      });
      onSuccess();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to process payment';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = value
        .replace(/\s/g, '')
        .replace(/(\d{4})/g, '$1 ')
        .trim();
    } else if (name === 'expiryDate') {
      formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d{0,2})/, '$1/$2')
        .substring(0, 5);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Stack spacing={3}>
        <FormControl fullWidth error={!!errors.plan}>
          <InputLabel>Select Plan</InputLabel>
          <Select
            value={selectedPlan}
            label="Select Plan"
            onChange={e => setSelectedPlan(e.target.value)}
          >
            {plans.map(plan => (
              <MenuItem key={plan.id} value={plan.id}>
                {plan.name} - ${plan.price}/{plan.interval}
              </MenuItem>
            ))}
          </Select>
          {errors.plan && <FormHelperText>{errors.plan}</FormHelperText>}
        </FormControl>

        <TextField
          fullWidth
          label="Card Number"
          name="cardNumber"
          value={formData.cardNumber}
          onChange={handleInputChange}
          error={!!errors.cardNumber}
          helperText={errors.cardNumber}
          placeholder="1234 5678 9012 3456"
          inputProps={{ maxLength: 19 }}
        />

        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Expiry Date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleInputChange}
              error={!!errors.expiryDate}
              helperText={errors.expiryDate}
              placeholder="MM/YY"
              inputProps={{ maxLength: 5 }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="CVC"
              name="cvc"
              value={formData.cvc}
              onChange={handleInputChange}
              error={!!errors.cvc}
              helperText={errors.cvc}
              placeholder="123"
              inputProps={{ maxLength: 4 }}
            />
          </Grid>
        </Grid>

        <TextField
          fullWidth
          label="Name on Card"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          error={!!errors.name}
          helperText={errors.name}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading}
          sx={{
            mt: 2,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #1976D2 30%, #00BCD4 90%)',
            },
          }}
        >
          {loading ? 'Processing...' : 'Subscribe Now'}
        </Button>

        <Typography variant="caption" color="text.secondary" align="center">
          Your payment information is secure and encrypted. We never store your full card details.
        </Typography>
      </Stack>
    </Box>
  );
};

export default PaymentForm;
