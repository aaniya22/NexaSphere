export const up = (pgm) => {
  pgm.createIndex('form_submissions', ['form_type', 'created_at'], {
    name: 'idx_form_submissions_type_created',
    direction: { created_at: 'DESC' },
  });

  pgm.createIndex('form_submissions', 'college_email', {
    name: 'idx_form_submissions_college_email',
  });
};

export const down = (pgm) => {
  pgm.dropIndex('form_submissions', ['form_type', 'created_at'], {
    name: 'idx_form_submissions_type_created',
  });
  pgm.dropIndex('form_submissions', 'college_email', {
    name: 'idx_form_submissions_college_email',
  });
};
