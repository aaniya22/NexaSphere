export const TEST_USER = {
  email: `e2e-user-${Date.now()}@glbajaj.org`,
  password: 'TestPass123!',
  name: 'E2E Test User',
};

export const TEST_ADMIN = {
  username: 'admin',
  password: 'admin123',
};

export function generateTestEvent() {
  const id = Date.now();
  return {
    name: `E2E Test Event ${id}`,
    shortName: `E2E-${id}`,
    date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    description: 'Automated E2E test event for validating critical user journey.',
    location: 'Test Lab',
    capacity: 50,
    category: 'workshop',
    tags: ['E2E', 'Test'],
  };
}

export function generatePortfolioData() {
  const id = Date.now();
  return {
    projectName: `E2E Project ${id}`,
    description: 'A project created during automated E2E testing.',
    techStack: ['TypeScript', 'React', 'Node.js'],
    githubUrl: `https://github.com/e2e-test/project-${id}`,
    liveUrl: `https://e2e-test-${id}.vercel.app`,
  };
}
