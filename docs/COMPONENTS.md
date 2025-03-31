# AssignmentAI Component Documentation

## Overview

This document provides detailed documentation for all React components in the AssignmentAI application. Each component is documented with its props, usage examples, and best practices.

## Core Components

### AssignmentCard

A reusable card component for displaying assignment information.

```typescript
interface AssignmentCardProps {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: "pending" | "completed" | "overdue";
  priority: "low" | "medium" | "high";
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: string) => void;
}
```

Usage:

```tsx
<AssignmentCard
  id="123"
  title="Research Paper"
  description="Write a research paper on AI ethics"
  dueDate={new Date("2024-04-01")}
  status="pending"
  priority="high"
  onEdit={(id) => handleEdit(id)}
  onDelete={(id) => handleDelete(id)}
  onStatusChange={(id, status) => handleStatusChange(id, status)}
/>
```

### SubmissionForm

A form component for submitting assignments.

```typescript
interface SubmissionFormProps {
  assignmentId: string;
  onSubmit: (data: SubmissionData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<SubmissionData>;
}
```

Usage:

```tsx
<SubmissionForm
  assignmentId="123"
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  initialData={{
    content: "Initial submission content",
  }}
/>
```

### NavigationBar

The main navigation component.

```typescript
interface NavigationBarProps {
  user: User;
  onLogout: () => void;
  onProfileClick: () => void;
}
```

Usage:

```tsx
<NavigationBar
  user={currentUser}
  onLogout={handleLogout}
  onProfileClick={handleProfileClick}
/>
```

## Form Components

### InputField

A reusable input field component with validation.

```typescript
interface InputFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "number";
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}
```

Usage:

```tsx
<InputField
  label="Title"
  name="title"
  value={title}
  onChange={handleTitleChange}
  error={errors.title}
  required
/>
```

### DatePicker

A date picker component with validation.

```typescript
interface DatePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  error?: string;
  required?: boolean;
}
```

Usage:

```tsx
<DatePicker
  label="Due Date"
  value={dueDate}
  onChange={handleDateChange}
  minDate={new Date()}
  error={errors.dueDate}
  required
/>
```

## Layout Components

### Container

A responsive container component.

```typescript
interface ContainerProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  padding?: "none" | "small" | "medium" | "large";
}
```

Usage:

```tsx
<Container maxWidth="lg" padding="medium">
  <h1>Content</h1>
  <p>More content...</p>
</Container>
```

### Grid

A responsive grid component.

```typescript
interface GridProps {
  children: React.ReactNode;
  columns?: number;
  gap?: "small" | "medium" | "large";
  responsive?: boolean;
}
```

Usage:

```tsx
<Grid columns={3} gap="medium" responsive>
  <AssignmentCard {...assignment1} />
  <AssignmentCard {...assignment2} />
  <AssignmentCard {...assignment3} />
</Grid>
```

## Feedback Components

### Toast

A toast notification component.

```typescript
interface ToastProps {
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
  onClose: () => void;
}
```

Usage:

```tsx
<Toast
  message="Assignment saved successfully!"
  type="success"
  duration={3000}
  onClose={handleClose}
/>
```

### LoadingSpinner

A loading indicator component.

```typescript
interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  color?: string;
  text?: string;
}
```

Usage:

```tsx
<LoadingSpinner size="medium" color="#007bff" text="Loading assignments..." />
```

## Modal Components

### Modal

A reusable modal component.

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}
```

Usage:

```tsx
<Modal isOpen={isModalOpen} onClose={handleClose} title="Edit Assignment">
  <form onSubmit={handleSubmit}>{/* Form content */}</form>
  <div className="modal-footer">
    <button onClick={handleClose}>Cancel</button>
    <button type="submit">Save</button>
  </div>
</Modal>
```

### ConfirmationDialog

A confirmation dialog component.

```typescript
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}
```

Usage:

```tsx
<ConfirmationDialog
  isOpen={isDialogOpen}
  onClose={handleClose}
  onConfirm={handleConfirm}
  title="Delete Assignment"
  message="Are you sure you want to delete this assignment?"
  confirmText="Delete"
  cancelText="Cancel"
/>
```

## Best Practices

1. **Component Organization**

   - Keep components small and focused
   - Use composition over inheritance
   - Follow the single responsibility principle

2. **Props**

   - Use TypeScript interfaces for prop types
   - Make props required when necessary
   - Provide default values when appropriate
   - Document prop types and descriptions

3. **State Management**

   - Use local state for component-specific data
   - Lift state up when needed
   - Consider using context for global state
   - Implement proper state updates

4. **Performance**

   - Use React.memo for expensive components
   - Implement proper key props
   - Avoid unnecessary re-renders
   - Use lazy loading for large components

5. **Accessibility**

   - Include proper ARIA labels
   - Ensure keyboard navigation
   - Maintain proper heading hierarchy
   - Provide alt text for images

6. **Error Handling**

   - Implement proper error boundaries
   - Provide meaningful error messages
   - Handle edge cases gracefully
   - Log errors appropriately

7. **Testing**

   - Write unit tests for components
   - Test edge cases and error states
   - Use proper test utilities
   - Maintain test coverage

8. **Styling**

   - Use consistent naming conventions
   - Implement responsive design
   - Follow design system guidelines
   - Use CSS-in-JS or CSS modules

9. **Documentation**

   - Document component usage
   - Provide code examples
   - Include prop descriptions
   - Document edge cases

10. **Maintenance**
    - Keep components up to date
    - Remove unused code
    - Update dependencies
    - Follow version control best practices
