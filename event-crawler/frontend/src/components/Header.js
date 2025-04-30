import React from 'react';
import { Box, Typography, TextField, InputLabel, Paper } from '@mui/material';

const Header = ({ baseUrl, onBaseUrlChange }) => {
  return (
    <Paper
      component="header"
      sx={{
        bgcolor: 'primary.main',
        p: 3,
        borderRadius: 1,
        mb: 3,
        boxShadow: 3
      }}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        RA Events Berlin Crawler
      </Typography>

      <Typography variant="body1" gutterBottom>
        Extrahiere Events von Resident Advisor Berlin
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          mt: 2,
          flexWrap: { xs: 'wrap', sm: 'nowrap' }
        }}
      >
        <InputLabel htmlFor="baseUrlInput" sx={{ color: 'text.primary', minWidth: { xs: '100%', sm: '80px' } }}>
          Basis-URL:
        </InputLabel>

        <TextField
          id="baseUrlInput"
          fullWidth
          variant="outlined"
          size="small"
          value={baseUrl}
          onChange={(e) => onBaseUrlChange(e.target.value)}
          placeholder="https://de.ra.co/events/de/berlin"
          sx={{
            bgcolor: 'secondary.main',
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.23)',
              },
              '&:hover fieldset': {
                borderColor: 'primary.light',
              }
            }
          }}
        />
      </Box>
    </Paper>
  );
};

export default Header;
