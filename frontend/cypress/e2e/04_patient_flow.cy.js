describe('Patient User Flow', () => {
    const PATIENT_ID = 'P005';
    const PASSWORD = 'password123';

    beforeEach(() => {
        // Start from login for each test to ensure clean state
        cy.visit('/login');
        cy.get('input[type="text"]').type(PATIENT_ID);
        cy.get('input[type="password"]').type(PASSWORD);
        cy.get('button[type="submit"]').click();
        
        // Ensure successful login before proceeding
        cy.url().should('include', '/patient/dashboard', { timeout: 10000 });
        cy.contains('Patient Dashboard').should('be.visible');
    });

    it('should navigate through all dashboard tabs successfully', () => {
        // 1. Verify Overview Tab (Default)
        // Check for stats or welcome message
        cy.contains('Total Records').should('be.visible');
        cy.contains('Active Consents').should('be.visible');

        // 2. Navigate to "My Records" Tab
        cy.contains('button', 'My Records').click();
        // Verify URL query param or content
        cy.url().should('include', 'tab=records');
        cy.contains('My Medical Records').should('be.visible');
        // Check if "No Records Yet" or actual records list is present
        cy.get('body').then(($body) => {
            if ($body.find('h3:contains("No Records Yet")').length > 0) {
                cy.contains('No Records Yet').should('be.visible');
            } else {
                cy.get('.medical-card').should('exist'); 
            }
        });

        // 3. Navigate to "Consent Manager" Tab
        cy.contains('button', 'Consent Manager').click();
        cy.url().should('include', 'tab=consent');
        cy.contains('Pending Requests').should('be.visible');
        cy.contains('Active Consents').should('be.visible');

        // 4. Navigate to "Access History" Tab
        cy.contains('button', 'Access History').click();
        cy.url().should('include', 'tab=history');
        cy.contains('Access History').should('be.visible');
        cy.contains('Track who has accessed your medical records').should('be.visible');
    });

    it('should logout successfully', () => {
        // Find logout button in Sidebar (often an icon or text "Logout")
        // Based on analysis, Sidebar usually has a logout button
        cy.get('button').filter(':contains("Logout"), :has(svg)').last().click(); 

        // Verify redirection to login
        cy.url().should('include', '/login');
        cy.contains('Sign in to your account').should('be.visible');
    });
});
