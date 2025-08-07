import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Link,
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  Instagram as InstagramIcon,
  VideoFile as VideoFileIcon
} from '@mui/icons-material';

// Custom theme with the requested color scheme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ffffff',
      contrastText: '#2C2E3B'
    },
    secondary: {
      main: '#E1306C', // Instagram pink
    },
    background: {
      default: '#2C2E3B',
      paper: '#363846'
    },
    text: {
      primary: '#ffffff',
      secondary: '#B0B3B8'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#ffffff'
    },
    h6: {
      color: '#B0B3B8'
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#B0B3B8',
            },
            '&:hover fieldset': {
              borderColor: '#ffffff',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#ffffff',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#B0B3B8',
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: '#ffffff',
          },
        },
      },
    },
  },
});

function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateInstagramUrl = (url) => {
    const instagramRegex = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?/;
    return instagramRegex.test(url);
  };

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Please enter an Instagram video URL');
      return;
    }

    if (!validateInstagramUrl(url)) {
      setError('Please enter a valid Instagram video URL (posts, reels, or IGTV)');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/suckinsta/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Download failed');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'instagram_video.mp4';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setSuccess('Video downloaded successfully!');
      setUrl(''); // Clear the input field
    } catch (err) {
      console.error('Download error:', err);
      setError(err.message || 'An error occurred while downloading the video');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !loading) {
      handleDownload();
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
              <InstagramIcon sx={{ fontSize: 40, color: '#E1306C', mr: 1 }} />
              <VideoFileIcon sx={{ fontSize: 40, color: '#ffffff', ml: 1 }} />
            </Box>
            <Typography variant="h4" gutterBottom>
              Suckinsta
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Download Instagram videos and reels quickly and easily
            </Typography>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Input Section */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Instagram Video URL"
              placeholder="https://www.instagram.com/p/your-video-id/"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              variant="outlined"
              sx={{ mb: 2 }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleDownload}
              disabled={loading || !url.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
              sx={{ 
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: 'linear-gradient(45deg, #E1306C 30%, #F56040 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #C13584 30%, #E1306C 90%)',
                },
                '&:disabled': {
                  background: '#555',
                  color: '#888'
                }
              }}
            >
              {loading ? 'Downloading...' : 'Download Video'}
            </Button>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Instructions */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              How to use:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              1. Copy the URL of an Instagram video, reel, or IGTV post
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              2. Paste the URL in the field above
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              3. Click "Download Video" and the file will be saved to your device
            </Typography>
            
            
            <Typography variant="body2" color="text.secondary">
              Made with ❤️ for{' '}
              <Link 
                href="https://mrx3k1.de" 
                color="secondary" 
                underline="hover"
                target="_blank"
                rel="noopener noreferrer"
              >
                mrx3k1.de
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

export default App;