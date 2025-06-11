import { faker } from '@faker-js/faker';
import '@testing-library/cypress/add-commands';
import 'cypress-file-upload';

describe('Assignment Workflow', () => {
  const teacher = {
    email: 'teacher@example.com',
    password: 'TeacherPass123!',
    name: 'Test Teacher',
    role: 'teacher',
  };

  const student = {
    email: 'student@example.com',
    password: 'StudentPass123!',
    name: 'Test Student',
    role: 'student',
  };

  const assignment = {
    title: faker.lorem.words(3),
    description: faker.lorem.paragraph(),
    dueDate: faker.date.future().toISOString().split('T')[0],
    maxScore: 100,
  };

  before(() => {
    // Create test users
    cy.request('POST', '/api/auth/register', teacher);
    cy.request('POST', '/api/auth/register', student);
  });

  describe('Assignment Creation', () => {
    beforeEach(() => {
      cy.login(teacher);
    });

    it('should create a new assignment', () => {
      cy.visit('/assignments/new');

      // Fill in assignment form
      cy.get('input[name="title"]').type(assignment.title);
      cy.get('textarea[name="description"]').type(assignment.description);
      cy.get('input[name="dueDate"]').type(assignment.dueDate);
      cy.get('input[name="maxScore"]').type(assignment.maxScore.toString());

      // Submit form
      cy.get('button[type="submit"]').click();

      // Verify assignment was created
      cy.url().should('match', /\/assignments\/[\w-]+$/);
      cy.contains(assignment.title).should('be.visible');
      cy.contains(assignment.description).should('be.visible');
    });

    it('should show validation errors for invalid assignment', () => {
      cy.visit('/assignments/new');

      // Try to submit empty form
      cy.get('button[type="submit"]').click();

      // Check validation messages
      cy.contains('Title is required').should('be.visible');
      cy.contains('Description is required').should('be.visible');
      cy.contains('Due date is required').should('be.visible');
      cy.contains('Max score is required').should('be.visible');

      // Try invalid max score
      cy.get('input[name="maxScore"]').type('-1');
      cy.contains('Score must be positive').should('be.visible');

      // Try past due date
      const pastDate = faker.date.past().toISOString().split('T')[0];
      cy.get('input[name="dueDate"]').type(pastDate);
      cy.contains('Due date must be in the future').should('be.visible');
    });
  });

  describe('Assignment Submission', () => {
    beforeEach(() => {
      // Create an assignment first
      cy.login(teacher);
      cy.request('POST', '/api/assignments', assignment).then(response => {
        cy.wrap(response.body.id).as('assignmentId');
      });
      cy.login(student);
    });

    it('should submit an assignment', () => {
      cy.get('@assignmentId').then(assignmentId => {
        cy.visit(`/assignments/${assignmentId}`);

        // Upload file
        cy.get('input[type="file"]').attachFile({
          fileContent: new Blob(['test content'], { type: 'text/plain' }),
          fileName: 'submission.txt',
          mimeType: 'text/plain',
        });

        // Add comment
        cy.get('textarea[name="comment"]').type('Here is my submission');

        // Submit assignment
        cy.get('button[type="submit"]').click();

        // Verify submission
        cy.contains('Submission successful').should('be.visible');
        cy.contains('submission.txt').should('be.visible');
      });
    });

    it('should handle file validation', () => {
      cy.get('@assignmentId').then(assignmentId => {
        cy.visit(`/assignments/${assignmentId}`);

        // Try to upload invalid file type
        cy.get('input[type="file"]').attachFile({
          fileContent: new Blob(['test content'], { type: 'application/x-msdownload' }),
          fileName: 'malicious.exe',
          mimeType: 'application/x-msdownload',
        });

        // Check error message
        cy.contains('Invalid file type').should('be.visible');
      });
    });
  });

  describe('Assignment Grading', () => {
    beforeEach(() => {
      // Create assignment and submission
      cy.login(teacher);
      cy.request('POST', '/api/assignments', assignment).then(response => {
        const assignmentId = response.body.id;
        cy.login(student);
        cy.request('POST', `/api/assignments/${assignmentId}/submit`, {
          files: [],
          comment: 'Test submission',
        }).then(response => {
          cy.wrap(response.body.id).as('submissionId');
        });
        cy.login(teacher);
      });
    });

    it('should grade a submission', () => {
      cy.get('@submissionId').then(submissionId => {
        cy.visit(`/submissions/${submissionId}`);

        // Enter grade
        cy.get('input[name="grade"]').type('85');

        // Enter feedback
        cy.get('textarea[name="feedback"]').type('Good work!');

        // Submit grade
        cy.get('button[type="submit"]').click();

        // Verify grade was submitted
        cy.contains('Grade submitted').should('be.visible');
        cy.contains('85/100').should('be.visible');
        cy.contains('Good work!').should('be.visible');
      });
    });

    it('should handle invalid grades', () => {
      cy.get('@submissionId').then(submissionId => {
        cy.visit(`/submissions/${submissionId}`);

        // Try invalid grade
        cy.get('input[name="grade"]').type('150');
        cy.get('button[type="submit"]').click();

        // Check error message
        cy.contains('Grade must be between 0 and 100').should('be.visible');
      });
    });
  });

  describe('Assignment List and Filters', () => {
    beforeEach(() => {
      cy.login(student);
    });

    it('should filter and sort assignments', () => {
      cy.visit('/assignments');

      // Test search
      cy.get('input[name="search"]').type(assignment.title);
      cy.contains(assignment.title).should('be.visible');

      // Test status filter
      cy.get('select[name="status"]').select('pending');
      cy.contains('No assignments found').should('not.exist');

      // Test sorting
      cy.get('select[name="sortBy"]').select('dueDate');
      cy.get('button[name="sortDirection"]').click();
    });

    it('should show assignment details', () => {
      cy.visit('/assignments');

      // Click on assignment
      cy.contains(assignment.title).click();

      // Verify details
      cy.url().should('include', '/assignments/');
      cy.contains(assignment.title).should('be.visible');
      cy.contains(assignment.description).should('be.visible');
      cy.contains(new RegExp(assignment.dueDate)).should('be.visible');
    });
  });
});
