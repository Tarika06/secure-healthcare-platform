describe('Login Functionality', () => {
    beforeEach(() => {
        cy.visit('/login');
    });

    it('should login successfully with valid Patient credentials', () => {
        const username = 'P001'; 
        const password = 'password123';

        cy.get('input[type="text"]').clear().type(username);
        cy.get('input[type="password"]').clear().type(password);
        cy.get('button[type="submit"]').click();

        // Verification: URL change to dashboard
        cy.url().should('include', '/dashboard');
    });

    it('should show error with invalid credentials', () => {
        cy.get('input[type="text"]').clear().type('InvalidUser');
        cy.get('input[type="password"]').clear().type('WrongPass');
        cy.get('button[type="submit"]').click();

        // Verification: Error message should be visible
        // Adjust the text 'Invalid credentials' if your app shows something different (e.g., 'Login failed')
        cy.contains(/Invalid credentials|Login failed/i).should('be.visible');
        cy.url().should('not.include', '/dashboard');
    });
});
