'use client';

interface ImportMetaEnv {
  HASURA_GRAPHQL_URL: string;
  HASURA_GRAPHQL_ADMIN_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Determine if we're in a server environment (e.g., API routes)
const isServer = typeof process !== 'undefined' && process.env;

export const hasuraConfig = {
  url: process.env.HASURA_GRAPHQL_URL,
  adminSecret: process.env.HASURA_GRAPHQL_ADMIN_SECRET,
};

// Validate config
if (!hasuraConfig.url) {
  throw new Error('HASURA_GRAPHQL_URL is not defined in environment variables');
}

if (!hasuraConfig.adminSecret) {
  throw new Error('HASURA_GRAPHQL_ADMIN_SECRET is not defined in environment variables');
}

export default hasuraConfig;
