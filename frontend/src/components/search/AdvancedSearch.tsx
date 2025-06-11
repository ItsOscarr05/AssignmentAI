import {
  Clear as ClearIcon,
  FilterList as FilterListIcon,
  History as HistoryIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';

interface SearchFilter {
  field: string;
  operator: string;
  value: string;
}

interface SearchHistoryItem {
  id: string;
  query: string;
  filters: SearchFilter[];
  timestamp: string;
}

const mockSearchHistory: SearchHistoryItem[] = [
  {
    id: '1',
    query: 'assignment submission',
    filters: [
      { field: 'status', operator: 'equals', value: 'submitted' },
      { field: 'date', operator: 'after', value: '2024-03-01' },
    ],
    timestamp: '2024-03-20T10:30:00Z',
  },
  {
    id: '2',
    query: 'feedback analysis',
    filters: [
      { field: 'type', operator: 'equals', value: 'feedback' },
      { field: 'rating', operator: 'greater_than', value: '4' },
    ],
    timestamp: '2024-03-19T15:45:00Z',
  },
];

const filterFields = [
  { value: 'title', label: 'Title' },
  { value: 'status', label: 'Status' },
  { value: 'date', label: 'Date' },
  { value: 'type', label: 'Type' },
  { value: 'rating', label: 'Rating' },
];

const operators = [
  { value: 'equals', label: 'Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'after', label: 'After' },
  { value: 'before', label: 'Before' },
];

const AdvancedSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filters, setFilters] = React.useState<SearchFilter[]>([]);
  const [showFilters, setShowFilters] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [searchHistory, setSearchHistory] = React.useState<SearchHistoryItem[]>(mockSearchHistory);
  const [newFilter, setNewFilter] = React.useState<SearchFilter>({
    field: '',
    operator: '',
    value: '',
  });

  const handleSearch = () => {
    // TODO: Implement search functionality
    const newHistoryItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: searchQuery,
      filters,
      timestamp: new Date().toISOString(),
    };
    setSearchHistory([newHistoryItem, ...searchHistory]);
  };

  const handleAddFilter = () => {
    if (newFilter.field && newFilter.operator && newFilter.value) {
      setFilters([...filters, newFilter]);
      setNewFilter({ field: '', operator: '', value: '' });
    }
  };

  const handleRemoveFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleClearFilters = () => {
    setFilters([]);
  };

  const handleUseHistoryItem = (item: SearchHistoryItem) => {
    setSearchQuery(item.query);
    setFilters(item.filters);
    setShowHistory(false);
  };

  const handleRemoveHistoryItem = (id: string) => {
    setSearchHistory(searchHistory.filter(item => item.id !== id));
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <Button variant="contained" startIcon={<SearchIcon />} onClick={handleSearch}>
            Search
          </Button>
          <IconButton
            onClick={() => setShowFilters(!showFilters)}
            color={showFilters ? 'primary' : 'default'}
          >
            <FilterListIcon />
          </IconButton>
          <IconButton
            onClick={() => setShowHistory(!showHistory)}
            color={showHistory ? 'primary' : 'default'}
          >
            <HistoryIcon />
          </IconButton>
        </Box>

        {filters.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Active Filters:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filters.map((filter, index) => (
                <Chip
                  key={index}
                  label={`${filter.field} ${filter.operator} ${filter.value}`}
                  onDelete={() => handleRemoveFilter(index)}
                />
              ))}
              <Button size="small" startIcon={<ClearIcon />} onClick={handleClearFilters}>
                Clear All
              </Button>
            </Box>
          </Box>
        )}

        <Collapse in={showFilters}>
          <Paper sx={{ p: 2, mt: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Field</InputLabel>
                  <Select
                    value={newFilter.field}
                    label="Field"
                    onChange={e => setNewFilter({ ...newFilter, field: e.target.value })}
                  >
                    {filterFields.map(field => (
                      <MenuItem key={field.value} value={field.value}>
                        {field.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={newFilter.operator}
                    label="Operator"
                    onChange={e => setNewFilter({ ...newFilter, operator: e.target.value })}
                  >
                    {operators.map(op => (
                      <MenuItem key={op.value} value={op.value}>
                        {op.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Value"
                  value={newFilter.value}
                  onChange={e => setNewFilter({ ...newFilter, value: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleAddFilter}
                  disabled={!newFilter.field || !newFilter.operator || !newFilter.value}
                >
                  Add Filter
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Collapse>

        <Collapse in={showHistory}>
          <Paper sx={{ mt: 2 }}>
            <List>
              {searchHistory.map(item => (
                <React.Fragment key={item.id}>
                  <ListItem>
                    <ListItemText
                      primary={item.query}
                      secondary={
                        <>
                          {item.filters.map((filter, index) => (
                            <Chip
                              key={index}
                              size="small"
                              label={`${filter.field} ${filter.operator} ${filter.value}`}
                              sx={{ mr: 1, mt: 1 }}
                            />
                          ))}
                          <Typography variant="caption" display="block">
                            {new Date(item.timestamp).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => handleUseHistoryItem(item)}>
                        <SearchIcon />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleRemoveHistoryItem(item.id)}>
                        <ClearIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AdvancedSearch;
