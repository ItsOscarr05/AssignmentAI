import { Assignment, Feedback, Submission, TestData, User } from './types';

// Generate random test data
export const generateTestData = (): TestData => {
  const users: User[] = [
    {
      email: `test${Date.now()}@example.com`,
      password: 'Test123!@#',
      name: 'Test User',
    },
    {
      email: `admin${Date.now()}@example.com`,
      password: 'Admin123!@#',
      name: 'Admin User',
    },
  ];

  const assignments: Assignment[] = [
    {
      id: `assignment-${Date.now()}`,
      title: 'Test Assignment',
      description: 'Test Description',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'draft',
    },
  ];

  const submissions: Submission[] = [
    {
      id: `submission-${Date.now()}`,
      assignmentId: assignments[0].id,
      userId: users[0].id,
      fileUrl: 'https://example.com/test.pdf',
      submittedAt: new Date().toISOString(),
      status: 'pending',
    },
  ];

  const feedback: Feedback[] = [
    {
      id: `feedback-${Date.now()}`,
      submissionId: submissions[0].id,
      userId: users[1].id,
      content: 'Great work!',
      rating: 5,
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    users,
    assignments,
    submissions,
    feedback,
    profiles: [],
    settings: [],
  };
};

// Reset test data
export const resetTestData = async (): Promise<void> => {
  try {
    await cy.request('POST', `${Cypress.env('apiUrl')}/test/reset`);
  } catch (error) {
    console.error('Error resetting test data:', error);
  }
};

// Create test user
export const createTestUser = async (): Promise<User> => {
  const user: User = {
    email: `test${Date.now()}@example.com`,
    password: 'Test123!@#',
    name: 'Test User',
  };

  try {
    await cy.request('POST', `${Cypress.env('apiUrl')}/users`, user);
    return user;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
};

// Create test assignment
export const createTestAssignment = async (): Promise<Assignment> => {
  const assignment: Assignment = {
    id: `assignment-${Date.now()}`,
    title: 'Test Assignment',
    description: 'Test Description',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'draft',
  };

  try {
    await cy.request('POST', `${Cypress.env('apiUrl')}/assignments`, assignment);
    return assignment;
  } catch (error) {
    console.error('Error creating test assignment:', error);
    throw error;
  }
};

// Create test submission
export const createTestSubmission = async (): Promise<Submission> => {
  const submission: Submission = {
    id: `submission-${Date.now()}`,
    assignmentId: 'test-assignment-id',
    userId: 'test-user-id',
    fileUrl: 'https://example.com/test.pdf',
    submittedAt: new Date().toISOString(),
    status: 'pending',
  };

  try {
    await cy.request('POST', `${Cypress.env('apiUrl')}/submissions`, submission);
    return submission;
  } catch (error) {
    console.error('Error creating test submission:', error);
    throw error;
  }
};

// Create test feedback
export const createTestFeedback = async (): Promise<Feedback> => {
  const feedback: Feedback = {
    id: `feedback-${Date.now()}`,
    submissionId: 'test-submission-id',
    userId: 'test-user-id',
    content: 'Great work!',
    rating: 5,
    createdAt: new Date().toISOString(),
  };

  try {
    await cy.request('POST', `${Cypress.env('apiUrl')}/feedback`, feedback);
    return feedback;
  } catch (error) {
    console.error('Error creating test feedback:', error);
    throw error;
  }
};

// Format date for input fields
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Generate random string
export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Generate random email
export const generateRandomEmail = (): string => {
  return `test${Date.now()}${generateRandomString(5)}@example.com`;
};

// Generate random password
export const generateRandomPassword = (): string => {
  return `Test${generateRandomString(8)}!@#`;
};

// Wait for API response
export const waitForApiResponse = (alias: string, timeout: number = 10000): void => {
  cy.wait(alias, { timeout });
};

// Check if element exists
export const elementExists = (selector: string): boolean => {
  let exists = false;
  cy.get('body').then($body => {
    exists = $body.find(selector).length > 0;
  });
  return exists;
};

// Check if element is visible
export const elementIsVisible = (selector: string): boolean => {
  let visible = false;
  cy.get(selector).then($el => {
    visible = $el.is(':visible');
  });
  return visible;
};

// Check if element is enabled
export const elementIsEnabled = (selector: string): boolean => {
  let enabled = false;
  cy.get(selector).then($el => {
    enabled = !$el.prop('disabled');
  });
  return enabled;
};

// Check if element has class
export const elementHasClass = (selector: string, className: string): boolean => {
  let hasClass = false;
  cy.get(selector).then($el => {
    hasClass = $el.hasClass(className);
  });
  return hasClass;
};

// Check if element has attribute
export const elementHasAttribute = (
  selector: string,
  attribute: string,
  value: string
): boolean => {
  let hasAttribute = false;
  cy.get(selector).then($el => {
    hasAttribute = $el.attr(attribute) === value;
  });
  return hasAttribute;
};

// Check if element has text
export const elementHasText = (selector: string, text: string): boolean => {
  let hasText = false;
  cy.get(selector).then($el => {
    hasText = $el.text().includes(text);
  });
  return hasText;
};

// Check if element has value
export const elementHasValue = (selector: string, value: string): boolean => {
  let hasValue = false;
  cy.get(selector).then($el => {
    hasValue = $el.val() === value;
  });
  return hasValue;
};

// Check if element is checked
export const elementIsChecked = (selector: string): boolean => {
  let isChecked = false;
  cy.get(selector).then($el => {
    isChecked = $el.prop('checked');
  });
  return isChecked;
};

// Check if element is selected
export const elementIsSelected = (selector: string): boolean => {
  let isSelected = false;
  cy.get(selector).then($el => {
    isSelected = $el.prop('selected');
  });
  return isSelected;
};

// Check if element is focused
export const elementIsFocused = (selector: string): boolean => {
  let isFocused = false;
  cy.get(selector).then($el => {
    isFocused = $el.is(':focus');
  });
  return isFocused;
};

// Check if element is hovered
export const elementIsHovered = (selector: string): boolean => {
  let isHovered = false;
  cy.get(selector).then($el => {
    isHovered = $el.is(':hover');
  });
  return isHovered;
};

// Check if element is active
export const elementIsActive = (selector: string): boolean => {
  let isActive = false;
  cy.get(selector).then($el => {
    isActive = $el.is(':active');
  });
  return isActive;
};

// Check if element is disabled
export const elementIsDisabled = (selector: string): boolean => {
  let isDisabled = false;
  cy.get(selector).then($el => {
    isDisabled = $el.prop('disabled');
  });
  return isDisabled;
};

// Check if element is readonly
export const elementIsReadonly = (selector: string): boolean => {
  let isReadonly = false;
  cy.get(selector).then($el => {
    isReadonly = $el.prop('readonly');
  });
  return isReadonly;
};

// Check if element is required
export const elementIsRequired = (selector: string): boolean => {
  let isRequired = false;
  cy.get(selector).then($el => {
    isRequired = $el.prop('required');
  });
  return isRequired;
};

// Check if element is valid
export const elementIsValid = (selector: string): boolean => {
  let isValid = false;
  cy.get(selector).then($el => {
    isValid = $el[0].checkValidity();
  });
  return isValid;
};

// Check if element is invalid
export const elementIsInvalid = (selector: string): boolean => {
  let isInvalid = false;
  cy.get(selector).then($el => {
    isInvalid = !$el[0].checkValidity();
  });
  return isInvalid;
};

// Check if element is pending
export const elementIsPending = (selector: string): boolean => {
  let isPending = false;
  cy.get(selector).then($el => {
    isPending = $el.prop('pending');
  });
  return isPending;
};

// Check if element is loading
export const elementIsLoading = (selector: string): boolean => {
  let isLoading = false;
  cy.get(selector).then($el => {
    isLoading = $el.hasClass('loading');
  });
  return isLoading;
};

// Check if element is error
export const elementIsError = (selector: string): boolean => {
  let isError = false;
  cy.get(selector).then($el => {
    isError = $el.hasClass('error');
  });
  return isError;
};

// Check if element is success
export const elementIsSuccess = (selector: string): boolean => {
  let isSuccess = false;
  cy.get(selector).then($el => {
    isSuccess = $el.hasClass('success');
  });
  return isSuccess;
};

// Check if element is warning
export const elementIsWarning = (selector: string): boolean => {
  let isWarning = false;
  cy.get(selector).then($el => {
    isWarning = $el.hasClass('warning');
  });
  return isWarning;
};

// Check if element is info
export const elementIsInfo = (selector: string): boolean => {
  let isInfo = false;
  cy.get(selector).then($el => {
    isInfo = $el.hasClass('info');
  });
  return isInfo;
};

// Check if element is primary
export const elementIsPrimary = (selector: string): boolean => {
  let isPrimary = false;
  cy.get(selector).then($el => {
    isPrimary = $el.hasClass('primary');
  });
  return isPrimary;
};

// Check if element is secondary
export const elementIsSecondary = (selector: string): boolean => {
  let isSecondary = false;
  cy.get(selector).then($el => {
    isSecondary = $el.hasClass('secondary');
  });
  return isSecondary;
};

// Check if element is tertiary
export const elementIsTertiary = (selector: string): boolean => {
  let isTertiary = false;
  cy.get(selector).then($el => {
    isTertiary = $el.hasClass('tertiary');
  });
  return isTertiary;
};

// Check if element is quaternary
export const elementIsQuaternary = (selector: string): boolean => {
  let isQuaternary = false;
  cy.get(selector).then($el => {
    isQuaternary = $el.hasClass('quaternary');
  });
  return isQuaternary;
};

// Check if element is quinary
export const elementIsQuinary = (selector: string): boolean => {
  let isQuinary = false;
  cy.get(selector).then($el => {
    isQuinary = $el.hasClass('quinary');
  });
  return isQuinary;
};

// Check if element is senary
export const elementIsSenary = (selector: string): boolean => {
  let isSenary = false;
  cy.get(selector).then($el => {
    isSenary = $el.hasClass('senary');
  });
  return isSenary;
};

// Check if element is septenary
export const elementIsSeptenary = (selector: string): boolean => {
  let isSeptenary = false;
  cy.get(selector).then($el => {
    isSeptenary = $el.hasClass('septenary');
  });
  return isSeptenary;
};

// Check if element is octonary
export const elementIsOctonary = (selector: string): boolean => {
  let isOctonary = false;
  cy.get(selector).then($el => {
    isOctonary = $el.hasClass('octonary');
  });
  return isOctonary;
};

// Check if element is nonary
export const elementIsNonary = (selector: string): boolean => {
  let isNonary = false;
  cy.get(selector).then($el => {
    isNonary = $el.hasClass('nonary');
  });
  return isNonary;
};

// Check if element is denary
export const elementIsDenary = (selector: string): boolean => {
  let isDenary = false;
  cy.get(selector).then($el => {
    isDenary = $el.hasClass('denary');
  });
  return isDenary;
};
