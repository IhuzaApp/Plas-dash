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

  console.log('=== HASURA REQUEST DEBUG ===');
  console.log('1. Query:', query);
  console.log('2. Variables:', variables);
  console.log('3. Variables type:', typeof variables);
  console.log('4. Variables JSON:', JSON.stringify(variables, null, 2));

  // Check for empty UUID values in variables
  const checkForEmptyUUIDs = (obj: any, path = '') => {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof value === 'string' && value === '') {
        console.log(`⚠️ Empty string found at ${currentPath}: "${value}"`);
      }
      
      if (typeof value === 'object' && value !== null) {
        checkForEmptyUUIDs(value, currentPath);
      }
    }
  };
  
  checkForEmptyUUIDs(variables);

  const headers = {
    'Content-Type': 'application/json',
    'x-hasura-admin-secret': hasuraConfig.adminSecret,
  };

  const requestBody = {
    query,
    variables,
  };

  console.log('5. Request body:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(hasuraConfig.url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  console.log('6. Response status:', response.status);
  console.log('7. Response ok:', response.ok);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('8. Response error text:', errorText);
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('8. Response data:', data);

  if (data.errors) {
    console.error('9. GraphQL errors:', data.errors);
    throw new Error(data.errors[0].message);
  }

  console.log('10. Success - returning data');
  return data.data as T;
}
