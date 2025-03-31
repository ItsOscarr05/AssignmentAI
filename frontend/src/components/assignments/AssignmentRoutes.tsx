import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AssignmentDetail from "./AssignmentDetail";
import AssignmentForm from "./AssignmentForm";
import AssignmentList from "./AssignmentList";

const AssignmentRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AssignmentList />} />
      <Route path="/new" element={<AssignmentForm />} />
      <Route path="/:id" element={<AssignmentDetail />} />
      <Route path="/:id/edit" element={<AssignmentForm />} />
      <Route path="*" element={<Navigate to="/assignments" replace />} />
    </Routes>
  );
};

export default AssignmentRoutes;
