import React from 'react';
import { Alert } from '@mui/material';

const Message = ({ text, type }) => {
  if (!text) return null;

  return (
    <Alert
      severity={type === 'success' ? 'success' : 'error'}
      sx={{
        mb: 3,
        bgcolor: type === 'success' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(231, 76, 60, 0.15)',
        color: type === 'success' ? '#2ecc71' : '#e74c3c'
      }}
    >
      {text}
    </Alert>
  );
};

export default Message;
