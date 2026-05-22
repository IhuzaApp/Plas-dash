require('dotenv').config({ path: '.env.local' });
const { GraphQLClient, gql } = require('graphql-request');
const endpoint = process.env.NEXT_PUBLIC_HASURA_HTTP_URL || 'https://hasura.plasdash.com/v1/graphql';
const client = new GraphQLClient(endpoint, {
  headers: {
    'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET || ''
  }
});

const query = gql`
  query {
    kitchenQueue(limit: 1) {
      id
      token_number
      table_number
      status
      dishesOrdered
      restaurant_id
      restaurant_order_id
      waiter_id
      updated_at
      created_at
    }
  }
`;

client.request(query).then(console.log).catch(console.error);
