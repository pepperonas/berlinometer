import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const Loader = () => {
  return (
    <Box className="loader" sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
      <CircularProgress color="error" />
    </Box>
  );
};

export default Loader;
