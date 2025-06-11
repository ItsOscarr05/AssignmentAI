import { zodResolver } from '@hookform/resolvers/zod';
import {
  Add as AddIcon,
  Check as CheckIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

const citationSchema = z.object({
  format: z.enum(['APA', 'MLA', 'Chicago', 'Harvard']),
  citations: z.array(
    z.object({
      type: z.enum(['book', 'journal', 'website', 'other']),
      title: z.string().min(1, 'Title is required'),
      authors: z.string().min(1, 'Authors are required'),
      year: z.string().regex(/^\d{4}$/, 'Year must be a 4-digit number'),
      url: z.string().url('Must be a valid URL').optional(),
      doi: z
        .string()
        .regex(/^10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i, 'Invalid DOI format')
        .optional(),
      journal: z.string().optional(),
      volume: z.string().optional(),
      issue: z.string().optional(),
      pages: z.string().optional(),
      publisher: z.string().optional(),
      location: z.string().optional(),
    })
  ),
});

type CitationFormData = z.infer<typeof citationSchema>;

const CitationHelper: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CitationFormData>({
    resolver: zodResolver(citationSchema),
    defaultValues: {
      format: 'APA',
      citations: [
        {
          type: 'journal',
          title: '',
          authors: '',
          year: '',
          url: '',
          doi: '',
          journal: '',
          volume: '',
          issue: '',
          pages: '',
          publisher: '',
          location: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'citations',
  });

  const format = watch('format');

  const generateCitation = (citation: CitationFormData['citations'][0]): string => {
    switch (format) {
      case 'APA':
        return generateAPACitation(citation);
      case 'MLA':
        return generateMLACitation(citation);
      case 'Chicago':
        return generateChicagoCitation(citation);
      case 'Harvard':
        return generateHarvardCitation(citation);
      default:
        return '';
    }
  };

  const generateAPACitation = (citation: CitationFormData['citations'][0]): string => {
    const { authors, year, title, journal, volume, issue, pages, doi, url } = citation;
    let citationText = `${authors} (${year}). ${title}. `;

    if (journal) {
      citationText += `${journal}`;
      if (volume) citationText += `, ${volume}`;
      if (issue) citationText += `(${issue})`;
      if (pages) citationText += `, ${pages}`;
      citationText += '.';
    }

    if (doi) citationText += ` https://doi.org/${doi}`;
    else if (url) citationText += ` ${url}`;

    return citationText;
  };

  const generateMLACitation = (citation: CitationFormData['citations'][0]): string => {
    const { authors, title, journal, volume, issue, year, pages, url } = citation;
    let citationText = `${authors}. "${title}." `;

    if (journal) {
      citationText += `${journal}`;
      if (volume) citationText += `, vol. ${volume}`;
      if (issue) citationText += `, no. ${issue}`;
      citationText += `, ${year}`;
      if (pages) citationText += `, pp. ${pages}`;
      citationText += '.';
    }

    if (url) citationText += ` ${url}`;

    return citationText;
  };

  const generateChicagoCitation = (citation: CitationFormData['citations'][0]): string => {
    const { authors, title, journal, volume, issue, year, pages, doi, url } = citation;
    let citationText = `${authors}. "${title}." `;

    if (journal) {
      citationText += `${journal}`;
      if (volume) citationText += ` ${volume}`;
      if (issue) citationText += `, no. ${issue}`;
      citationText += ` (${year})`;
      if (pages) citationText += `: ${pages}`;
      citationText += '.';
    }

    if (doi) citationText += ` https://doi.org/${doi}`;
    else if (url) citationText += ` ${url}`;

    return citationText;
  };

  const generateHarvardCitation = (citation: CitationFormData['citations'][0]): string => {
    const { authors, year, title, journal, volume, issue, pages, doi, url } = citation;
    let citationText = `${authors} (${year}) '${title}', `;

    if (journal) {
      citationText += `${journal}`;
      if (volume) citationText += `, ${volume}`;
      if (issue) citationText += `(${issue})`;
      if (pages) citationText += `, pp. ${pages}`;
      citationText += '.';
    }

    if (doi) citationText += ` Available at: https://doi.org/${doi}`;
    else if (url) citationText += ` Available at: ${url}`;

    return citationText;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        setToast({
          open: true,
          message: 'Failed to copy to clipboard',
          severity: 'error',
        });
      }
    );
  };

  const onSubmit = (data: CitationFormData) => {
    const citations = data.citations.map(generateCitation);
    const formattedCitations = citations.join('\n\n');
    copyToClipboard(formattedCitations);
    setToast({
      open: true,
      message: 'Citations copied to clipboard',
      severity: 'success',
    });
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Citation Helper
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Citation Format</InputLabel>
            <Select {...register('format')} label="Citation Format" defaultValue="APA">
              <MenuItem value="APA">APA</MenuItem>
              <MenuItem value="MLA">MLA</MenuItem>
              <MenuItem value="Chicago">Chicago</MenuItem>
              <MenuItem value="Harvard">Harvard</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {fields.map((field, index) => (
          <Paper key={field.id} elevation={1} sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Citation {index + 1}</Typography>
              {fields.length > 1 && (
                <IconButton onClick={() => remove(index)} color="error" size="small">
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    {...register(`citations.${index}.type`)}
                    label="Type"
                    defaultValue="journal"
                  >
                    <MenuItem value="book">Book</MenuItem>
                    <MenuItem value="journal">Journal Article</MenuItem>
                    <MenuItem value="website">Website</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Authors"
                  {...register(`citations.${index}.authors`)}
                  error={!!errors.citations?.[index]?.authors}
                  helperText={errors.citations?.[index]?.authors?.message}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  {...register(`citations.${index}.title`)}
                  error={!!errors.citations?.[index]?.title}
                  helperText={errors.citations?.[index]?.title?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Year"
                  {...register(`citations.${index}.year`)}
                  error={!!errors.citations?.[index]?.year}
                  helperText={errors.citations?.[index]?.year?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Journal"
                  {...register(`citations.${index}.journal`)}
                  error={!!errors.citations?.[index]?.journal}
                  helperText={errors.citations?.[index]?.journal?.message}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Volume"
                  {...register(`citations.${index}.volume`)}
                  error={!!errors.citations?.[index]?.volume}
                  helperText={errors.citations?.[index]?.volume?.message}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Issue"
                  {...register(`citations.${index}.issue`)}
                  error={!!errors.citations?.[index]?.issue}
                  helperText={errors.citations?.[index]?.issue?.message}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Pages"
                  {...register(`citations.${index}.pages`)}
                  error={!!errors.citations?.[index]?.pages}
                  helperText={errors.citations?.[index]?.pages?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="DOI"
                  {...register(`citations.${index}.doi`)}
                  error={!!errors.citations?.[index]?.doi}
                  helperText={errors.citations?.[index]?.doi?.message}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="URL"
                  {...register(`citations.${index}.url`)}
                  error={!!errors.citations?.[index]?.url}
                  helperText={errors.citations?.[index]?.url?.message}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Preview:
              </Typography>
              <Typography variant="body2">
                {generateCitation(watch(`citations.${index}`))}
              </Typography>
              <Tooltip title={copied ? 'Copied!' : 'Copy citation'}>
                <IconButton
                  size="small"
                  onClick={() => copyToClipboard(generateCitation(watch(`citations.${index}`)))}
                  sx={{ mt: 1 }}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>
        ))}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            startIcon={<AddIcon />}
            onClick={() =>
              append({
                type: 'journal',
                title: '',
                authors: '',
                year: '',
                url: '',
                doi: '',
                journal: '',
                volume: '',
                issue: '',
                pages: '',
                publisher: '',
                location: '',
              })
            }
            variant="outlined"
          >
            Add Citation
          </Button>

          <Button type="submit" variant="contained" startIcon={<CopyIcon />}>
            Copy All Citations
          </Button>
        </Box>
      </form>

      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setToast(prev => ({ ...prev, open: false }))}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default CitationHelper;
