import { ApiError, ApiResponse, Assignment, Feedback, Submission, User } from './types';

// API Response Assertions
export const shouldHaveValidResponse = (response: ApiResponse<any>): void => {
  expect(response).to.have.property('data');
  expect(response).to.not.have.property('error');
};

export const shouldHaveValidError = (error: ApiError): void => {
  expect(error).to.have.property('status');
  expect(error).to.have.property('message');
  expect(error.status).to.be.a('number');
  expect(error.message).to.be.a('string');
};

// User Assertions
export const shouldHaveValidUser = (user: User): void => {
  expect(user).to.have.property('email');
  expect(user).to.have.property('name');
  expect(user.email).to.be.a('string');
  expect(user.name).to.be.a('string');
  expect(user.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
};

// Assignment Assertions
export const shouldHaveValidAssignment = (assignment: Assignment): void => {
  expect(assignment).to.have.property('id');
  expect(assignment).to.have.property('title');
  expect(assignment).to.have.property('description');
  expect(assignment).to.have.property('dueDate');
  expect(assignment).to.have.property('status');
  expect(assignment.id).to.be.a('string');
  expect(assignment.title).to.be.a('string');
  expect(assignment.description).to.be.a('string');
  expect(assignment.dueDate).to.be.a('string');
  expect(assignment.status).to.be.oneOf(['draft', 'published', 'submitted', 'graded']);
};

// Submission Assertions
export const shouldHaveValidSubmission = (submission: Submission): void => {
  expect(submission).to.have.property('id');
  expect(submission).to.have.property('assignmentId');
  expect(submission).to.have.property('userId');
  expect(submission).to.have.property('fileUrl');
  expect(submission).to.have.property('submittedAt');
  expect(submission).to.have.property('status');
  expect(submission.id).to.be.a('string');
  expect(submission.assignmentId).to.be.a('string');
  expect(submission.userId).to.be.a('string');
  expect(submission.fileUrl).to.be.a('string');
  expect(submission.submittedAt).to.be.a('string');
  expect(submission.status).to.be.oneOf(['pending', 'analyzed', 'graded']);
};

// Feedback Assertions
export const shouldHaveValidFeedback = (feedback: Feedback): void => {
  expect(feedback).to.have.property('id');
  expect(feedback).to.have.property('submissionId');
  expect(feedback).to.have.property('userId');
  expect(feedback).to.have.property('content');
  expect(feedback).to.have.property('rating');
  expect(feedback).to.have.property('createdAt');
  expect(feedback.id).to.be.a('string');
  expect(feedback.submissionId).to.be.a('string');
  expect(feedback.userId).to.be.a('string');
  expect(feedback.content).to.be.a('string');
  expect(feedback.rating).to.be.a('number');
  expect(feedback.createdAt).to.be.a('string');
  expect(feedback.rating).to.be.within(1, 5);
};

// UI Element Assertions
export const shouldBeVisible = (selector: string): void => {
  cy.get(selector).should('be.visible');
};

export const shouldNotBeVisible = (selector: string): void => {
  cy.get(selector).should('not.be.visible');
};

export const shouldExist = (selector: string): void => {
  cy.get(selector).should('exist');
};

export const shouldNotExist = (selector: string): void => {
  cy.get(selector).should('not.exist');
};

export const shouldHaveText = (selector: string, text: string): void => {
  cy.get(selector).should('have.text', text);
};

export const shouldContainText = (selector: string, text: string): void => {
  cy.get(selector).should('contain', text);
};

export const shouldHaveValue = (selector: string, value: string): void => {
  cy.get(selector).should('have.value', value);
};

export const shouldBeEnabled = (selector: string): void => {
  cy.get(selector).should('be.enabled');
};

export const shouldBeDisabled = (selector: string): void => {
  cy.get(selector).should('be.disabled');
};

export const shouldBeChecked = (selector: string): void => {
  cy.get(selector).should('be.checked');
};

export const shouldNotBeChecked = (selector: string): void => {
  cy.get(selector).should('not.be.checked');
};

export const shouldHaveClass = (selector: string, className: string): void => {
  cy.get(selector).should('have.class', className);
};

export const shouldNotHaveClass = (selector: string, className: string): void => {
  cy.get(selector).should('not.have.class', className);
};

export const shouldHaveAttribute = (selector: string, attribute: string, value: string): void => {
  cy.get(selector).should('have.attr', attribute, value);
};

export const shouldNotHaveAttribute = (selector: string, attribute: string): void => {
  cy.get(selector).should('not.have.attr', attribute);
};

export const shouldHaveLength = (selector: string, length: number): void => {
  cy.get(selector).should('have.length', length);
};

export const shouldHaveCount = (selector: string, count: number): void => {
  cy.get(selector).should('have.length', count);
};

export const shouldBeFocused = (selector: string): void => {
  cy.get(selector).should('be.focused');
};

export const shouldNotBeFocused = (selector: string): void => {
  cy.get(selector).should('not.be.focused');
};

export const shouldBeSelected = (selector: string): void => {
  cy.get(selector).should('be.selected');
};

export const shouldNotBeSelected = (selector: string): void => {
  cy.get(selector).should('not.be.selected');
};

export const shouldBeValid = (selector: string): void => {
  cy.get(selector).should('be.valid');
};

export const shouldBeInvalid = (selector: string): void => {
  cy.get(selector).should('be.invalid');
};

export const shouldBeRequired = (selector: string): void => {
  cy.get(selector).should('be.required');
};

export const shouldNotBeRequired = (selector: string): void => {
  cy.get(selector).should('not.be.required');
};

export const shouldBeReadonly = (selector: string): void => {
  cy.get(selector).should('be.readonly');
};

export const shouldNotBeReadonly = (selector: string): void => {
  cy.get(selector).should('not.be.readonly');
};

export const shouldBeEmpty = (selector: string): void => {
  cy.get(selector).should('be.empty');
};

export const shouldNotBeEmpty = (selector: string): void => {
  cy.get(selector).should('not.be.empty');
};

export const shouldHaveCss = (selector: string, property: string, value: string): void => {
  cy.get(selector).should('have.css', property, value);
};

export const shouldNotHaveCss = (selector: string, property: string, value: string): void => {
  cy.get(selector).should('not.have.css', property, value);
};

export const shouldHaveStyle = (selector: string, property: string, value: string): void => {
  cy.get(selector).should('have.style', property, value);
};

export const shouldNotHaveStyle = (selector: string, property: string, value: string): void => {
  cy.get(selector).should('not.have.style', property, value);
};

export const shouldHaveProp = (selector: string, property: string, value: any): void => {
  cy.get(selector).should('have.prop', property, value);
};

export const shouldNotHaveProp = (selector: string, property: string, value: any): void => {
  cy.get(selector).should('not.have.prop', property, value);
};

export const shouldHaveData = (selector: string, attribute: string, value: string): void => {
  cy.get(selector).should('have.data', attribute, value);
};

export const shouldNotHaveData = (selector: string, attribute: string): void => {
  cy.get(selector).should('not.have.data', attribute);
};

export const shouldHaveId = (selector: string, id: string): void => {
  cy.get(selector).should('have.id', id);
};

export const shouldNotHaveId = (selector: string, id: string): void => {
  cy.get(selector).should('not.have.id', id);
};

export const shouldHaveName = (selector: string, name: string): void => {
  cy.get(selector).should('have.name', name);
};

export const shouldNotHaveName = (selector: string, name: string): void => {
  cy.get(selector).should('not.have.name', name);
};

export const shouldHavePlaceholder = (selector: string, placeholder: string): void => {
  cy.get(selector).should('have.attr', 'placeholder', placeholder);
};

export const shouldNotHavePlaceholder = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'placeholder');
};

