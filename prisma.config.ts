export default {
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/postgres',
  },
};
