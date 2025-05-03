import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  LinearProgress,
  Divider
} from '@mui/material';

const TopSellingItems = ({ items, title = "Meistverkaufte Getränke" }) => {
  // Ermittle den höchsten Verkaufswert für die Skalierung der Fortschrittsbalken
  const maxSales = Math.max(...items.map(item => item.sales));

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ flexGrow: 1, p: 0 }}>
        <Box p={2}>
          <Typography variant="h6" component="div" gutterBottom>
            {title}
          </Typography>
        </Box>
        
        <List sx={{ width: '100%', p: 0 }}>
          {items.map((item, index) => (
            <React.Fragment key={item.id}>
              <ListItem 
                sx={{ 
                  px: 2, 
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <ListItemText 
                      primary={item.name} 
                      secondary={item.category}
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                      secondaryTypographyProps={{ fontSize: '0.75rem' }}
                    />
                    <Typography variant="body2" fontWeight="bold" sx={{ minWidth: '80px', textAlign: 'right' }}>
                      {new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: 'EUR'
                      }).format(item.revenue)}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mt={1}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={(item.sales / maxSales) * 100}
                        sx={{ 
                          height: 10, 
                          borderRadius: 5,
                          bgcolor: 'background.paper',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            bgcolor: index < 3 ? 'primary.main' : 'secondary.main',
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: '40px' }}>
                      {item.sales} St.
                    </Typography>
                  </Box>
                </Box>
              </ListItem>
              {index < items.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
};

export default TopSellingItems;