import { NextResponse } from 'next/server';
import { hasuraClient } from '../../../../lib/hasuraClient';
import { normalizeSubdomain } from '../../../../lib/utils';

const GET_ALL_BUSINESSES = `
  query GetAllBusinesses {
    Shops {
      id
      name
      logo
    }
    Restaurants {
      id
      name
      logo
    }
  }
`;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');
    const id = searchParams.get('id');

    if (!subdomain && !id) {
      return NextResponse.json({ error: 'Subdomain or ID is required' }, { status: 400 });
    }

    if (!hasuraClient) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Fetch all businesses to match
    const data = await hasuraClient.request<{ Shops: any[]; Restaurants: any[] }>(GET_ALL_BUSINESSES);

    const matchedShop = data.Shops.find(s => 
      id ? s.id === id : normalizeSubdomain(s.name) === subdomain
    );
    if (matchedShop) {
      return NextResponse.json({
        id: matchedShop.id,
        name: matchedShop.name,
        logo: matchedShop.logo,
        type: 'shop'
      });
    }

    const matchedRestaurant = data.Restaurants.find(r => 
      id ? r.id === id : normalizeSubdomain(r.name) === subdomain
    );
    if (matchedRestaurant) {
      return NextResponse.json({
        id: matchedRestaurant.id,
        name: matchedRestaurant.name,
        logo: matchedRestaurant.logo,
        type: 'restaurant'
      });
    }

    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Business lookup error:', error);
    return NextResponse.json({ error: error.message || 'Lookup failed' }, { status: 500 });
  }
}
