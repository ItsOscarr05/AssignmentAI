/// <reference types="cypress" />

import Bluebird = require('cypress/types/bluebird');

// Define the response body type for the users endpoint
interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  // Add other user properties as needed
}

context('Utilities', () => {
  beforeEach(() => {
    cy.visit('https://example.cypress.io/utilities');
  });

  it('Cypress._ - call a lodash method', () => {
    // https://on.cypress.io/_
    cy.request('https://jsonplaceholder.cypress.io/users').then(
      (response: Cypress.Response<User[]>) => {
        const userIds: number[] = Cypress._.chain(response.body).map('id').take(3).value();

        expect(userIds).to.deep.eq([1, 2, 3]);
      }
    );
  });

  it('Cypress.$ - call a jQuery method', () => {
    // https://on.cypress.io/$
    const $firstListItem: JQuery<HTMLElement> = Cypress.$('.utility-jquery li:first');

    cy.wrap($firstListItem).should('not.have.class', 'active');
    cy.wrap($firstListItem).click();
    cy.wrap($firstListItem).should('have.class', 'active');
  });

  it('Cypress.Blob - blob utilities and base64 string conversion', () => {
    // https://on.cypress.io/blob
    cy.get('.utility-blob').then(($div: JQuery<HTMLElement>) => {
      // https://github.com/nolanlawson/blob-util#imgSrcToDataURL
      // get the dataUrl string for the javascript-logo
      return Cypress.Blob.imgSrcToDataURL(
        'https://example.cypress.io/assets/img/javascript-logo.png',
        undefined,
        'anonymous'
      ).then((dataUrl: string) => {
        // create an <img> element and set its src to the dataUrl
        const $img: JQuery<HTMLElement> = Cypress.$('<img />', { src: dataUrl });

        // need to explicitly return cy here since we are initially returning
        // the Cypress.Blob.imgSrcToDataURL promise to our test
        // append the image
        $div.append($img);

        cy.get('.utility-blob img').click();
        cy.get('.utility-blob img').should('have.attr', 'src', dataUrl);
      });
    });
  });

  it('Cypress.minimatch - test out glob patterns against strings', () => {
    // https://on.cypress.io/minimatch
    let isMatching: boolean = Cypress.minimatch('/users/1/comments', '/users/*/comments', {
      matchBase: true,
    });

    expect(isMatching).to.be.true;

    isMatching = Cypress.minimatch('/users/1/comments/2', '/users/*/comments', {
      matchBase: true,
    });

    expect(isMatching).to.be.false;

    // ** matches against all downstream path segments
    isMatching = Cypress.minimatch('/foo/bar/baz/123/quux?a=b&c=2', '/foo/**', {
      matchBase: true,
    });

    expect(isMatching).to.be.true;

    // whereas * matches only the next path segment
    isMatching = Cypress.minimatch('/foo/bar/baz/123/quux?a=b&c=2', '/foo/*', {
      matchBase: false,
    });

    expect(isMatching).to.be.false;
  });

  it('Cypress.Promise - instantiate a bluebird promise', () => {
    // https://on.cypress.io/promise
    let hasWaited: boolean = false;

    /**
     * Returns a promise that resolves after 1 second with 'foo' string
     * @returns A promise that resolves with 'foo'
     */
    function waitOneSecond(): Bluebird<string> {
      return new Cypress.Promise((resolve: (value: string) => void) => {
        setTimeout(() => {
          // set hasWaited to true
          hasWaited = true;

          // resolve with 'foo' string
          resolve('foo');
        }, 1000);
      });
    }

    cy.then(() => {
      // return a promise to cy.then() that
      // is awaited until it resolves
      return waitOneSecond().then((result: string) => {
        expect(result).to.eq('foo');
        expect(hasWaited).to.be.true;
      });
    });
  });
});
