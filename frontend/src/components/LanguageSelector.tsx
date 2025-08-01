import { Search as SearchIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Divider,
  InputAdornment,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  TextField,
} from '@mui/material';
import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filteredLanguages, setFilteredLanguages] = React.useState<string[]>([]);

  const languages = {
    English: 'en',
    Spanish: 'es',
    French: 'fr',
    German: 'de',
    Russian: 'ru',
    Chinese: 'zh',
    Japanese: 'ja',
    Korean: 'ko',
    Arabic: 'ar',
    Hindi: 'hi',
    Bengali: 'bn',
    Turkish: 'tr',
    Dutch: 'nl',
    Polish: 'pl',
    Vietnamese: 'vi',
    Thai: 'th',
    Indonesian: 'id',
    Malay: 'ms',
    Swedish: 'sv',
    Danish: 'da',
    Finnish: 'fi',
    Greek: 'el',
    Hebrew: 'he',
    // Add more languages as needed
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    handleClose();
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = Object.entries(languages)
      .filter(([name]) => name.toLowerCase().includes(query))
      .map(([name]) => name);

    setFilteredLanguages(filtered);
  };

  const currentLanguage =
    Object.entries(languages).find(([_, code]) => code === i18n.language)?.[0] || 'English';

  return (
    <Box>
      <Button onClick={handleClick} variant="outlined" color="primary" sx={{ minWidth: '150px' }}>
        {currentLanguage}
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            maxHeight: 400,
            width: '300px',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search languages..."
            value={searchQuery}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Divider />
        <MenuList>
          {(searchQuery ? filteredLanguages : Object.keys(languages)).map(languageName => (
            <MenuItem
              key={languages[languageName as keyof typeof languages]}
              onClick={() =>
                handleLanguageChange(languages[languageName as keyof typeof languages])
              }
              selected={languages[languageName as keyof typeof languages] === i18n.language}
            >
              <ListItemText primary={languageName} />
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
};

export default LanguageSelector;
