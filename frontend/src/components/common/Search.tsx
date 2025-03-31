import {
  Clear as ClearIcon,
  History as HistoryIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
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
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";

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
  maxResults?: number;
  onSelect?: (result: SearchResult) => void;
  renderResult?: (result: SearchResult) => React.ReactNode;
}

export const Search: React.FC<SearchProps> = ({
  onSearch,
  placeholder = "Search...",
  minLength = 2,
  debounceMs = 300,
  maxResults = 5,
  onSelect,
  renderResult,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, debounceMs);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHistory = () => {
      const savedHistory = localStorage.getItem("searchHistory");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < minLength) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchResults = await onSearch(debouncedQuery);
        setResults(searchResults.slice(0, maxResults));
        setShowResults(true);

        // Update search history
        if (!history.includes(debouncedQuery)) {
          const newHistory = [debouncedQuery, ...history].slice(0, 5);
          setHistory(newHistory);
          localStorage.setItem("searchHistory", JSON.stringify(newHistory));
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery, minLength, maxResults, onSearch]);

  const handleClear = () => {
    setQuery("");
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
    <Box ref={searchRef} sx={{ position: "relative" }}>
      <TextField
        fullWidth
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              {loading ? (
                <CircularProgress size={20} />
              ) : query ? (
                <IconButton size="small" onClick={handleClear}>
                  <ClearIcon />
                </IconButton>
              ) : null}
            </InputAdornment>
          ),
        }}
      />

      {showResults && (query || history.length > 0) && (
        <Paper
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            mt: 1,
            maxHeight: 400,
            overflow: "auto",
            zIndex: 1000,
          }}
        >
          <List>
            {results.map((result) => (
              <ListItem
                key={result.id}
                button
                onClick={() => handleSelect(result)}
              >
                {renderResult
                  ? renderResult(result)
                  : defaultRenderResult(result)}
              </ListItem>
            ))}
            {results.length === 0 && query && (
              <ListItem>
                <ListItemText
                  primary="No results found"
                  secondary="Try adjusting your search"
                />
              </ListItem>
            )}
            {!query && history.length > 0 && (
              <>
                <ListItem>
                  <Typography
                    variant="subtitle2"
                    color="textSecondary"
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    <HistoryIcon sx={{ mr: 1 }} />
                    Recent Searches
                  </Typography>
                </ListItem>
                {history.map((item) => (
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
