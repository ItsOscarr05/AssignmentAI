import React from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Tooltip,
} from "@mui/material";
import {
  Accessibility as AccessibilityIcon,
  Contrast as ContrastIcon,
  TextFields as TextFieldsIcon,
  Animation as AnimationIcon,
  RecordVoiceOver as VoiceIcon,
} from "@mui/icons-material";
import { useAccessibility } from "../contexts/AccessibilityContext";

const AccessibilityMenu = () => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const {
    highContrast,
    largeText,
    reducedMotion,
    screenReader,
    toggleHighContrast,
    toggleLargeText,
    toggleReducedMotion,
    toggleScreenReader,
  } = useAccessibility();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title="Accessibility options" arrow>
        <IconButton
          aria-label="accessibility menu"
          aria-controls="accessibility-menu"
          aria-haspopup="true"
          onClick={handleClick}
          color="inherit"
        >
          <AccessibilityIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id="accessibility-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          "aria-label": "accessibility settings",
          role: "dialog",
        }}
      >
        <MenuItem onClick={toggleHighContrast}>
          <ListItemIcon>
            <ContrastIcon />
          </ListItemIcon>
          <ListItemText
            primary="High Contrast"
            secondary="Increase color contrast for better visibility"
          />
          <Switch
            edge="end"
            checked={highContrast}
            inputProps={{
              "aria-label": "toggle high contrast",
            }}
          />
        </MenuItem>
        <MenuItem onClick={toggleLargeText}>
          <ListItemIcon>
            <TextFieldsIcon />
          </ListItemIcon>
          <ListItemText
            primary="Large Text"
            secondary="Increase text size for better readability"
          />
          <Switch
            edge="end"
            checked={largeText}
            inputProps={{
              "aria-label": "toggle large text",
            }}
          />
        </MenuItem>
        <MenuItem onClick={toggleReducedMotion}>
          <ListItemIcon>
            <AnimationIcon />
          </ListItemIcon>
          <ListItemText
            primary="Reduce Motion"
            secondary="Minimize animations and transitions"
          />
          <Switch
            edge="end"
            checked={reducedMotion}
            inputProps={{
              "aria-label": "toggle reduced motion",
            }}
          />
        </MenuItem>
        <MenuItem onClick={toggleScreenReader}>
          <ListItemIcon>
            <VoiceIcon />
          </ListItemIcon>
          <ListItemText
            primary="Screen Reader"
            secondary="Optimize for screen readers"
          />
          <Switch
            edge="end"
            checked={screenReader}
            inputProps={{
              "aria-label": "toggle screen reader optimization",
            }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default AccessibilityMenu;
