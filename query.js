const fetch = require('node-fetch');

const query = `
query GetShopRatings {
  __type(name: "Shops") {
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}
`;

// Assuming local endpoint or we can just read the schema
// But we don't have the graphql endpoint URL easily available.
