import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box, 
  Typography,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { Language as LanguageIcon, ExpandMore } from '@mui/icons-material';
import { useTranslation } from '../i18n/useTranslation';

interface LanguageSelectorProps {
  variant?: 'dropdown' | 'menu';
  size?: 'small' | 'medium';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  variant = 'dropdown',
  size = 'medium' 
}) => {
  const { currentLanguage, changeLanguage, supportedLanguages, t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (languageCode: string) => {
    changeLanguage(languageCode);
    handleMenuClose();
  };

  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage);

  if (variant === 'menu') {
    return (
      <Box>
        <IconButton
          onClick={handleMenuOpen}
          size={size}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1
          }}
        >
          <Typography variant="body2" sx={{ fontSize: '1.2em' }}>
            {currentLang?.flag}
          </Typography>
          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {currentLang?.nativeName}
          </Typography>
          <ExpandMore fontSize="small" />
        </IconButton>
        
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              maxHeight: 300,
              minWidth: 200
            }
          }}
        >
          {supportedLanguages.map((language) => (
            <MenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              selected={language.code === currentLanguage}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <ListItemIcon sx={{ minWidth: 'auto', fontSize: '1.2em' }}>
                {language.flag}
              </ListItemIcon>
              <ListItemText
                primary={language.nativeName}
                secondary={language.name}
                secondaryTypographyProps={{
                  variant: 'caption',
                  color: 'text.secondary'
                }}
              />
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  }

  return (
    <FormControl size={size} sx={{ minWidth: 150 }}>
      <InputLabel id="language-select-label">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LanguageIcon fontSize="small" />
          {t.settings.language}
        </Box>
      </InputLabel>
      <Select
        labelId="language-select-label"
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value)}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LanguageIcon fontSize="small" />
            {t.settings.language}
          </Box>
        }
      >
        {supportedLanguages.map((language) => (
          <MenuItem key={language.code} value={language.code}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              <Typography sx={{ fontSize: '1.2em', minWidth: '2em' }}>
                {language.flag}
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">
                  {language.nativeName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {language.name}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}; 