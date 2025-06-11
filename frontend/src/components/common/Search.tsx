import {
  Clear as ClearIcon,
  History as HistoryIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchResult {
  id: string | number;
  title: string;
  subtitle?: string;
  [key: string]: any;
}

interface SearchProps {
  onSearch: (query: string) => Promise<SearchResult[]>;
  placeholder?: string;
  minLength?: number;
  debounceMs?: number;
  maxLength?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'warning' | 'error' | 'info' | 'success';
  variant?: 'outlined' | 'filled' | 'standard';
  onSelect?: (result: SearchResult) => void;
  renderResult?: (result: SearchResult) => React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: React.CSSProperties;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  label?: string;
  error?: string;
}

export const Search: React.FC<SearchProps> = ({
  onSearch,
  placeholder = 'Search...',
  minLength = 2,
  debounceMs = 300,
  maxLength,
  size,
  color,
  variant,
  onSelect,
  renderResult,
  disabled = false,
  loading: loadingProp = false,
  className,
  style,
  iconClassName,
  iconStyle,
  label,
  error,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, debounceMs);
  const searchRef = useRef<HTMLDivElement>(null);

  // Map size, color, variant to class names
  const inputClassNames = [
    className,
    size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-sm' : '',
    color ? `text-${color}` : '',
    variant === 'outlined' ? 'border' : '',
  ]
    .filter(Boolean)
    .join(' ');

  useEffect(() => {
    const loadHistory = () => {
      const savedHistory = localStorage.getItem('searchHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < minLength) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        let searchValue = debouncedQuery;
        if (maxLength && searchValue.length > maxLength) {
          searchValue = searchValue.slice(0, maxLength);
        }
        const searchResults = await onSearch(searchValue);
        setResults(searchResults.slice(0, 5));
        setShowResults(true);

        // Update search history
        if (!history.includes(searchValue)) {
          const newHistory = [searchValue, ...history].slice(0, 5);
          setHistory(newHistory);
          localStorage.setItem('searchHistory', JSON.stringify(newHistory));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, minLength, maxLength, onSearch]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const handleSelect = (result: SearchResult) => {
    onSelect?.(result);
    setShowResults(false);
  };

  const defaultRenderResult = (result: SearchResult) => (
    <ListItemText primary={result.title} secondary={result.subtitle} />
  );

  return (
    <Box ref={searchRef} sx={{ position: 'relative' }}>
      <TextField
        fullWidth
        value={query}
        onChange={e => {
          let value = e.target.value;
          if (maxLength && value.length > maxLength) {
            value = value.slice(0, maxLength);
          }
          setQuery(value);
        }}
        placeholder={placeholder}
        disabled={disabled || loading || loadingProp}
        label={label}
        error={!!error}
        helperText={error}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon data-testid="SearchIcon" className={iconClassName} style={iconStyle} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading || loadingProp ? (
                <CircularProgress size={20} />
              ) : query ? (
                <IconButton size="small" onClick={handleClear}>
                  <ClearIcon />
                </IconButton>
              ) : null}
            </InputAdornment>
          ),
          inputProps: {
            className: inputClassNames,
            style,
            'aria-label': 'Search',
            maxLength,
          },
        }}
        type="search"
      />

      {showResults && (query || history.length > 0) && (
        <Paper
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1000,
          }}
        >
          <List>
            {results.map(result => (
              <ListItem key={result.id} button onClick={() => handleSelect(result)}>
                {renderResult ? renderResult(result) : defaultRenderResult(result)}
              </ListItem>
            ))}
            {results.length === 0 && query && (
              <ListItem>
                <ListItemText primary="No results found" secondary="Try adjusting your search" />
              </ListItem>
            )}
            {!query && history.length > 0 && (
              <>
                <ListItem>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    sx={{ display: 'flex', alignItems: 'center' }}
                  >
                    <HistoryIcon sx={{ mr: 1 }} />
                    Recent Searches
                  </Typography>
                </ListItem>
                {history.map(item => (
                  <ListItem key={item} button onClick={() => setQuery(item)}>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </>
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
};
