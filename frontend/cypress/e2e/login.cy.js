describe('Login Flow', () => {
    beforeEach(() => {
        // Reset any previous state if needed
        // visited in each test
    });

    it('should login successfully with valid credentials', () => {
        cy.visit('/login');

        // Fill in the login form
        cy.get('input[type="text"]').type('P001');
        cy.get('input[type="password"]').type('password123');

        // Submit form
        cy.get('button[type="submit"]').click();

        // Verify redirection to dashboard
        cy.url().should('include', '/dashboard');

        // Optional: Verify welcome message or dashboard element
        cy.contains('Welcome').should('be.visible');
    });

    it('should show error with invalid credentials', () => {
        cy.visit('/login');

        cy.get('input[type="text"]').type('P001');
        cy.get('input[type="password"]').type('wrongpassword');

        cy.get('button[type="submit"]').click();

        // Verify error message
        cy.contains('Invalid credentials').should('be.visible');
    });
});
