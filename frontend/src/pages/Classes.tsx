import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { classes } from "../services/api";
import { Class } from "../types";

interface ClassFormData {
  name: string;
  subject: string;
  grade_level: string;
}

const Classes: React.FC = () => {
  const { user } = useAuth();
  const [classesList, setClassesList] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState<ClassFormData>({
    name: "",
    subject: "",
    grade_level: "",
  });

  const fetchClasses = async () => {
    try {
      setError(null);
      const data = await classes.getAll();
      setClassesList(data);
    } catch (err) {
      console.error("Failed to fetch classes:", err);
      setError("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleOpenDialog = (classItem?: Class) => {
    if (classItem) {
      setEditingClass(classItem);
      setFormData({
        name: classItem.name,
        subject: classItem.subject,
        grade_level: classItem.grade_level,
      });
    } else {
      setEditingClass(null);
      setFormData({
        name: "",
        subject: "",
        grade_level: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingClass(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await classes.update(editingClass.id, formData);
        toast.success("Class updated successfully");
      } else {
        await classes.create(formData);
        toast.success("Class created successfully");
      }
      handleCloseDialog();
      fetchClasses();
    } catch (err) {
      console.error("Failed to save class:", err);
      toast.error("Failed to save class");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this class?")) {
      return;
    }
    try {
      await classes.delete(id);
      toast.success("Class deleted successfully");
      fetchClasses();
    } catch (err) {
      console.error("Failed to delete class:", err);
      toast.error("Failed to delete class");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Classes</h1>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Create Class
        </Button>
      </div>

      <Grid container spacing={3}>
        {classesList.map((classItem) => (
          <Grid item xs={12} sm={6} md={4} key={classItem.id}>
            <Card>
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <Typography variant="h6" component="h2">
                      {classItem.name}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      {classItem.subject} - {classItem.grade_level}
                    </Typography>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(classItem)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(classItem.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingClass ? "Edit Class" : "Create Class"}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <div className="space-y-4">
              <TextField
                label="Name"
                fullWidth
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <TextField
                label="Subject"
                fullWidth
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                required
              />
              <TextField
                label="Grade Level"
                fullWidth
                value={formData.grade_level}
                onChange={(e) =>
                  setFormData({ ...formData, grade_level: e.target.value })
                }
                required
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingClass ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default Classes;
