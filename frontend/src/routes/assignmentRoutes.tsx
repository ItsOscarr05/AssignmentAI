import React from "react";
import { Route, Routes } from "react-router-dom";
import { AssignmentForm } from "../components/assignments/AssignmentForm";
import { AssignmentList } from "../components/assignments/AssignmentList";

export const AssignmentRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AssignmentList />} />
      <Route path="/new" element={<AssignmentForm />} />
      <Route path="/:id/edit" element={<AssignmentForm />} />
    </Routes>
  );
};
