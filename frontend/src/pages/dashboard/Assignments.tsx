import { Container, Typography } from '@mui/material';
import React, { Suspense, lazy, useCallback, useMemo, useState } from 'react';
import { useAssignmentsStore } from '../../services/AssignmentsService';
import { Assignment } from '../../types';

// Lazy load large components
const AssignmentCreate = lazy(() => import('../../components/assignments/AssignmentCreate'));
const AssignmentDetail = lazy(() => import('../../components/assignments/AssignmentDetail'));
const AssignmentEdit = lazy(() =>
  import('../../components/assignments/AssignmentEdit').then(module => ({
    default: module.default,
  }))
);
const AssignmentList = lazy(() => import('../../components/assignments/AssignmentList'));
const BulkCreateDialog = lazy(() => import('../../components/assignments/BulkCreateDialog'));
const NewAssignmentDialog = lazy(() => import('../../components/assignments/NewAssignmentDialog'));

type View = 'list' | 'detail' | 'create' | 'edit';

const Assignments = () => {
  const [view, setView] = useState<View>('list');
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
  const { deleteAssignment } = useAssignmentsStore();

  const handleDelete = useCallback(
    (assignment: Assignment) => {
      deleteAssignment(assignment.id);
    },
    [deleteAssignment]
  );

  const mockTemplates = useMemo(
    () => [
      {
        id: '1',
        title: 'Standard Assignment',
        description: 'A standard individual assignment',
        type: 'individual' as const,
        defaultMaxGrade: 100,
      },
      {
        id: '2',
        title: 'Group Project',
        description: 'A collaborative group project',
        type: 'group' as const,
        defaultMaxGrade: 100,
      },
    ],
    []
  );

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom>
        Assignments
      </Typography>

      <Suspense fallback={<div>Loading...</div>}>
        {view === 'list' && <AssignmentList onDelete={handleDelete} />}
        {view === 'detail' && <AssignmentDetail />}
        {view === 'create' && <AssignmentCreate />}
        {view === 'edit' && <AssignmentEdit />}
      </Suspense>

      <Suspense fallback={<div>Loading...</div>}>
        <NewAssignmentDialog open={isNewDialogOpen} onClose={() => setIsNewDialogOpen(false)} />
      </Suspense>

      <Suspense fallback={<div>Loading...</div>}>
        <BulkCreateDialog
          open={isBulkCreateOpen}
          onClose={() => setIsBulkCreateOpen(false)}
          onSave={() => {
            setIsBulkCreateOpen(false);
            setView('list');
          }}
          templates={mockTemplates}
        />
      </Suspense>
    </Container>
  );
};

export default React.memo(Assignments);
