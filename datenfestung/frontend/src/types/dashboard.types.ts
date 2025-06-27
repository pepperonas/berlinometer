export interface DashboardStats {
  totalProcessingActivities: number;
  activeTasks: number;
  overdueTasks: number;
  expiringContracts: number;
  completedTrainings: number;
  totalUsers: number;
  complianceScore: number;
}

export interface DashboardWidget {
  id: string;
  title: string;
  value: number | string;
  type: 'number' | 'percentage' | 'status';
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
  };
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  icon: string;
  description?: string;
}

export interface RecentActivity {
  id: number;
  type: 'processing_activity' | 'task' | 'contract' | 'training' | 'user';
  action: 'created' | 'updated' | 'deleted' | 'completed' | 'expired';
  title: string;
  description: string;
  user: string;
  timestamp: string;
  entityId?: number;
}

export interface Notification {
  id: number;
  type: 'contract_expiry' | 'task_due' | 'system_alert' | 'training_reminder';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isRead: boolean;
  relatedEntityType?: string;
  relatedEntityId?: number;
  createdAt: string;
}

export interface UpcomingDeadline {
  id: number;
  type: 'contract' | 'task' | 'review' | 'training';
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  entityId: number;
}

export interface ComplianceMetric {
  category: string;
  score: number;
  maxScore: number;
  status: 'compliant' | 'partially_compliant' | 'non_compliant';
  issues: string[];
  recommendations: string[];
}

export interface DashboardState {
  stats: DashboardStats | null;
  widgets: DashboardWidget[];
  recentActivities: RecentActivity[];
  notifications: Notification[];
  upcomingDeadlines: UpcomingDeadline[];
  complianceMetrics: ComplianceMetric[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}