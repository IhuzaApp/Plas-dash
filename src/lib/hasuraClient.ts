import { GraphQLClient } from 'graphql-request';

const HASURA_URL = process.env.HASURA_GRAPHQL_URL || process.env.NEXT_PUBLIC_HASURA_GRAPHQL_URL;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET || process.env.HASURA_ADMIN_SECRET;


export const hasuraClient =
  HASURA_URL && HASURA_SECRET
    ? new GraphQLClient(HASURA_URL, {
      headers: { 'x-hasura-admin-secret': HASURA_SECRET },
    })
    : null;
