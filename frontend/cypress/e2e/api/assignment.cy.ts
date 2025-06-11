import { faker } from '@faker-js/faker';

describe('Assignment API', () => {
  const teacher = {
    email: faker.internet.email(),
    password: 'TestPass123!',
    name: faker.person.fullName(),
    role: 'teacher',
  };

  const student = {
    email: faker.internet.email(),
    password: 'TestPass123!',
    name: faker.person.fullName(),
    role: 'student',
  };

  let teacherToken: string;
  let studentToken: string;
  let assignmentId: string;

  before(() => {
    // Create test users
    cy.request('POST', '/api/auth/register', teacher);
    cy.request('POST', '/api/auth/register', student);

    // Login as teacher
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        email: teacher.email,
        password: teacher.password,
      },
    }).then(response => {
      teacherToken = response.body.token;
    });

    // Login as student
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        email: student.email,
        password: student.password,
      },
    }).then(response => {
      studentToken = response.body.token;
    });
  });

  describe('Assignment Creation', () => {
    it('should create a new assignment', () => {
      const assignment = {
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        maxScore: 100,
        allowedFileTypes: ['pdf', 'doc', 'docx'],
        maxFileSize: 5 * 1024 * 1024, // 5MB
      };

      cy.request({
        method: 'POST',
        url: '/api/assignments',
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
        body: assignment,
      }).then(response => {
        expect(response.status).to.equal(201);
        expect(response.body).to.have.property('id');
        expect(response.body.title).to.equal(assignment.title);
        expect(response.body.description).to.equal(assignment.description);
        assignmentId = response.body.id;
      });
    });

    it('should validate assignment creation', () => {
      const invalidAssignment = {
        title: '',
        description: '',
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Past date
        maxScore: -1,
        allowedFileTypes: ['invalid'],
        maxFileSize: -1,
      };

      cy.request({
        method: 'POST',
        url: '/api/assignments',
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
        body: invalidAssignment,
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(400);
        expect(response.body).to.have.property('errors');
        expect(response.body.errors).to.be.an('array');
        expect(response.body.errors.length).to.be.greaterThan(0);
      });
    });

    it('should prevent student from creating assignments', () => {
      const assignment = {
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 100,
      };

      cy.request({
        method: 'POST',
        url: '/api/assignments',
        headers: {
          Authorization: `Bearer ${studentToken}`,
        },
        body: assignment,
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(403);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('unauthorized');
      });
    });
  });

  describe('Assignment Retrieval', () => {
    it('should get all assignments', () => {
      cy.request({
        method: 'GET',
        url: '/api/assignments',
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.be.greaterThan(0);
      });
    });

    it('should get a single assignment', () => {
      cy.request({
        method: 'GET',
        url: `/api/assignments/${assignmentId}`,
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('id', assignmentId);
      });
    });

    it('should handle non-existent assignment', () => {
      cy.request({
        method: 'GET',
        url: '/api/assignments/non-existent-id',
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(404);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('not found');
      });
    });
  });

  describe('Assignment Updates', () => {
    it('should update an assignment', () => {
      const updates = {
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      };

      cy.request({
        method: 'PUT',
        url: `/api/assignments/${assignmentId}`,
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
        body: updates,
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body.title).to.equal(updates.title);
        expect(response.body.description).to.equal(updates.description);
        expect(response.body.dueDate).to.equal(updates.dueDate);
      });
    });

    it('should prevent student from updating assignments', () => {
      const updates = {
        title: faker.lorem.sentence(),
      };

      cy.request({
        method: 'PUT',
        url: `/api/assignments/${assignmentId}`,
        headers: {
          Authorization: `Bearer ${studentToken}`,
        },
        body: updates,
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(403);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('unauthorized');
      });
    });
  });

  describe('Assignment Deletion', () => {
    it('should delete an assignment', () => {
      cy.request({
        method: 'DELETE',
        url: `/api/assignments/${assignmentId}`,
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.include('deleted');

        // Verify assignment is deleted
        cy.request({
          method: 'GET',
          url: `/api/assignments/${assignmentId}`,
          headers: {
            Authorization: `Bearer ${teacherToken}`,
          },
          failOnStatusCode: false,
        }).then(verifyResponse => {
          expect(verifyResponse.status).to.equal(404);
        });
      });
    });

    it('should prevent student from deleting assignments', () => {
      cy.request({
        method: 'DELETE',
        url: `/api/assignments/${assignmentId}`,
        headers: {
          Authorization: `Bearer ${studentToken}`,
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(403);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('unauthorized');
      });
    });
  });

  describe('Assignment Submissions', () => {
    let submissionId: string;

    before(() => {
      // Create a new assignment for submission testing
      const assignment = {
        title: faker.lorem.sentence(),
        description: faker.lorem.paragraph(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxScore: 100,
      };

      cy.request({
        method: 'POST',
        url: '/api/assignments',
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
        body: assignment,
      }).then(response => {
        assignmentId = response.body.id;
      });
    });

    it('should submit an assignment', () => {
      const submission = {
        assignmentId,
        comment: faker.lorem.paragraph(),
        files: [
          {
            name: 'test.pdf',
            content: 'test content',
            type: 'application/pdf',
          },
        ],
      };

      cy.request({
        method: 'POST',
        url: '/api/submissions',
        headers: {
          Authorization: `Bearer ${studentToken}`,
        },
        body: submission,
      }).then(response => {
        expect(response.status).to.equal(201);
        expect(response.body).to.have.property('id');
        expect(response.body.assignmentId).to.equal(assignmentId);
        submissionId = response.body.id;
      });
    });

    it('should get submission details', () => {
      cy.request({
        method: 'GET',
        url: `/api/submissions/${submissionId}`,
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('id', submissionId);
        expect(response.body).to.have.property('files');
        expect(response.body.files).to.be.an('array');
        expect(response.body.files.length).to.equal(1);
      });
    });

    it('should grade a submission', () => {
      const grade = {
        score: 85,
        feedback: faker.lorem.paragraph(),
      };

      cy.request({
        method: 'POST',
        url: `/api/submissions/${submissionId}/grade`,
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
        body: grade,
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('score', grade.score);
        expect(response.body).to.have.property('feedback', grade.feedback);
      });
    });

    it('should prevent student from grading submissions', () => {
      const grade = {
        score: 100,
        feedback: faker.lorem.paragraph(),
      };

      cy.request({
        method: 'POST',
        url: `/api/submissions/${submissionId}/grade`,
        headers: {
          Authorization: `Bearer ${studentToken}`,
        },
        body: grade,
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(403);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('unauthorized');
      });
    });
  });
});
