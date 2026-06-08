import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeFormSubmission } from '../validators/formSchemas.js';

test('recruitment submissions normalize aliases and strip unknown fields', () => {
  const submission = normalizeFormSubmission('recruitment', {
    fullName: '  Jane Doe  ',
    collegeEmail: 'JANE@EXAMPLE.COM ',
    whatsapp: '9876543210',
    year: '2nd Year',
    branch: 'CSE',
    section: 'B',
    whyJoin: '  I want to contribute & learn  ',
    role: 'Developer',
    interests: ['AI', 'Cloud'],
    submittedAt: '2026-05-12T10:00:00.000Z',
    userAgent: 'TestAgent/1.0',
    unexpected: 'drop-me',
  });

  assert.equal(submission.fullName, 'Jane Doe');
  assert.equal(submission.collegeEmail, 'jane@example.com');
  assert.equal(submission.whatsapp, '9876543210');
  assert.equal(submission.year, '2nd Year');
  assert.equal(submission.branch, 'CSE');
  assert.equal(submission.section, 'B');
  assert.equal(submission.reason, 'I want to contribute & learn');
  assert.equal(submission.whyJoin, 'I want to contribute & learn');
  assert.deepEqual(submission.interests, ['AI', 'Cloud']);
  assert.equal(submission.unexpected, undefined);
});

test('core team application rejects missing required fields', () => {
  assert.throws(
    () =>
      normalizeFormSubmission('core_team', {
        fullName: 'Jane Doe',
        collegeEmail: 'jane@example.com',
        whatsapp: '9876543210',
        branch: 'CSE',
        section: 'A',
        whyJoin: 'Interested',
      }),
    /Year is required/
  );
});

test('membership submissions validate membership-specific fields and strip unknowns', () => {
  const submission = normalizeFormSubmission('membership', {
    fullName: 'John Smith',
    collegeEmail: 'john.smith@glbajajgroup.org',
    whatsapp: '1234567890',
    branch: 'IT',
    section: 'C',
    semester: '3rd Semester',
    whyJoin: 'To contribute',
    rollNumber: 'GLB12345',
    course: 'B.Tech',
    groups: 'Design, Tech',
    extraField: '<script>bad</script>',
  });

  assert.equal(submission.fullName, 'John Smith');
  assert.equal(submission.collegeEmail, 'john.smith@glbajajgroup.org');
  assert.equal(submission.semester, '3rd Semester');
  assert.equal(submission.reason, 'To contribute');
  assert.equal(submission.whyJoin, 'To contribute');
  assert.deepEqual(submission.groups, ['Design', 'Tech']);
  assert.equal(submission.extraField, undefined);
});

test('membership submissions require reason text', () => {
  assert.throws(
    () =>
      normalizeFormSubmission('membership', {
        fullName: 'John Smith',
        collegeEmail: 'john.smith@glbajajgroup.org',
        whatsapp: '1234567890',
        branch: 'IT',
        section: 'C',
        semester: '3rd Semester',
      }),
    /Reason is required/
  );
});
