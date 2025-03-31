import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { users } from "../services/api";

interface ProfileFormData {
  full_name: string;
  email: string;
  current_password: string;
  new_password: string;
  confirm_password: string;
}

const Settings: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: user?.full_name || "",
    email: user?.email || "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handleOpenDialog = () => {
    setFormData({
      full_name: user?.full_name || "",
      email: user?.email || "",
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.new_password !== formData.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }

    try {
      const updateData: any = {
        full_name: formData.full_name,
        email: formData.email,
      };

      if (formData.new_password) {
        updateData.password = formData.new_password;
      }

      await users.update(user!.id, updateData);
      await updateUser({ ...user!, ...updateData });
      toast.success("Profile updated successfully");
      handleCloseDialog();
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenDialog}
          >
            Edit Profile
          </Button>
        </div>

        <Card>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Typography variant="subtitle2" color="textSecondary">
                  Full Name
                </Typography>
                <Typography variant="body1">{user?.full_name}</Typography>
              </div>
              <div>
                <Typography variant="subtitle2" color="textSecondary">
                  Email
                </Typography>
                <Typography variant="body1">{user?.email}</Typography>
              </div>
              <div>
                <Typography variant="subtitle2" color="textSecondary">
                  Role
                </Typography>
                <Typography variant="body1" className="capitalize">
                  {user?.role}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <div className="space-y-4">
              <TextField
                label="Full Name"
                fullWidth
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
              />
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              <TextField
                label="Current Password"
                type="password"
                fullWidth
                value={formData.current_password}
                onChange={(e) =>
                  setFormData({ ...formData, current_password: e.target.value })
                }
                required
              />
              <TextField
                label="New Password"
                type="password"
                fullWidth
                value={formData.new_password}
                onChange={(e) =>
                  setFormData({ ...formData, new_password: e.target.value })
                }
              />
              <TextField
                label="Confirm New Password"
                type="password"
                fullWidth
                value={formData.confirm_password}
                onChange={(e) =>
                  setFormData({ ...formData, confirm_password: e.target.value })
                }
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Save Changes
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default Settings;
