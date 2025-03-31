import {
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Publish as PublishIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Menu,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Assignment,
  AssignmentFilters,
  AssignmentSort,
} from "../../types/assignment";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { Pagination } from "../common/Pagination";
import { Search } from "../common/Search";
import { Toast } from "../common/Toast";

const ITEMS_PER_PAGE = 10;

const AssignmentList: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<AssignmentFilters>({});
  const [sort, setSort] = useState<AssignmentSort>({
    field: "dueDate",
    direction: "asc",
  });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    fetchAssignments();
  }, [page, filters, sort]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch("/api/assignments");
      const data = await response.json();
      setAssignments(data.assignments);
      setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
    } catch (err) {
      setError("Failed to fetch assignments");
      setToast({
        open: true,
        message: "Failed to fetch assignments",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    assignment: Assignment
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedAssignment(assignment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedAssignment(null);
  };

  const handleDelete = async () => {
    if (!selectedAssignment) return;

    try {
      // TODO: Replace with actual API call
      await fetch(`/api/assignments/${selectedAssignment.id}`, {
        method: "DELETE",
      });
      setToast({
        open: true,
        message: "Assignment deleted successfully",
        severity: "success",
      });
      fetchAssignments();
    } catch (err) {
      setToast({
        open: true,
        message: "Failed to delete assignment",
        severity: "error",
      });
    } finally {
      setDeleteDialogOpen(false);
      handleMenuClose();
    }
  };

  const handleStatusChange = async (newStatus: Assignment["status"]) => {
    if (!selectedAssignment) return;

    try {
      // TODO: Replace with actual API call
      await fetch(`/api/assignments/${selectedAssignment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });
      setToast({
        open: true,
        message: `Assignment ${newStatus} successfully`,
        severity: "success",
      });
      fetchAssignments();
    } catch (err) {
      setToast({
        open: true,
        message: `Failed to ${newStatus} assignment`,
        severity: "error",
      });
    } finally {
      handleMenuClose();
    }
  };

  const getStatusColor = (status: Assignment["status"]) => {
    switch (status) {
      case "draft":
        return "default";
      case "published":
        return "success";
      case "archived":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate("/assignments/new")}
        >
          Create Assignment
        </Button>
        <Search
          onSearch={(query) => setFilters({ ...filters, search: query })}
          placeholder="Search assignments..."
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filters.status || ""}
            label="Status"
            onChange={(e) =>
              setFilters({
                ...filters,
                status: e.target.value as Assignment["status"],
              })
            }
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="published">Published</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      <Grid container spacing={3}>
        {assignments.map((assignment) => (
          <Grid item xs={12} sm={6} md={4} key={assignment.id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Typography variant="h6" component="div" gutterBottom>
                    {assignment.title}
                  </Typography>
                  <IconButton onClick={(e) => handleMenuClick(e, assignment)}>
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                <Typography color="text.secondary" gutterBottom>
                  Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {assignment.description}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    label={assignment.status}
                    color={getStatusColor(assignment.status)}
                    size="small"
                  />
                  {assignment.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={assignments.length}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() =>
            navigate(`/assignments/${selectedAssignment?.id}/edit`)
          }
        >
          <EditIcon sx={{ mr: 1 }} /> Edit
        </MenuItem>
        {selectedAssignment?.status === "draft" && (
          <MenuItem onClick={() => handleStatusChange("published")}>
            <PublishIcon sx={{ mr: 1 }} /> Publish
          </MenuItem>
        )}
        {selectedAssignment?.status === "published" && (
          <MenuItem onClick={() => handleStatusChange("archived")}>
            <ArchiveIcon sx={{ mr: 1 }} /> Archive
          </MenuItem>
        )}
        <MenuItem onClick={() => setDeleteDialogOpen(true)}>
          <DeleteIcon sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Assignment"
        content="Are you sure you want to delete this assignment? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast({ ...toast, open: false })}
      />
    </Box>
  );
};

export default AssignmentList;
