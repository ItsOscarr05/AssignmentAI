import { faker } from '@faker-js/faker';

describe('File Upload API', () => {
  const user = {
    email: faker.internet.email(),
    password: 'TestPass123!',
    name: faker.person.fullName(),
  };

  let authToken: string;

  before(() => {
    // Create test user
    cy.request('POST', '/api/auth/register', user);

    // Login to get auth token
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        email: user.email,
        password: user.password,
      },
    }).then(response => {
      authToken = response.body.token;
    });
  });

  describe('File Upload', () => {
    it('should upload a file successfully', () => {
      const file = {
        name: 'test.pdf',
        content: 'test content',
        type: 'application/pdf',
        size: 1024, // 1KB
      };

      cy.request({
        method: 'POST',
        url: '/api/files/upload',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: {
          file,
          metadata: {
            description: faker.lorem.sentence(),
            tags: ['test', 'document'],
          },
        },
      }).then(response => {
        expect(response.status).to.equal(201);
        expect(response.body).to.have.property('id');
        expect(response.body).to.have.property('url');
        expect(response.body.name).to.equal(file.name);
        expect(response.body.type).to.equal(file.type);
        expect(response.body.size).to.equal(file.size);
        expect(response.body.metadata).to.have.property('description');
        expect(response.body.metadata).to.have.property('tags');
      });
    });

    it('should validate file size limit', () => {
      const largeFile = {
        name: 'large.pdf',
        content: 'x'.repeat(6 * 1024 * 1024), // 6MB
        type: 'application/pdf',
        size: 6 * 1024 * 1024,
      };

      cy.request({
        method: 'POST',
        url: '/api/files/upload',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: {
          file: largeFile,
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(400);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('file size exceeds limit');
      });
    });

    it('should validate file type', () => {
      const invalidFile = {
        name: 'test.exe',
        content: 'test content',
        type: 'application/x-msdownload',
        size: 1024,
      };

      cy.request({
        method: 'POST',
        url: '/api/files/upload',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: {
          file: invalidFile,
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(400);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('invalid file type');
      });
    });

    it('should handle multiple file upload', () => {
      const files = [
        {
          name: 'file1.pdf',
          content: 'test content 1',
          type: 'application/pdf',
          size: 1024,
        },
        {
          name: 'file2.pdf',
          content: 'test content 2',
          type: 'application/pdf',
          size: 1024,
        },
      ];

      cy.request({
        method: 'POST',
        url: '/api/files/upload/multiple',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: {
          files,
        },
      }).then(response => {
        expect(response.status).to.equal(201);
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.equal(2);
        expect(response.body[0]).to.have.property('id');
        expect(response.body[1]).to.have.property('id');
      });
    });
  });

  describe('File Management', () => {
    let fileId: string;

    before(() => {
      // Upload a test file
      const file = {
        name: 'test.pdf',
        content: 'test content',
        type: 'application/pdf',
        size: 1024,
      };

      cy.request({
        method: 'POST',
        url: '/api/files/upload',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: {
          file,
        },
      }).then(response => {
        fileId = response.body.id;
      });
    });

    it('should get file details', () => {
      cy.request({
        method: 'GET',
        url: `/api/files/${fileId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('id', fileId);
        expect(response.body).to.have.property('url');
        expect(response.body).to.have.property('name');
        expect(response.body).to.have.property('type');
        expect(response.body).to.have.property('size');
      });
    });

    it('should update file metadata', () => {
      const updates = {
        description: faker.lorem.sentence(),
        tags: ['updated', 'test'],
      };

      cy.request({
        method: 'PUT',
        url: `/api/files/${fileId}/metadata`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: updates,
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body.metadata.description).to.equal(updates.description);
        expect(response.body.metadata.tags).to.deep.equal(updates.tags);
      });
    });

    it('should delete file', () => {
      cy.request({
        method: 'DELETE',
        url: `/api/files/${fileId}`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.include('file deleted');

        // Verify file is deleted
        cy.request({
          method: 'GET',
          url: `/api/files/${fileId}`,
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
          failOnStatusCode: false,
        }).then(verifyResponse => {
          expect(verifyResponse.status).to.equal(404);
          expect(verifyResponse.body).to.have.property('error');
          expect(verifyResponse.body.error).to.include('not found');
        });
      });
    });
  });

  describe('File Download', () => {
    let fileId: string;

    before(() => {
      // Upload a test file
      const file = {
        name: 'test.pdf',
        content: 'test content',
        type: 'application/pdf',
        size: 1024,
      };

      cy.request({
        method: 'POST',
        url: '/api/files/upload',
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'multipart/form-data',
        },
        body: {
          file,
        },
      }).then(response => {
        fileId = response.body.id;
      });
    });

    it('should download file', () => {
      cy.request({
        method: 'GET',
        url: `/api/files/${fileId}/download`,
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.headers['content-type']).to.include('application/pdf');
        expect(response.headers['content-disposition']).to.include('attachment');
      });
    });

    it('should handle non-existent file download', () => {
      cy.request({
        method: 'GET',
        url: '/api/files/non-existent-id/download',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        failOnStatusCode: false,
      }).then(response => {
        expect(response.status).to.equal(404);
        expect(response.body).to.have.property('error');
        expect(response.body.error).to.include('not found');
      });
    });
  });

  describe('File Search', () => {
    it('should search files by name', () => {
      const searchQuery = 'test';

      cy.request({
        method: 'GET',
        url: '/api/files/search',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        qs: {
          query: searchQuery,
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.be.an('array');
        expect(response.body[0]).to.have.property('name');
        expect(response.body[0].name.toLowerCase()).to.include(searchQuery.toLowerCase());
      });
    });

    it('should search files by type', () => {
      cy.request({
        method: 'GET',
        url: '/api/files/search',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        qs: {
          type: 'application/pdf',
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.be.an('array');
        expect(response.body[0]).to.have.property('type', 'application/pdf');
      });
    });

    it('should search files by tags', () => {
      cy.request({
        method: 'GET',
        url: '/api/files/search',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        qs: {
          tags: ['test'],
        },
      }).then(response => {
        expect(response.status).to.equal(200);
        expect(response.body).to.be.an('array');
        expect(response.body[0].metadata.tags).to.include('test');
      });
    });
  });
});
