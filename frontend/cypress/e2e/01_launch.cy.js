describe('Application Launch Verification', () => {
  it('should load the landing page successfully', () => {
    // Visit the base URL
    cy.visit('/');
    
    // Core Verification: Ensure the app root exists and URL is correct
    cy.url().should('include', '/');
    cy.get('body').should('be.visible');
    
    // Check for title (optional check)
    cy.title().should('not.be.empty');
  });
});