export const shouldHaveTitle = (selector: string, title: string): void => {
  cy.get(selector).should('have.attr', 'title', title);
};

export const shouldNotHaveTitle = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'title');
};

export const shouldHaveType = (selector: string, type: string): void => {
  cy.get(selector).should('have.attr', 'type', type);
};

export const shouldNotHaveType = (selector: string, type: string): void => {
  cy.get(selector).should('not.have.attr', 'type', type);
};

export const shouldHaveHref = (selector: string, href: string): void => {
  cy.get(selector).should('have.attr', 'href', href);
};

export const shouldNotHaveHref = (selector: string, href: string): void => {
  cy.get(selector).should('not.have.attr', 'href', href);
};

export const shouldHaveSrc = (selector: string, src: string): void => {
  cy.get(selector).should('have.attr', 'src', src);
};

export const shouldNotHaveSrc = (selector: string, src: string): void => {
  cy.get(selector).should('not.have.attr', 'src', src);
};

export const shouldHaveAlt = (selector: string, alt: string): void => {
  cy.get(selector).should('have.attr', 'alt', alt);
};

export const shouldNotHaveAlt = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'alt');
};

export const shouldHaveTarget = (selector: string, target: string): void => {
  cy.get(selector).should('have.attr', 'target', target);
};

export const shouldNotHaveTarget = (selector: string, target: string): void => {
  cy.get(selector).should('not.have.attr', 'target', target);
};

