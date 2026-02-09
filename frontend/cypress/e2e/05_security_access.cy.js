describe('Secure Route Access (RBAC Enforcement)', () => {
    const PATIENT_ID = 'P005';
    const PASSWORD = 'password123';

    beforeEach(() => {
        // Login as Patient
        cy.visit('/login');
        cy.get('input[type="text"]').type(PATIENT_ID);
        cy.get('input[type="password"]').type(PASSWORD);
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/patient/dashboard');
    });

    it('should block Patient from accessing Admin Dashboard', () => {
        // Attempt to visit Admin URL directly
        cy.visit('/admin/dashboard');

        // Verification: Should be redirected to Unauthorized or Login page
        // Based on your App.jsx, there is an /unauthorized route
        cy.url().should('satisfy', (url) => {
            return url.includes('/unauthorized') || url.includes('/login') || url.includes('/patient/dashboard');
        });

        // If redirected to unauthorized page, check for access denied message
        cy.get('body').then(($body) => {
            if ($body.find('h1:contains("Access Denied")').length > 0) {
                cy.contains('Access Denied').should('be.visible');
            }
        });
    });

    it('should block Patient from accessing Doctor Dashboard', () => {
        cy.visit('/doctor/dashboard');
        cy.url().should('satisfy', (url) => url.includes('/unauthorized') || url.includes('/login'));
    });
});
