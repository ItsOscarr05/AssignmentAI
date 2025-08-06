import { AccessTime, EmailOutlined, HelpOutline, SupportAgent } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import RedStarField from '../components/RedStarField';
import PageHeader from '../components/common/PageHeader';
import { contactService } from '../services/contactService';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
  });

  // Starfield logic
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);
  useEffect(() => {
    const updateHeight = () => {
      if (mainContentRef.current) {
        setContentHeight(mainContentRef.current.offsetHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleInputChange =
    (field: keyof ContactFormData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev: ContactFormData) => ({
        ...prev,
        [field]: event.target.value,
      }));
      setError(null); // Clear error when user starts typing
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await contactService.submitContactForm(formData);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      ref={mainContentRef}
      sx={{ position: 'relative', bgcolor: 'white', width: '100%', overflow: 'hidden' }}
    >
      <RedStarField starCount={2500} contentHeight={contentHeight} />
      <Container
        sx={{ pt: { xs: 4, md: 6 }, pb: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }}
      >
        <Paper
          sx={{
            p: { xs: 3, md: 6 },
            borderRadius: 4,
            maxWidth: 1200,
            mx: 'auto',
            textAlign: 'left',
            backgroundColor: '#fafafa',
            boxShadow: '0 0 32px rgba(211, 47, 47, 0.4), 0 0 64px rgba(211, 47, 47, 0.3)',
            border: '2px solid',
            borderColor: 'primary.main',
            position: 'relative',
          }}
        >
          <PageHeader title="Contact Us" />
          <Divider sx={{ mb: 4, borderColor: 'primary.main', opacity: 0.2 }} />
          <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: 'black' }}>
            We're here to help
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, fontSize: '1.15rem', color: 'black' }}>
            Have a question, suggestion, or need support? Fill out the form below or reach out to us
            directly. Our team is dedicated to providing prompt and helpful responses to ensure you
            have the best experience with AssignmentAI.
          </Typography>
          <Grid container spacing={6}>
            <Grid item xs={12} md={7}>
              {submitted ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <SupportAgent sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" sx={{ mb: 2, color: 'black' }}>
                    Thank you for reaching out!
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 4, color: 'black' }}>
                    Your message has been received. Our team will get back to you as soon as
                    possible.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', message: '' });
                      setError(null);
                    }}
                    sx={{ fontWeight: 600 }}
                  >
                    Send Another Message
                  </Button>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}
                  <Stack spacing={2}>
                    <TextField
                      label="Your Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      required
                      fullWidth
                      variant="outlined"
                      disabled={isSubmitting}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          '& fieldset': {
                            borderColor: '#d32f2f',
                          },
                          '&:hover fieldset': {
                            borderColor: '#b71c1c',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#d32f2f',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#666666',
                          '&.Mui-focused': {
                            color: '#d32f2f',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: 'black',
                        },
                      }}
                    />
                    <TextField
                      label="Your Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      required
                      fullWidth
                      variant="outlined"
                      disabled={isSubmitting}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          '& fieldset': {
                            borderColor: '#d32f2f',
                          },
                          '&:hover fieldset': {
                            borderColor: '#b71c1c',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#d32f2f',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#666666',
                          '&.Mui-focused': {
                            color: '#d32f2f',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: 'black',
                        },
                      }}
                    />
                    <TextField
                      label="Your Message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange('message')}
                      required
                      fullWidth
                      multiline
                      minRows={4}
                      variant="outlined"
                      disabled={isSubmitting}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          '& fieldset': {
                            borderColor: '#d32f2f',
                          },
                          '&:hover fieldset': {
                            borderColor: '#b71c1c',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#d32f2f',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#666666',
                          '&.Mui-focused': {
                            color: '#d32f2f',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: 'black',
                        },
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                      sx={{ px: 4, fontWeight: 600, alignSelf: 'flex-end' }}
                    >
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </Stack>
                </Box>
              )}
            </Grid>
            <Grid item xs={12} md={5}>
              <Box sx={{ pl: { md: 2 }, pt: { xs: 4, md: 0 } }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                  Support Contact Info
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailOutlined sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="body1" sx={{ color: 'black' }}>
                      support@assignmentai.app
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTime sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="body1" sx={{ color: 'black' }}>
                      Support Hours: 24/7
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <HelpOutline sx={{ mr: 2, color: 'primary.main' }} />
                    <Typography variant="body1" sx={{ color: 'black' }}>
                      Check our FAQ for quick answers
                    </Typography>
                  </Box>
                </Stack>
                <Divider sx={{ my: 3, borderColor: 'primary.main', opacity: 0.1 }} />
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                  Frequently Asked
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <b style={{ color: 'black' }}>How quickly will I get a response?</b>
                  <br />
                  <Typography variant="body2" sx={{ color: '#666666' }}>
                    We aim to respond to all inquiries within 24 hours during business days.
                  </Typography>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <b style={{ color: 'black' }}>Can I request a feature?</b>
                  <br />
                  <Typography variant="body2" sx={{ color: '#666666' }}>
                    Absolutely! We welcome suggestions and feedback—just use the form or email us
                    directly.
                  </Typography>
                </Typography>
                <Typography variant="body2">
                  <b style={{ color: 'black' }}>Is my information safe?</b>
                  <br />
                  <Typography variant="body2" sx={{ color: '#666666' }}>
                    Yes. We take privacy and security seriously. Your contact details and messages
                    are handled with strict confidentiality.
                  </Typography>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default Contact;