export const shouldHaveRel = (selector: string, rel: string): void => {
  cy.get(selector).should('have.attr', 'rel', rel);
};

export const shouldNotHaveRel = (selector: string, rel: string): void => {
  cy.get(selector).should('not.have.attr', 'rel', rel);
};

export const shouldHaveRole = (selector: string, role: string): void => {
  cy.get(selector).should('have.attr', 'role', role);
};

export const shouldNotHaveRole = (selector: string, role: string): void => {
  cy.get(selector).should('not.have.attr', 'role', role);
};

export const shouldHaveAriaLabel = (selector: string, label: string): void => {
  cy.get(selector).should('have.attr', 'aria-label', label);
};

export const shouldNotHaveAriaLabel = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-label');
};

export const shouldHaveAriaDescribedby = (selector: string, describedby: string): void => {
  cy.get(selector).should('have.attr', 'aria-describedby', describedby);
};

export const shouldNotHaveAriaDescribedby = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-describedby');
};

export const shouldHaveAriaHidden = (selector: string): void => {
  cy.get(selector).should('have.attr', 'aria-hidden', 'true');
};

export const shouldNotHaveAriaHidden = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-hidden');
};

export const shouldHaveAriaExpanded = (selector: string, expanded: boolean): void => {
  cy.get(selector).should('have.attr', 'aria-expanded', expanded.toString());
};

export const shouldNotHaveAriaExpanded = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-expanded');
};

export const shouldHaveAriaPressed = (selector: string, pressed: boolean): void => {
  cy.get(selector).should('have.attr', 'aria-pressed', pressed.toString());
};

export const shouldNotHaveAriaPressed = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-pressed');
};

export const shouldHaveAriaSelected = (selector: string, selected: boolean): void => {
  cy.get(selector).should('have.attr', 'aria-selected', selected.toString());
};

export const shouldNotHaveAriaSelected = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-selected');
};

export const shouldHaveAriaChecked = (selector: string, checked: boolean): void => {
  cy.get(selector).should('have.attr', 'aria-checked', checked.toString());
};

export const shouldNotHaveAriaChecked = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-checked');
};

export const shouldHaveAriaDisabled = (selector: string): void => {
  cy.get(selector).should('have.attr', 'aria-disabled', 'true');
};

export const shouldNotHaveAriaDisabled = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-disabled');
};

export const shouldHaveAriaReadonly = (selector: string): void => {
  cy.get(selector).should('have.attr', 'aria-readonly', 'true');
};

export const shouldNotHaveAriaReadonly = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-readonly');
};

export const shouldHaveAriaRequired = (selector: string): void => {
  cy.get(selector).should('have.attr', 'aria-required', 'true');
};

export const shouldNotHaveAriaRequired = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-required');
};

export const shouldHaveAriaInvalid = (selector: string): void => {
  cy.get(selector).should('have.attr', 'aria-invalid', 'true');
};

