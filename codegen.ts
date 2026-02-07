import 'dotenv/config';
import type { CodegenConfig } from '@graphql-codegen/cli';

const url = process.env.HASURA_GRAPHQL_URL || 'https://plas-starfish-46.hasura.app/v1/graphql';
const adminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET || '';

const config: CodegenConfig = {
  schema: [
    {
      [url]: {
        headers: {
          'Content-Type': 'application/json',
          ...(adminSecret ? { 'x-hasura-admin-secret': adminSecret } : {}),
        },
      },
    },
  ],
  documents: ['src/graphql/**/*.graphql'],
  ignoreNoDocuments: true,
  generates: {
    'src/graphql/schema.graphql': {
      plugins: ['schema-ast'],
      config: { includeDirectives: true },
    },
    'src/graphql/generated/graphql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-react-query'],
      config: {
        fetcher: '../graphql-fetcher#graphqlFetcher',
        skipTypename: false,
      },
    },
  },
};

export default config;
