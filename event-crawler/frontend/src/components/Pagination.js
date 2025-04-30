import React from 'react';
import { Box, Button } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const Pagination = ({ currentPage, hasMorePages, onPageChange }) => {
  const maxVisiblePages = 5;
  const totalPages = Math.max(currentPage, 5); // Mindestens 5 Seiten anzeigen

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // Array mit allen anzuzeigenden Seitenzahlen erstellen
  const pages = [];

  // Erste Seite
  if (startPage > 1) {
    pages.push({ label: '1', page: 1 });
    if (startPage > 2) {
      pages.push({ label: '...', page: null, disabled: true });
    }
  }

  // Mittlere Seiten
  for (let i = startPage; i <= endPage; i++) {
    pages.push({ label: i.toString(), page: i, active: i === currentPage });
  }

  // Letzte Seite
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push({ label: '...', page: null, disabled: true });
    }
    pages.push({ label: totalPages.toString(), page: totalPages });
  }

  // "Weiter"-Button
  if (hasMorePages) {
    pages.push({ label: <NavigateNextIcon />, page: currentPage + 1, isNext: true });
  }

  return (
    <Box
      className="pagination"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 1,
        mt: 3
      }}
    >
      {pages.map((item, index) => (
        <Button
          key={`page-${index}`}
          variant={item.active ? 'contained' : 'outlined'}
          color={item.active ? 'error' : 'secondary'}
          disabled={item.disabled || (item.isNext && !hasMorePages)}
          onClick={() => item.page && onPageChange(item.page)}
          sx={{
            minWidth: 40,
            height: 40,
            p: 0
          }}
        >
          {item.label}
        </Button>
      ))}
    </Box>
  );
};

export default Pagination;
