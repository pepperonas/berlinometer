import React from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';

const FilterBar = ({ filters, venues, onFilterChange, onFetchEvents, onLoadAllEvents }) => {
  return (
    <Box
      className="filter-bar"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2,
        mb: 3,
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <FormControl sx={{ minWidth: 140 }} size="small">
        <InputLabel id="date-filter-label">Datum</InputLabel>
        <Select
          labelId="date-filter-label"
          id="date-filter"
          value={filters.date}
          label="Datum"
          onChange={(e) => onFilterChange('date', e.target.value)}
          sx={{ bgcolor: 'secondary.main' }}
        >
          <MenuItem value="all">Alle Daten</MenuItem>
          <MenuItem value="today">Heute</MenuItem>
          <MenuItem value="tomorrow">Morgen</MenuItem>
          <MenuItem value="weekend">Dieses Wochenende</MenuItem>
          <MenuItem value="week">Diese Woche</MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 140 }} size="small">
        <InputLabel id="genre-filter-label">Genre</InputLabel>
        <Select
          labelId="genre-filter-label"
          id="genre-filter"
          value={filters.genre}
          label="Genre"
          onChange={(e) => onFilterChange('genre', e.target.value)}
          sx={{ bgcolor: 'secondary.main' }}
        >
          <MenuItem value="all">Alle Genres</MenuItem>
          <MenuItem value="techno">Techno</MenuItem>
          <MenuItem value="house">House</MenuItem>
          <MenuItem value="electro">Electro</MenuItem>
          <MenuItem value="disco">Disco</MenuItem>
          <MenuItem value="ambient">Ambient</MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 140 }} size="small">
        <InputLabel id="venue-filter-label">Venue</InputLabel>
        <Select
          labelId="venue-filter-label"
          id="venue-filter"
          value={filters.venue}
          label="Venue"
          onChange={(e) => onFilterChange('venue', e.target.value)}
          sx={{ bgcolor: 'secondary.main' }}
        >
          <MenuItem value="all">Alle Venues</MenuItem>
          {venues.map((venue) => (
            <MenuItem key={venue} value={venue}>
              {venue}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        variant="outlined"
        size="small"
        placeholder="Suche nach Events, Künstlern..."
        value={filters.search}
        onChange={(e) => onFilterChange('search', e.target.value)}
        sx={{
          flexGrow: 1,
          minWidth: { xs: '100%', sm: '200px' },
          bgcolor: 'secondary.main'
        }}
        InputProps={{
          startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
        }}
      />

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="error"
          onClick={onFetchEvents}
          startIcon={<RefreshIcon />}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Events laden
        </Button>

        <Button
          variant="contained"
          color="secondary"
          onClick={onLoadAllEvents}
          startIcon={<AllInclusiveIcon />}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Alles laden
        </Button>
      </Box>
    </Box>
  );
};

export default FilterBar;