export const shouldNotHaveAriaInvalid = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-invalid');
};

export const shouldHaveAriaBusy = (selector: string): void => {
  cy.get(selector).should('have.attr', 'aria-busy', 'true');
};

export const shouldNotHaveAriaBusy = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-busy');
};

export const shouldHaveAriaLive = (selector: string, live: string): void => {
  cy.get(selector).should('have.attr', 'aria-live', live);
};

export const shouldNotHaveAriaLive = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-live');
};

export const shouldHaveAriaRelevant = (selector: string, relevant: string): void => {
  cy.get(selector).should('have.attr', 'aria-relevant', relevant);
};

export const shouldNotHaveAriaRelevant = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-relevant');
};

export const shouldHaveAriaAtomic = (selector: string): void => {
  cy.get(selector).should('have.attr', 'aria-atomic', 'true');
};

export const shouldNotHaveAriaAtomic = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-atomic');
};

export const shouldHaveAriaDropeffect = (selector: string, dropeffect: string): void => {
  cy.get(selector).should('have.attr', 'aria-dropeffect', dropeffect);
};

export const shouldNotHaveAriaDropeffect = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-dropeffect');
};

export const shouldHaveAriaGrabbed = (selector: string, grabbed: boolean): void => {
  cy.get(selector).should('have.attr', 'aria-grabbed', grabbed.toString());
};

export const shouldNotHaveAriaGrabbed = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-grabbed');
};

export const shouldHaveAriaLevel = (selector: string, level: number): void => {
  cy.get(selector).should('have.attr', 'aria-level', level.toString());
};

export const shouldNotHaveAriaLevel = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-level');
};

export const shouldHaveAriaMultiline = (selector: string): void => {
  cy.get(selector).should('have.attr', 'aria-multiline', 'true');
};

export const shouldNotHaveAriaMultiline = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-multiline');
};

export const shouldHaveAriaMultiselectable = (selector: string): void => {
  cy.get(selector).should('have.attr', 'aria-multiselectable', 'true');
};

export const shouldNotHaveAriaMultiselectable = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-multiselectable');
};

export const shouldHaveAriaOrientation = (selector: string, orientation: string): void => {
  cy.get(selector).should('have.attr', 'aria-orientation', orientation);
};

export const shouldNotHaveAriaOrientation = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-orientation');
};

export const shouldHaveAriaPosinset = (selector: string, posinset: number): void => {
  cy.get(selector).should('have.attr', 'aria-posinset', posinset.toString());
};

export const shouldNotHaveAriaPosinset = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-posinset');
};

export const shouldHaveAriaSetsize = (selector: string, setsize: number): void => {
  cy.get(selector).should('have.attr', 'aria-setsize', setsize.toString());
};

export const shouldNotHaveAriaSetsize = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-setsize');
};

export const shouldHaveAriaSort = (selector: string, sort: string): void => {
  cy.get(selector).should('have.attr', 'aria-sort', sort);
};

export const shouldNotHaveAriaSort = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-sort');
};

export const shouldHaveAriaValuemax = (selector: string, valuemax: number): void => {
  cy.get(selector).should('have.attr', 'aria-valuemax', valuemax.toString());
};

export const shouldNotHaveAriaValuemax = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-valuemax');
};

export const shouldHaveAriaValuemin = (selector: string, valuemin: number): void => {
  cy.get(selector).should('have.attr', 'aria-valuemin', valuemin.toString());
};

export const shouldNotHaveAriaValuemin = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-valuemin');
};

export const shouldHaveAriaValuenow = (selector: string, valuenow: number): void => {
  cy.get(selector).should('have.attr', 'aria-valuenow', valuenow.toString());
};

export const shouldNotHaveAriaValuenow = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-valuenow');
};

export const shouldHaveAriaValuetext = (selector: string, valuetext: string): void => {
  cy.get(selector).should('have.attr', 'aria-valuetext', valuetext);
};

export const shouldNotHaveAriaValuetext = (selector: string): void => {
  cy.get(selector).should('not.have.attr', 'aria-valuetext');
};
