import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import EventCard from './EventCard';

const EventsContainer = ({ events }) => {
  if (events.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 5 }}>
        <Typography variant="body1">
          Keine Events gefunden, die den Filterkriterien entsprechen.
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3} className="events-grid">
      {events.map((event) => (
        <Grid item xs={12} sm={6} md={4} key={event.id}>
          <EventCard event={event} />
        </Grid>
      ))}
    </Grid>
  );
};

export default EventsContainer;
