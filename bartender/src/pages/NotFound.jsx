import React from 'react';
import { Box, Button, Typography, Container, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

const NotFound = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: '10rem',
              fontWeight: '700',
              color: theme.palette.primary.main,
              textShadow: `4px 4px 0px ${theme.palette.primary.light}`,
              mb: 2,
              [theme.breakpoints.down('sm')]: {
                fontSize: '6rem',
              },
            }}
          >
            404
          </Typography>

          <Typography
            variant="h4"
            component="h2"
            sx={{
              fontWeight: '600',
              mb: 2,
            }}
          >
            Seite nicht gefunden
          </Typography>

          <Typography 
            variant="subtitle1" 
            color="text.secondary"
            sx={{ 
              mb: 4,
              maxWidth: '600px',
            }}
          >
            Die von Ihnen gesuchte Seite existiert nicht oder wurde verschoben.
            Es könnte sich um einen abgelaufenen Link handeln oder um eine falsch eingegebene URL.
          </Typography>

          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{
              py: 1.5,
              px: 4,
              fontSize: '1rem',
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            Zurück zur Startseite
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default NotFound;