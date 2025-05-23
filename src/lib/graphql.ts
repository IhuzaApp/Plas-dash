import { QueryClient } from '@tanstack/react-query';

// Create a client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Export the Hasura endpoint and admin secret for use in hooks
export const HASURA_GRAPHQL_URL = process.env.HASURA_GRAPHQL_URL || '';
export const HASURA_GRAPHQL_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET || ''; 