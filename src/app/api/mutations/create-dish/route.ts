import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
    headers: { 'x-hasura-admin-secret': HASURA_SECRET },
});

const CREATE_DISH_MUTATION = `
  mutation CreateDish($name: String!, $description: String = "", $category: String = "", $image: String = "") {
    insert_dishes_one(object: {
      name: $name,
      description: $description,
      category: $category,
      image: $image
    }) {
      id
    }
  }
`;

export async function POST(req: NextRequest) {
    try {
        const { variables } = await req.json();

        if (!variables || !variables.name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const data = await hasuraClient.request<any>(CREATE_DISH_MUTATION, variables);

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Create Dish Error:', error.response?.errors || error.message);
        return NextResponse.json(
            { error: error.response?.errors?.[0]?.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
