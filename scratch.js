const { GraphQLClient } = require('graphql-request');

const HASURA_URL = process.env.HASURA_GRAPHQL_URL || 'http://localhost:8080/v1/graphql';
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET || 'myadminsecretkey';

const client = new GraphQLClient(HASURA_URL, {
  headers: { 'x-hasura-admin-secret': HASURA_SECRET },
});

async function run() {
  const query = `
    query IntrospectionQuery {
      __schema {
        types {
          name
          fields {
            name
            type {
              name
              kind
            }
          }
        }
      }
    }
  `;
  try {
    const data = await client.request(query);
    const rm = data.__schema.types.find(t => t.name === 'restaurant_menu');
    console.log(JSON.stringify(rm.fields.map(f => f.name)));
  } catch (e) {
    console.log('Error');
  }
}
run();
