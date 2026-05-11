import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { getUserContext } from '@/lib/auth-server';
import { gql } from 'graphql-request';

const GLOBAL_SEARCH_QUERY = gql`
  query GlobalSearch(
    $userWhere: Users_bool_exp!,
    $shopperWhere: shoppers_bool_exp!,
    $projectUserWhere: ProjectUsers_bool_exp!,
    $orderWhere: Orders_bool_exp!,
    $reelOrderWhere: reel_orders_bool_exp!,
    $businessOrderWhere: businessProductOrders_bool_exp!,
    $packageWhere: package_delivery_bool_exp!,
    $restaurantOrderWhere: restaurant_orders_bool_exp!,
    $shopWhere: Shops_bool_exp!,
    $restaurantWhere: Restaurants_bool_exp!,
    $petVendorWhere: pet_vendors_bool_exp!,
    $logisticsWhere: logisticsAccount_bool_exp!,
    $businessStoreWhere: business_stores_bool_exp!,
    $vehicleWhere: vehicles_bool_exp!,
    $employeeWhere: orgEmployees_bool_exp!
  ) {
    Users(where: $userWhere, limit: 15) { email name phone id }
    shoppers(where: $shopperWhere, limit: 15) { phone id email Employment_id full_name phone_number plate_number }
    ProjectUsers(where: $projectUserWhere, limit: 15) { email username id }
    Orders(where: $orderWhere, limit: 15) { OrderID id pin status total }
    reel_orders(where: $reelOrderWhere, limit: 15) { OrderID id pin status }
    businessProductOrders(where: $businessOrderWhere, limit: 15) { pin OrderID id status }
    package_delivery(where: $packageWhere, limit: 15) { id DeliveryCode status }
    restaurant_orders(where: $restaurantOrderWhere, limit: 15) { pin id OrderID status }
    Shops(where: $shopWhere, limit: 15) { id name }
    Restaurants(where: $restaurantWhere, limit: 15) { id name }
    pet_vendors(where: $petVendorWhere, limit: 15) { id fullname }
    logisticsAccount(where: $logisticsWhere, limit: 15) { id fullname }
    business_stores(where: $businessStoreWhere, limit: 15) { id name }
    vehicles(where: $vehicleWhere, limit: 15) { id plate_number }
    orgEmployees(where: $employeeWhere, limit: 15) { fullnames id employeeID }
  }
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const scope = searchParams.get('scope');

  if (!query && !scope) {
    return NextResponse.json({ results: null });
  }

  try {
    const userContext = await getUserContext(request);
    if (!userContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isProjectUser, shop_id, restaurant_id, userId } = userContext;
    
    if (!hasuraClient) {
      throw new Error('Hasura client not initialized');
    }

    const trimmedQuery = (query || '').trim();
    const searchTerm = `%${trimmedQuery}%`;
    const numericQuery = parseInt(trimmedQuery);
    const isNumeric = !isNaN(numericQuery) && /^\d+$/.test(trimmedQuery);

    const searchCond = { _ilike: searchTerm };
    const falseCond = { id: { _eq: '00000000-0000-0000-0000-000000000000' } };
    const inScope = (cat: string) => !scope || scope === 'all' || scope === cat;

    const shopFilter = !isProjectUser && shop_id ? { shop_id: { _eq: shop_id } } : null;
    const restaurantFilter = !isProjectUser && restaurant_id ? { restaurant_id: { _eq: restaurant_id } } : null;
    const shopIdFilter = !isProjectUser && shop_id ? { id: { _eq: shop_id } } : null;
    const restaurantIdFilter = !isProjectUser && restaurant_id ? { id: { _eq: restaurant_id } } : null;

    const variables = {
      userWhere: inScope('user') ? { _or: [{ name: searchCond }, { email: searchCond }, { phone: searchCond }] } : falseCond,
      shopperWhere: inScope('shopper') ? { _or: [{ full_name: searchCond }, { email: searchCond }, { phone_number: searchCond }, { phone: searchCond }, { plate_number: searchCond }, ...(isNumeric ? [{ Employment_id: { _eq: numericQuery } }] : [])] } : falseCond,
      projectUserWhere: inScope('admin') ? { _or: [{ username: searchCond }, { email: searchCond }] } : falseCond,
      
      orderWhere: inScope('order') ? { 
        _and: [
          { _or: [
            { status: searchCond },
            { pin: { _ilike: searchTerm } },
            ...(isNumeric ? [{ OrderID: { _eq: numericQuery } }] : [])
          ]}, 
          ...(shopFilter ? [shopFilter] : [])
        ]
      } : falseCond,
      
      reelOrderWhere: inScope('order') ? { _or: [{ status: searchCond }, { pin: { _ilike: searchTerm } }, ...(isNumeric ? [{ OrderID: { _eq: numericQuery } }] : [])] } : falseCond,
      businessOrderWhere: inScope('order') ? { _or: [{ status: searchCond }, ...(isNumeric ? [{ pin: { _eq: numericQuery } }, { OrderID: { _eq: numericQuery } }] : [])] } : falseCond,
      packageWhere: inScope('order') ? { _and: [{ DeliveryCode: searchCond }, (!isProjectUser && userId ? { user_id: { _eq: userId } } : {})].filter(v => Object.keys(v).length > 0) } : falseCond,
      restaurantOrderWhere: inScope('order') ? { _and: [{ _or: [{ status: searchCond }, { pin: { _ilike: searchTerm } }, ...(isNumeric ? [{ OrderID: { _eq: numericQuery } }] : [])]}, ...(restaurantFilter ? [restaurantFilter] : [])] } : falseCond,
      
      shopWhere: inScope('shop') ? { _and: [{ name: searchCond }, ...(shopIdFilter ? [shopIdFilter] : [])] } : falseCond,
      restaurantWhere: inScope('restaurant') ? { _and: [{ name: searchCond }, ...(restaurantIdFilter ? [restaurantIdFilter] : [])] } : falseCond,
      petVendorWhere: inScope('shop') ? { fullname: searchCond } : falseCond,
      logisticsWhere: inScope('shop') ? { fullname: searchCond } : falseCond,
      businessStoreWhere: inScope('shop') ? { name: searchCond } : falseCond,
      vehicleWhere: inScope('vehicle') ? { plate_number: searchCond } : falseCond,
      employeeWhere: inScope('staff') ? { _and: [{ _or: [{ fullnames: searchCond }, ...(isNumeric ? [{ employeeID: { _eq: numericQuery } }] : [])]}, (!isProjectUser ? {_or: [...(shop_id ? [{ shop_id: { _eq: shop_id } }] : []), ...(restaurant_id ? [{ restaurant_id: { _eq: restaurant_id } }] : [])]} : {})].filter(v => Object.keys(v).length > 0) } : falseCond
    };

    const data: any = await hasuraClient.request(GLOBAL_SEARCH_QUERY, variables);
    
    // Log exactly what was found in each category to find the "invisible" result
    console.log(`Search for "${query}" (Scope: ${scope}) found:`);
    Object.keys(data || {}).forEach(key => {
      if (data[key]?.length > 0) {
        console.log(` - ${key}: ${data[key].length} items`);
      }
    });

    return NextResponse.json({ results: data || {} });
  } catch (error: any) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
