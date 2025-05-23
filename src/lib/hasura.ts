import { HASURA_GRAPHQL_URL, HASURA_GRAPHQL_ADMIN_SECRET } from './graphql';

interface HasuraConfig {
  url: string;
  adminSecret: string;
}

const hasuraConfig: HasuraConfig = {
  url: HASURA_GRAPHQL_URL,
  adminSecret: HASURA_GRAPHQL_ADMIN_SECRET,
};

export async function hasuraRequest<T>(query: string, variables = {}) {
  if (!hasuraConfig.url) {
    throw new Error('Hasura GraphQL URL is not configured');
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-hasura-admin-secret': hasuraConfig.adminSecret,
  };

  const response = await fetch(hasuraConfig.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(data.errors[0].message);
  }

  return data.data as T;
} 