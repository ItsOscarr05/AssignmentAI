import React from "react";
import { Route, Routes } from "react-router-dom";
import { SubmissionDetail } from "./SubmissionDetail";
import { SubmissionForm } from "./SubmissionForm";
import { SubmissionList } from "./SubmissionList";

export const SubmissionRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<SubmissionList />} />
      <Route path="/new" element={<SubmissionForm />} />
      <Route path="/:id" element={<SubmissionDetail />} />
      <Route path="/:id/edit" element={<SubmissionForm />} />
    </Routes>
  );
};
