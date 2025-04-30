import React from 'react';
import { Card, CardContent, Typography, Box, Link, Chip } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import HeadsetIcon from '@mui/icons-material/Headset';

const EventCard = ({ event }) => {
  // Datum formatieren
  const formatDate = (dateString) => {
    const eventDate = new Date(dateString);
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return eventDate.toLocaleDateString('de-DE', options);
  };

  // Zeitinfo formatieren
  const formatTimeInfo = () => {
    let timeInfo = '';
    if (event.startTime) {
      timeInfo = `, ${event.startTime}`;
      if (event.endTime) {
        timeInfo += ` - ${event.endTime}`;
      }
      if (event.endDate) {
        const endDate = new Date(event.endDate);
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        timeInfo += ` (bis ${endDate.toLocaleDateString('de-DE', options)})`;
      }
    }
    return timeInfo;
  };

  return (
    <Card
      className="event-card"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          variant="subtitle1"
          component="div"
          color="error.main"
          sx={{
            display: 'flex',
            alignItems: 'center',
            fontWeight: 'bold',
            mb: 1
          }}
        >
          <CalendarTodayIcon fontSize="small" sx={{ mr: 1 }} />
          {formatDate(event.date)}
          {formatTimeInfo()}
        </Typography>

        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 'bold',
            mb: 2,
            lineHeight: 1.3,
            height: '3.9em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {event.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            fontStyle: 'italic',
            mb: 2,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <LocationOnIcon fontSize="small" sx={{ mr: 1 }} />
          {event.venue}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <PeopleIcon fontSize="small" sx={{ mr: 1, color: 'error.main' }} />
          <Chip
            label={`${event.interestedCount} Interessierte`}
            size="small"
            sx={{
              bgcolor: 'rgba(255, 72, 72, 0.1)',
              color: 'error.light',
              borderRadius: 1
            }}
          />
        </Box>

        {event.artists && event.artists.length > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <HeadsetIcon fontSize="small" sx={{ mr: 1, mt: 0.5 }} />
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {event.artists.join(', ')}
            </Typography>
          </Box>
        )}

        {event.genre && event.genre.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            <MusicNoteIcon fontSize="small" sx={{ mr: 0.5 }} />
            {event.genre.map((genre) => (
              <Chip
                key={genre}
                label={genre}
                size="small"
                sx={{ bgcolor: 'secondary.main', fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        )}
      </CardContent>

      <Box sx={{ p: 2, pt: 0 }}>
        <Link
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: 'block',
            textAlign: 'center',
            bgcolor: 'secondary.main',
            color: 'text.primary',
            textDecoration: 'none',
            p: 1,
            borderRadius: 1,
            transition: 'background-color 0.3s',
            '&:hover': {
              bgcolor: 'error.main',
            },
          }}
        >
          Auf RA ansehen
        </Link>
      </Box>
    </Card>
  );
};

export default EventCard;
