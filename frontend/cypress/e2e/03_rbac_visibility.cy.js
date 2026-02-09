describe('Role-Based UI Visibility', () => {
    // Common password for all test users
    const PASSWORD = 'password123';

    const roles = [
        { role: 'Patient', id: 'P005', url: '/patient/dashboard' },
        { role: 'Doctor', id: 'D005', url: '/doctor/dashboard' },
        { role: 'Nurse', id: 'N005', url: '/nurse/dashboard' },
        { role: 'Lab Tech', id: 'L005', url: '/lab/dashboard' },
        { role: 'Admin', id: 'A005', url: '/admin/dashboard' }
    ];

    roles.forEach(({ role, id, url }) => {
        it(`should login as ${role} and see the correct dashboard`, () => {
            cy.visit('/login');
            
            // Login
            cy.get('input[type="text"]').clear().type(id);
            cy.get('input[type="password"]').clear().type(PASSWORD);
            cy.get('button[type="submit"]').click();

            // Verify URL
            cy.url().should('include', url);

            // Optional: Verify role-specific text if available on dashboard
            // cy.contains(role).should('be.visible');
            
            // Logout to clean up state for next test
            // Assuming there is a logout button. If not, cy.clearCookies() or cy.clearLocalStorage() might be needed in beforeEach
            // cy.get('button').contains(/Logout|Sign Out/i).click();
        });
    });
});
