import { AccessTime, Email, HelpOutline, SupportAgent } from '@mui/icons-material';
import {
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
import { useState } from 'react';

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Container sx={{ py: { xs: 8, md: 12 } }}>
      <Paper
        sx={{
          p: { xs: 3, md: 6 },
          borderRadius: 4,
          maxWidth: 1200,
          mx: 'auto',
          textAlign: 'left',
          backgroundColor: 'grey.50',
          boxShadow: '0 0 32px rgba(211, 47, 47, 0.4), 0 0 64px rgba(211, 47, 47, 0.3)',
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          sx={{ mb: 3, fontWeight: 700, color: 'primary.main', letterSpacing: 1 }}
        >
          Contact Us
        </Typography>
        <Divider sx={{ mb: 4, borderColor: 'primary.main', opacity: 0.2 }} />
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
          We're here to help
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, fontSize: '1.15rem', color: 'text.secondary' }}>
          Have a question, suggestion, or need support? Fill out the form below or reach out to us
          directly. Our team is dedicated to providing prompt and helpful responses to ensure you
          have the best experience with AssignmentAI.
        </Typography>
        <Grid container spacing={6}>
          <Grid item xs={12} md={7}>
            {submitted ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <SupportAgent sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Thank you for reaching out!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Your message has been received. Our team will get back to you as soon as possible.
                </Typography>
              </Box>
            ) : (
              <Box
                component="form"
                onSubmit={e => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                sx={{ width: '100%' }}
              >
                <Stack spacing={2}>
                  <TextField label="Your Name" name="name" required fullWidth variant="outlined" />
                  <TextField
                    label="Your Email Address"
                    name="email"
                    type="email"
                    required
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="Your Message"
                    name="message"
                    required
                    fullWidth
                    multiline
                    minRows={4}
                    variant="outlined"
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{ px: 4, fontWeight: 600, alignSelf: 'flex-end' }}
                  >
                    Send Message
                  </Button>
                </Stack>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={5}>
            <Box sx={{ pl: { md: 2 }, pt: { xs: 4, md: 0 } }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>
                Other Ways to Reach Us
              </Typography>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Email sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="body1">support@assignmentai.app</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTime sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="body1">Support Hours: 24/7</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <HelpOutline sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="body1">Check our FAQ for quick answers</Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 3, borderColor: 'primary.main', opacity: 0.1 }} />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: 'primary.main' }}>
                Frequently Asked
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <b>How quickly will I get a response?</b>
                <br />
                We aim to respond to all inquiries within 24 hours during business days.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <b>Can I request a feature?</b>
                <br />
                Absolutely! We welcome suggestions and feedback—just use the form or email us
                directly.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <b>Is my information safe?</b>
                <br />
                Yes. We take privacy and security seriously. Your contact details and messages are
                handled with strict confidentiality.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Contact;
