import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { getUserContext } from '@/lib/auth-server';
import { MODULE_DESCRIPTIONS } from '@/lib/privileges/moduleDescriptions';
import { PrivilegeKey } from '@/types/privileges';

const GET_ALL_MODULES = gql`
  query GetAllModules {
    modules {
      id
      slug
    }
  }
`;

const INSERT_MODULE = gql`
  mutation InsertModule($object: modules_insert_input!) {
    insert_modules_one(object: $object) {
      id
      slug
    }
  }
`;

const UPDATE_MODULE = gql`
  mutation UpdateModule($id: uuid!, $set: modules_set_input!) {
    update_modules_by_pk(pk_columns: { id: $id }, _set: $set) {
      id
      slug
    }
  }
`;

export async function POST(req: Request) {
  const context = await getUserContext(req);
  if (!context) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (!hasuraClient) throw new Error('Hasura client is not initialized');

    const results = [];
    const modulesFromCode = Object.entries(MODULE_DESCRIPTIONS);

    // 1. Get existing modules to check for slugs
    const { modules: existingModules } = await hasuraClient.request<{ modules: { id: string, slug: string }[] }>(GET_ALL_MODULES);
    const existingModuleMap = new Map(existingModules.map(m => [m.slug.toLowerCase(), m.id]));

    for (const [slug, desc] of modulesFromCode) {
      const lowerSlug = slug.toLowerCase();
      const payload = {
        name: desc.title,
        slug: lowerSlug,
        group_name: 'Core System'
      };

      if (existingModuleMap.has(lowerSlug)) {
        // Update existing
        const id = existingModuleMap.get(lowerSlug);
        const data = await hasuraClient.request(UPDATE_MODULE, {
          id,
          set: { name: payload.name, group_name: payload.group_name }
        });
        results.push(data);
      } else {
        // Insert new
        const data = await hasuraClient.request(INSERT_MODULE, { object: payload });
        results.push(data);
      }
    }

    return NextResponse.json({
      message: `Successfully synchronized ${results.length} modules`,
      count: results.length
    });
  } catch (error: any) {
    console.error('Error syncing modules:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync modules' }, { status: 500 });
  }
}
