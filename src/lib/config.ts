// Environment variables configuration
export const config = {
  hasuraGraphqlUrl: import.meta.env.VITE_HASURA_GRAPHQL_URL || 'http://localhost:8080/v1/graphql',
  hasuraAdminSecret: import.meta.env.VITE_HASURA_ADMIN_SECRET || '',
};

export default config; 