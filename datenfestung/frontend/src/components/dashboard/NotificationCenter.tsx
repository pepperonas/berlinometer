import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
  Box,
  Button,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  MarkEmailRead,
  Close,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Notification } from '../../types/dashboard.types';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead?: (id: number) => void;
  onDismiss?: (id: number) => void;
  onViewAll?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onDismiss,
  onViewAll,
}) => {
  const getNotificationIcon = (type: string, priority: string) => {
    const iconProps = { fontSize: 'small' as const };
    
    switch (type) {
      case 'contract_expiry':
        return <ScheduleIcon {...iconProps} />;
      case 'task_due':
        return <WarningIcon {...iconProps} />;
      case 'system_alert':
        return priority === 'urgent' ? <ErrorIcon {...iconProps} /> : <InfoIcon {...iconProps} />;
      default:
        return <InfoIcon {...iconProps} />;
    }
  };

  const getNotificationColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Dringend';
      case 'high':
        return 'Hoch';
      case 'medium':
        return 'Mittel';
      default:
        return 'Niedrig';
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const displayNotifications = notifications.slice(0, 5);

  return (
    <Card>
      <CardHeader
        title="Benachrichtigungen"
        titleTypographyProps={{ variant: 'h6' }}
        action={
          unreadNotifications.length > 0 && (
            <Chip
              label={unreadNotifications.length}
              color="error"
              size="small"
            />
          )
        }
      />
      <CardContent sx={{ pt: 0 }}>
        {displayNotifications.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Keine neuen Benachrichtigungen
            </Typography>
          </Box>
        ) : (
          <>
            <List disablePadding>
              {displayNotifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  disablePadding
                  sx={{
                    border: '1px solid',
                    borderColor: notification.isRead ? 'transparent' : 'primary.main',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: notification.isRead ? 'transparent' : 'primary.50',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItem>
                    <ListItemIcon>
                      {getNotificationIcon(notification.type, notification.priority)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="subtitle2" component="span">
                            {notification.title}
                          </Typography>
                          <Chip
                            label={getPriorityLabel(notification.priority)}
                            color={getNotificationColor(notification.priority)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(new Date(notification.createdAt), {
                              addSuffix: true,
                              locale: de,
                            })}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {!notification.isRead && onMarkAsRead && (
                          <IconButton
                            size="small"
                            onClick={() => onMarkAsRead(notification.id)}
                            title="Als gelesen markieren"
                          >
                            <MarkEmailRead fontSize="small" />
                          </IconButton>
                        )}
                        {onDismiss && (
                          <IconButton
                            size="small"
                            onClick={() => onDismiss(notification.id)}
                            title="Schließen"
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                </ListItem>
              ))}
            </List>
            
            {notifications.length > 5 && onViewAll && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button variant="outlined" size="small" onClick={onViewAll}>
                  Alle anzeigen ({notifications.length})
                </Button>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};