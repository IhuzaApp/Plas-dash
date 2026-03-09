import { NextRequest, NextResponse } from 'next/server';
import { GraphQLClient } from 'graphql-request';
import { ADD_INFLUENCER } from '@/lib/graphql/mutations';

const HASURA_URL = process.env.HASURA_GRAPHQL_URL!;
const HASURA_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;

const hasuraClient = new GraphQLClient(HASURA_URL, {
    headers: { 'x-hasura-admin-secret': HASURA_SECRET },
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { variables } = body;

        if (!variables) {
            return NextResponse.json({ error: 'Missing variables' }, { status: 400 });
        }

        // Basic validation
        if (!variables.name || !variables.email || !variables.phone) {
            return NextResponse.json({ error: 'Name, email, and phone are required' }, { status: 400 });
        }

        const allowedFields = [
            'name', 'email', 'phone', 'status', 'membershipId', 'description',
            'payment_method', 'payment_terms', 'momo_number', 'bank_name',
            'bank_account_number', 'bank_account_name', 'contract_start_date', 'contract_end_date'
        ];

        const sanitizedVariables: any = {};
        allowedFields.forEach(field => {
            if (variables[field] !== undefined) {
                sanitizedVariables[field] = variables[field] || null;
            }
        });

        // Hasura expects date fields as null or a valid ISO date string — never empty string
        const dateFields = ['contract_start_date', 'contract_end_date'];
        dateFields.forEach(field => {
            if (!sanitizedVariables[field] || sanitizedVariables[field].trim() === '') {
                sanitizedVariables[field] = null;
            }
        });

        const data = await hasuraClient.request<any>(ADD_INFLUENCER, sanitizedVariables);

        return NextResponse.json({
            success: true,
            influencer: data.insert_influencers_one
        });
    } catch (error: any) {
        console.error('Add Influencer Error:', error.response?.errors || error.message);
        return NextResponse.json(
            { error: error.response?.errors?.[0]?.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
