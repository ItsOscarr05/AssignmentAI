import {
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import React from 'react';

export type WidgetType = 'metric' | 'chart' | 'list' | 'custom';

export interface WidgetConfig {
  id: string;
  title: string;
  type: WidgetType;
  size: 'small' | 'medium' | 'large';
  position: number;
  refreshInterval?: number;
  config?: Record<string, any>;
}

interface DashboardWidgetProps {
  config: WidgetConfig;
  onRefresh?: () => void;
  onConfigure?: (widgetId: string) => void;
  onRemove?: (widgetId: string) => void;
  children: React.ReactNode;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  config,
  onRefresh,
  onConfigure,
  onRemove,
  children,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRefresh = () => {
    onRefresh?.();
    handleMenuClose();
  };

  const handleConfigure = () => {
    onConfigure?.(config.id);
    handleMenuClose();
  };

  const handleRemove = () => {
    onRemove?.(config.id);
    handleMenuClose();
  };

  const getSizeStyles = () => {
    switch (config.size) {
      case 'small':
        return { width: '300px', height: '200px' };
      case 'medium':
        return { width: '450px', height: '300px' };
      case 'large':
        return { width: '600px', height: '400px' };
      default:
        return { width: '300px', height: '200px' };
    }
  };

  return (
    <Card
      sx={{
        ...getSizeStyles(),
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 3,
        },
      }}
    >
      <CardHeader
        title={config.title}
        action={
          <Box>
            {onRefresh && (
              <Tooltip title="Refresh">
                <IconButton onClick={handleRefresh} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={handleMenuOpen} size="small">
              <MoreVertIcon />
            </IconButton>
          </Box>
        }
      />
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {onConfigure && (
          <MenuItem onClick={handleConfigure}>
            <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
            Configure
          </MenuItem>
        )}
        {onRemove && (
          <MenuItem onClick={handleRemove}>
            <Typography color="error">Remove Widget</Typography>
          </MenuItem>
        )}
      </Menu>
      <CardContent sx={{ flex: 1, overflow: 'auto' }}>{children}</CardContent>
    </Card>
  );
};

export default DashboardWidget;
