import {
  Alert,
  Box,
  Button,
  Divider,
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
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import React, { useState } from 'react';
import { api } from '../../services/api';

interface PaymentFormProps {
  priceId: string;
  planName: string;
  planPrice: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

interface BillingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  priceId,
  planName,
  planPrice,
  onSuccess,
  onError,
}) => {
  console.log('PaymentForm received props:', { priceId, planName, planPrice });
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billingInfo, setBillingInfo] = useState<BillingInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [cardholderName, setCardholderName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');

  // Validation functions for individual fields
  const isValidEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    const digitsOnly = phone.replace(/[\s\-\(\)]/g, '');
    return digitsOnly.length === 10 && /^[1-9]\d{9}$/.test(digitsOnly);
  };

  const isValidPostalCode = (postalCode: string): boolean => {
    return /^\d{5}(-\d{4})?$/.test(postalCode);
  };

  const isValidExpiryDate = (expiryDate: string): boolean => {
    // Check MM/YY format
    const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!regex.test(expiryDate)) return false;

    const [, month, year] = expiryDate.match(regex) || [];
    const currentYear = new Date().getFullYear() % 100; // Get last 2 digits
    const currentMonth = new Date().getMonth() + 1; // January is 0

    const expYear = parseInt(year);
    const expMonth = parseInt(month);

    // Check if expiry date is in the future
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;

    return true;
  };

  const isValidCVV = (cvv: string): boolean => {
    // Check for 3-4 digit number
    return /^\d{3,4}$/.test(cvv);
  };

  const isValidCardNumber = (cardNumber: string): boolean => {
    // Remove spaces and check if it's a valid card number (13-19 digits)
    const digitsOnly = cardNumber.replace(/\s/g, '');
    return /^\d{13,19}$/.test(digitsOnly);
  };

  const formatPhoneNumber = (value: string): string => {
    // Remove all non-digits
    const phoneNumber = value.replace(/\D/g, '');

    // Format based on length
    if (phoneNumber.length === 0) {
      return '';
    } else if (phoneNumber.length <= 3) {
      return `(${phoneNumber}`;
    } else if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    } else {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
    }
  };

  const getFieldBorderColor = (fieldName: string, value: string, hasError: boolean): string => {
    if (hasError) return 'red';
    if (!value.trim()) return 'red';

    // Check specific field validations
    switch (fieldName) {
      case 'email':
        return isValidEmail(value) ? '#4caf50' : 'red';
      case 'phone':
        return isValidPhone(value) ? '#4caf50' : 'red';
      case 'postalCode':
        return isValidPostalCode(value) ? '#4caf50' : 'red';
      case 'expiryDate':
        return isValidExpiryDate(value) ? '#4caf50' : 'red';
      case 'cvv':
        return isValidCVV(value) ? '#4caf50' : 'red';
      case 'cardNumber':
        return isValidCardNumber(value) ? '#4caf50' : 'red';
      default:
        return value.trim() ? '#4caf50' : 'red';
    }
  };

  // Check if all required fields are validated (green borders)
  const isFormValid = (): boolean => {
    // Billing Information validation
    const isFirstNameValid = billingInfo.firstName.trim() !== '';
    const isLastNameValid = billingInfo.lastName.trim() !== '';
    const isEmailValid = isValidEmail(billingInfo.email);
    const isPhoneValid = isValidPhone(billingInfo.phone);

    // Address validation
    const isAddressLine1Valid = billingInfo.address.line1.trim() !== '';
    const isCityValid = billingInfo.address.city.trim() !== '';
    const isStateValid = billingInfo.address.state.trim() !== '';
    const isPostalCodeValid = isValidPostalCode(billingInfo.address.postalCode);
    const isCountryValid = billingInfo.address.country.trim() !== '';

    // Payment Information validation (only require cardholder name and billing email)
    const isCardholderNameValid = cardholderName.trim() !== '';
    const isBillingEmailValid = isValidEmail(billingEmail);

    return (
      isFirstNameValid &&
      isLastNameValid &&
      isEmailValid &&
      isPhoneValid &&
      isAddressLine1Valid &&
      isCityValid &&
      isStateValid &&
      isPostalCodeValid &&
      isCountryValid &&
      isCardholderNameValid &&
      isBillingEmailValid
    );
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    const addressErrors: FormErrors['address'] = {};

    if (!billingInfo.firstName.trim()) errors.firstName = 'First name is required';
    if (!billingInfo.lastName.trim()) errors.lastName = 'Last name is required';
    if (!billingInfo.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(billingInfo.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!billingInfo.phone.trim()) errors.phone = 'Phone number is required';

    // Validate address fields
    if (!billingInfo.address.line1.trim()) addressErrors.line1 = 'Address is required';
    if (!billingInfo.address.city.trim()) addressErrors.city = 'City is required';
    if (!billingInfo.address.state.trim()) addressErrors.state = 'State is required';
    if (!billingInfo.address.postalCode.trim())
      addressErrors.postalCode = 'Postal code is required';

    // Only add address errors if there are any
    if (Object.keys(addressErrors).length > 0) {
      errors.address = addressErrors;
    }

    console.log('Validation errors:', errors);
    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    console.log('Form is valid:', isValid);
    return isValid;
  };

  const handleBillingInfoChange = (field: keyof BillingInfo, value: string) => {
    setBillingInfo(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleAddressChange = (field: keyof BillingInfo['address'], value: string) => {
    setBillingInfo(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
    // Clear error when user starts typing
    if (formErrors.address?.[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.address) {
          newErrors.address = { ...newErrors.address, [field]: undefined };
        }
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Form submitted!');
    console.log('Form validation result:', validateForm());
    console.log('Form data:', { billingInfo, cardholderName, billingEmail });
    console.log('Price ID being sent:', priceId);

    if (!validateForm()) {
      console.log('Form validation failed, returning early');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (!stripe || !elements) {
        throw new Error('Stripe has not loaded yet. Please try again.');
      }

      // Get the card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create a payment method using Stripe
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: cardholderName,
          email: billingEmail,
          address: {
            line1: billingInfo.address.line1,
            line2: billingInfo.address.line2,
            city: billingInfo.address.city,
            state: billingInfo.address.state,
            postal_code: billingInfo.address.postalCode,
            country: billingInfo.address.country,
          },
        },
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Create subscription using the payment method
      console.log('==================================================');
      console.log('MAKING API CALL TO TEST-CREATE-SUBSCRIPTION');
      console.log('==================================================');
      console.log('Price ID from props:', priceId);
      console.log('Price ID type:', typeof priceId);
      console.log('Price ID length:', priceId ? priceId.length : 0);
      console.log('Price ID is empty:', priceId === '');
      console.log('Price ID is undefined:', priceId === undefined);
      console.log('Payment Method ID:', paymentMethod!.id);
      console.log('Full request data:', {
        price_id: priceId,
        payment_method_id: paymentMethod!.id,
      });
      console.log('==================================================');

      await api.post('/payments/test-create-subscription', {
        price_id: priceId,
        payment_method_id: paymentMethod!.id,
      });

      console.log('API call successful!');
      onSuccess();
    } catch (apiError: any) {
      const errorMessage =
        apiError.response?.data?.message || apiError.message || 'Failed to process payment';
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Stack spacing={3}>
        {/* Plan Summary */}
        <Box
          sx={{
            p: 2,
            border: '1px solid red',
            borderRadius: 1,
            backgroundColor: 'rgba(255, 0, 0, 0.05)',
          }}
        >
          <Typography variant="h6" sx={{ color: 'red', fontWeight: 'bold' }}>
            {planName} Plan - ${planPrice}/month
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            You'll be charged ${planPrice} monthly. Cancel anytime.
          </Typography>
        </Box>

        {/* Billing Information */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
            Billing Information
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                value={billingInfo.firstName}
                onChange={e => handleBillingInfoChange('firstName', e.target.value)}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
                required
                placeholder="John"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    '& fieldset': {
                      borderColor: getFieldBorderColor(
                        'firstName',
                        billingInfo.firstName,
                        !!formErrors.firstName
                      ),
                    },
                    '&:hover fieldset': {
                      borderColor: getFieldBorderColor(
                        'firstName',
                        billingInfo.firstName,
                        !!formErrors.firstName
                      ),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: getFieldBorderColor(
                        'firstName',
                        billingInfo.firstName,
                        !!formErrors.firstName
                      ),
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                    '&.Mui-focused': {
                      color: getFieldBorderColor(
                        'firstName',
                        billingInfo.firstName,
                        !!formErrors.firstName
                      ),
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={billingInfo.lastName}
                onChange={e => handleBillingInfoChange('lastName', e.target.value)}
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
                required
                placeholder="Doe"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    '& fieldset': {
                      borderColor: getFieldBorderColor(
                        'lastName',
                        billingInfo.lastName,
                        !!formErrors.lastName
                      ),
                    },
                    '&:hover fieldset': {
                      borderColor: getFieldBorderColor(
                        'lastName',
                        billingInfo.lastName,
                        !!formErrors.lastName
                      ),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: getFieldBorderColor(
                        'lastName',
                        billingInfo.lastName,
                        !!formErrors.lastName
                      ),
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                    '&.Mui-focused': {
                      color: getFieldBorderColor(
                        'lastName',
                        billingInfo.lastName,
                        !!formErrors.lastName
                      ),
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={billingInfo.email}
                onChange={e => handleBillingInfoChange('email', e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
                placeholder="johndoe@gmail.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    '& fieldset': {
                      borderColor: getFieldBorderColor(
                        'email',
                        billingInfo.email,
                        !!formErrors.email
                      ),
                    },
                    '&:hover fieldset': {
                      borderColor: getFieldBorderColor(
                        'email',
                        billingInfo.email,
                        !!formErrors.email
                      ),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: getFieldBorderColor(
                        'email',
                        billingInfo.email,
                        !!formErrors.email
                      ),
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                    '&.Mui-focused': {
                      color: getFieldBorderColor('email', billingInfo.email, !!formErrors.email),
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone Number"
                value={billingInfo.phone}
                onChange={e => handleBillingInfoChange('phone', formatPhoneNumber(e.target.value))}
                error={!!formErrors.phone}
                helperText={formErrors.phone}
                required
                placeholder="(123) 456-7890"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    '& fieldset': {
                      borderColor: getFieldBorderColor(
                        'phone',
                        billingInfo.phone,
                        !!formErrors.phone
                      ),
                    },
                    '&:hover fieldset': {
                      borderColor: getFieldBorderColor(
                        'phone',
                        billingInfo.phone,
                        !!formErrors.phone
                      ),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: getFieldBorderColor(
                        'phone',
                        billingInfo.phone,
                        !!formErrors.phone
                      ),
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                    '&.Mui-focused': {
                      color: getFieldBorderColor('phone', billingInfo.phone, !!formErrors.phone),
                    },
                  },
                }}
              />
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Billing Address */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
            Billing Address
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 1"
                value={billingInfo.address.line1}
                onChange={e => handleAddressChange('line1', e.target.value)}
                error={!!formErrors.address?.line1}
                helperText={formErrors.address?.line1}
                required
                placeholder="123 Main St"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    '& fieldset': {
                      borderColor: getFieldBorderColor(
                        'line1',
                        billingInfo.address.line1,
                        !!formErrors.address?.line1
                      ),
                    },
                    '&:hover fieldset': {
                      borderColor: getFieldBorderColor(
                        'line1',
                        billingInfo.address.line1,
                        !!formErrors.address?.line1
                      ),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: getFieldBorderColor(
                        'line1',
                        billingInfo.address.line1,
                        !!formErrors.address?.line1
                      ),
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                    '&.Mui-focused': {
                      color: getFieldBorderColor(
                        'line1',
                        billingInfo.address.line1,
                        !!formErrors.address?.line1
                      ),
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address Line 2"
                value={billingInfo.address.line2}
                onChange={e => handleAddressChange('line2', e.target.value)}
                placeholder="Apt, suite, etc. (optional)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    '& fieldset': {
                      borderColor: billingInfo.address.line2.trim() ? '#4caf50' : '#ffc107',
                    },
                    '&:hover fieldset': {
                      borderColor: billingInfo.address.line2.trim() ? '#4caf50' : '#ffc107',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: billingInfo.address.line2.trim() ? '#4caf50' : '#ffc107',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                    '&.Mui-focused': {
                      color: billingInfo.address.line2.trim() ? '#4caf50' : '#ffc107',
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={billingInfo.address.city}
                onChange={e => handleAddressChange('city', e.target.value)}
                error={!!formErrors.address?.city}
                helperText={formErrors.address?.city}
                required
                placeholder="New York"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    '& fieldset': {
                      borderColor: getFieldBorderColor(
                        'city',
                        billingInfo.address.city,
                        !!formErrors.address?.city
                      ),
                    },
                    '&:hover fieldset': {
                      borderColor: getFieldBorderColor(
                        'city',
                        billingInfo.address.city,
                        !!formErrors.address?.city
                      ),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: getFieldBorderColor(
                        'city',
                        billingInfo.address.city,
                        !!formErrors.address?.city
                      ),
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                    '&.Mui-focused': {
                      color: getFieldBorderColor(
                        'city',
                        billingInfo.address.city,
                        !!formErrors.address?.city
                      ),
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!formErrors.address?.state}>
                <InputLabel
                  sx={{
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                    '&.Mui-focused': {
                      color: getFieldBorderColor(
                        'state',
                        billingInfo.address.state,
                        !!formErrors.address?.state
                      ),
                    },
                  }}
                >
                  State/Province
                </InputLabel>
                <Select
                  value={billingInfo.address.state}
                  label="State/Province"
                  onChange={e => handleAddressChange('state', e.target.value)}
                  sx={{
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: getFieldBorderColor(
                        'state',
                        billingInfo.address.state,
                        !!formErrors.address?.state
                      ),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: getFieldBorderColor(
                        'state',
                        billingInfo.address.state,
                        !!formErrors.address?.state
                      ),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: getFieldBorderColor(
                        'state',
                        billingInfo.address.state,
                        !!formErrors.address?.state
                      ),
                    },
                  }}
                >
                  <MenuItem value="AL">AL - Alabama</MenuItem>
                  <MenuItem value="AK">AK - Alaska</MenuItem>
                  <MenuItem value="AZ">AZ - Arizona</MenuItem>
                  <MenuItem value="AR">AR - Arkansas</MenuItem>
                  <MenuItem value="CA">CA - California</MenuItem>
                  <MenuItem value="CO">CO - Colorado</MenuItem>
                  <MenuItem value="CT">CT - Connecticut</MenuItem>
                  <MenuItem value="DE">DE - Delaware</MenuItem>
                  <MenuItem value="FL">FL - Florida</MenuItem>
                  <MenuItem value="GA">GA - Georgia</MenuItem>
                  <MenuItem value="HI">HI - Hawaii</MenuItem>
                  <MenuItem value="ID">ID - Idaho</MenuItem>
                  <MenuItem value="IL">IL - Illinois</MenuItem>
                  <MenuItem value="IN">IN - Indiana</MenuItem>
                  <MenuItem value="IA">IA - Iowa</MenuItem>
                  <MenuItem value="KS">KS - Kansas</MenuItem>
                  <MenuItem value="KY">KY - Kentucky</MenuItem>
                  <MenuItem value="LA">LA - Louisiana</MenuItem>
                  <MenuItem value="ME">ME - Maine</MenuItem>
                  <MenuItem value="MD">MD - Maryland</MenuItem>
                  <MenuItem value="MA">MA - Massachusetts</MenuItem>
                  <MenuItem value="MI">MI - Michigan</MenuItem>
                  <MenuItem value="MN">MN - Minnesota</MenuItem>
                  <MenuItem value="MS">MS - Mississippi</MenuItem>
                  <MenuItem value="MO">MO - Missouri</MenuItem>
                  <MenuItem value="MT">MT - Montana</MenuItem>
                  <MenuItem value="NE">NE - Nebraska</MenuItem>
                  <MenuItem value="NV">NV - Nevada</MenuItem>
                  <MenuItem value="NH">NH - New Hampshire</MenuItem>
                  <MenuItem value="NJ">NJ - New Jersey</MenuItem>
                  <MenuItem value="NM">NM - New Mexico</MenuItem>
                  <MenuItem value="NY">NY - New York</MenuItem>
                  <MenuItem value="NC">NC - North Carolina</MenuItem>
                  <MenuItem value="ND">ND - North Dakota</MenuItem>
                  <MenuItem value="OH">OH - Ohio</MenuItem>
                  <MenuItem value="OK">OK - Oklahoma</MenuItem>
                  <MenuItem value="OR">OR - Oregon</MenuItem>
                  <MenuItem value="PA">PA - Pennsylvania</MenuItem>
                  <MenuItem value="RI">RI - Rhode Island</MenuItem>
                  <MenuItem value="SC">SC - South Carolina</MenuItem>
                  <MenuItem value="SD">SD - South Dakota</MenuItem>
                  <MenuItem value="TN">TN - Tennessee</MenuItem>
                  <MenuItem value="TX">TX - Texas</MenuItem>
                  <MenuItem value="UT">UT - Utah</MenuItem>
                  <MenuItem value="VT">VT - Vermont</MenuItem>
                  <MenuItem value="VA">VA - Virginia</MenuItem>
                  <MenuItem value="WA">WA - Washington</MenuItem>
                  <MenuItem value="WV">WV - West Virginia</MenuItem>
                  <MenuItem value="WI">WI - Wisconsin</MenuItem>
                  <MenuItem value="WY">WY - Wyoming</MenuItem>
                  <MenuItem value="DC">DC - District of Columbia</MenuItem>
                </Select>
                {formErrors.address?.state && (
                  <FormHelperText error>{formErrors.address.state}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Postal Code"
                value={billingInfo.address.postalCode}
                onChange={e => handleAddressChange('postalCode', e.target.value)}
                error={!!formErrors.address?.postalCode}
                helperText={formErrors.address?.postalCode}
                required
                placeholder="12345"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    '& fieldset': {
                      borderColor: getFieldBorderColor(
                        'postalCode',
                        billingInfo.address.postalCode,
                        !!formErrors.address?.postalCode
                      ),
                    },
                    '&:hover fieldset': {
                      borderColor: getFieldBorderColor(
                        'postalCode',
                        billingInfo.address.postalCode,
                        !!formErrors.address?.postalCode
                      ),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: getFieldBorderColor(
                        'postalCode',
                        billingInfo.address.postalCode,
                        !!formErrors.address?.postalCode
                      ),
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                    '&.Mui-focused': {
                      color: getFieldBorderColor(
                        'postalCode',
                        billingInfo.address.postalCode,
                        !!formErrors.address?.postalCode
                      ),
                    },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel
                  sx={{
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                    '&.Mui-focused': {
                      color: getFieldBorderColor('country', billingInfo.address.country, false),
                    },
                  }}
                >
                  Country
                </InputLabel>
                <Select
                  value={billingInfo.address.country}
                  label="Country"
                  onChange={e => handleAddressChange('country', e.target.value)}
                  sx={{
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: getFieldBorderColor(
                        'country',
                        billingInfo.address.country,
                        false
                      ),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: getFieldBorderColor(
                        'country',
                        billingInfo.address.country,
                        false
                      ),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: getFieldBorderColor(
                        'country',
                        billingInfo.address.country,
                        false
                      ),
                    },
                  }}
                >
                  <MenuItem value="US">United States</MenuItem>
                  <MenuItem value="CA">Canada</MenuItem>
                  <MenuItem value="GB">United Kingdom</MenuItem>
                  <MenuItem value="AU">Australia</MenuItem>
                  <MenuItem value="DE">Germany</MenuItem>
                  <MenuItem value="FR">France</MenuItem>
                  <MenuItem value="JP">Japan</MenuItem>
                  <MenuItem value="IN">India</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        {/* Payment Information */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2, color: 'text.primary' }}>
            Payment Information
          </Typography>

          <Grid container spacing={2}>
            {/* Cardholder Name and Billing Email - Top Row */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cardholder Name"
                value={cardholderName}
                required
                onChange={e => setCardholderName(e.target.value)}
                placeholder="John Doe"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    '& fieldset': {
                      borderColor: cardholderName.trim() ? '#4caf50' : 'red',
                    },
                    '&:hover fieldset': {
                      borderColor: cardholderName.trim() ? '#4caf50' : 'red',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: cardholderName.trim() ? '#4caf50' : 'red',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                    '&.Mui-focused': {
                      color: cardholderName.trim() ? '#4caf50' : 'red',
                    },
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Billing Email"
                type="email"
                value={billingEmail}
                required
                onChange={e => setBillingEmail(e.target.value)}
                placeholder="johndoe@gmail.com"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: theme =>
                      theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                    '& fieldset': {
                      borderColor: getFieldBorderColor('email', billingEmail, false),
                    },
                    '&:hover fieldset': {
                      borderColor: getFieldBorderColor('email', billingEmail, false),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: getFieldBorderColor('email', billingEmail, false),
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: theme => (theme.palette.mode === 'dark' ? 'white' : 'black'),
                    '&.Mui-focused': {
                      color: getFieldBorderColor('email', billingEmail, false),
                    },
                  },
                }}
              />
            </Grid>

            {/* Card Element - Stripe's Secure Card Input */}
            <Grid item xs={12}>
              <Box
                sx={{
                  border: '1px solid #ccc',
                  borderRadius: 1,
                  p: 2,
                  backgroundColor: theme =>
                    theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
                }}
              >
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#fa755a',
                        iconColor: '#fa755a',
                      },
                    },
                  }}
                />
              </Box>
            </Grid>
          </Grid>

          {/* Payment Security Notice */}
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: 'rgba(156, 39, 176, 0.1)',
              borderRadius: 1,
              border: '1px solid #9c27b0',
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: '#9c27b0', display: 'flex', alignItems: 'center', gap: 1 }}
            >
              {/* LockIcon is no longer imported, so this line is removed */}
              Secure payment powered by Stripe. Your card details are encrypted and never stored on
              our servers.
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={!stripe || loading || !isFormValid()}
          sx={{
            mt: 2,
            backgroundColor: isFormValid() ? 'red' : '#ccc',
            '&:hover': {
              backgroundColor: isFormValid() ? '#d32f2f' : '#ccc',
            },
            '&:disabled': {
              backgroundColor: '#ccc',
              cursor: 'not-allowed',
            },
          }}
        >
          {loading ? 'Processing Payment...' : `Subscribe to ${planName} - $${planPrice}/month`}
        </Button>

        <Typography variant="caption" color="text.secondary" align="center">
          Your payment information is secure and encrypted. We never store your full card details.
        </Typography>

        <Typography variant="caption" color="text.secondary" align="center">
          By subscribing, you agree to our{' '}
          <a
            href="/terms-of-service"
            style={{
              color: '#ff6b6b',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
            onClick={e => {
              e.preventDefault();
              window.open('/terms', '_blank');
            }}
          >
            Terms of Service
          </a>{' '}
          and{' '}
          <a
            href="/privacy-policy"
            style={{
              color: '#ff6b6b',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
            onClick={e => {
              e.preventDefault();
              window.open('/privacy', '_blank');
            }}
          >
            Privacy Policy
          </a>
          .
        </Typography>
      </Stack>
    </Box>
  );
};

export default PaymentForm;
