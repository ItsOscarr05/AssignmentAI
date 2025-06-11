/// <reference types="cypress" />

// Common interfaces
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
}

interface FileAttachment {
  fileContent: Blob;
  fileName: string;
  mimeType: string;
  encoding?: Cypress.FixtureEncoding;
}

// Extend Cypress Chainable interface
declare global {
  namespace Cypress {
    interface Chainable<Subject = any> {
      // Authentication commands
      login(user: { email: string; password: string }): Chainable<void>;
      logout(): Chainable<void>;

      // Assignment commands
      createAssignment(assignment: Partial<Assignment>): Chainable<Assignment>;
      updateAssignment(id: number, assignment: Partial<Assignment>): Chainable<Assignment>;
      deleteAssignment(id: number): Chainable<void>;

      // File commands
      attachFile(file: FileAttachment): Chainable<JQuery<HTMLElement>>;

      // Utility commands
      logToConsole(method?: keyof Console): Chainable<Subject>;
      tab(options?: Partial<{ shift: boolean }>): Chainable<Subject>;
    }

    interface Response<T = any> {
      body: T;
      status: number;
      statusText: string;
      headers: { [key: string]: string };
      duration: number;
      requestHeaders: { [key: string]: string };
      requestBody: any;
    }
  }
}

export {};
