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
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { users } from "../services/api";
import { User } from "../types";

interface StudentFormData {
  email: string;
  password: string;
  full_name: string;
  role: "student" | "teacher" | "admin";
}

const Students: React.FC = () => {
  const { user } = useAuth();
  const [studentsList, setStudentsList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [formData, setFormData] = useState<StudentFormData>({
    email: "",
    password: "",
    full_name: "",
    role: "student",
  });

  const fetchStudents = async () => {
    try {
      setError(null);
      const data = await users.getAll();
      setStudentsList(data.filter((user) => user.role === "student"));
    } catch (err) {
      console.error("Failed to fetch students:", err);
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleOpenDialog = (student?: User) => {
    if (student) {
      setEditingStudent(student);
      setFormData({
        email: student.email,
        password: "",
        full_name: student.full_name,
        role: student.role,
      });
    } else {
      setEditingStudent(null);
      setFormData({
        email: "",
        password: "",
        full_name: "",
        role: "student",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStudent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const studentData = { ...formData };
      if (editingStudent) {
        // Only include password if it's not empty
        const updateData = { ...studentData };
        if (!updateData.password) {
          delete (updateData as any).password;
        }
        await users.update(editingStudent.id, updateData as Partial<User>);
        toast.success("Student updated successfully");
      } else {
        await users.create(studentData as Partial<User>);
        toast.success("Student created successfully");
      }
      handleCloseDialog();
      fetchStudents();
    } catch (err) {
      console.error("Failed to save student:", err);
      toast.error("Failed to save student");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this student?")) {
      return;
    }
    try {
      await users.delete(id);
      toast.success("Student deleted successfully");
      fetchStudents();
    } catch (err) {
      console.error("Failed to delete student:", err);
      toast.error("Failed to delete student");
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
        <h1 className="text-2xl font-bold">Students</h1>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Student
        </Button>
      </div>

      <Grid container spacing={3}>
        {studentsList.map((student) => (
          <Grid item xs={12} sm={6} md={4} key={student.id}>
            <Card>
              <CardContent>
                <div className="flex justify-between items-start">
                  <div>
                    <Typography variant="h6" component="h2">
                      {student.full_name}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      {student.email}
                    </Typography>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(student)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(student.id)}
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
          {editingStudent ? "Edit Student" : "Add Student"}
        </DialogTitle>
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
                label="Password"
                type="password"
                fullWidth
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required={!editingStudent}
              />
              <TextField
                label="Role"
                select
                fullWidth
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as "student" | "teacher" | "admin",
                  })
                }
                required
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingStudent ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default Students;
