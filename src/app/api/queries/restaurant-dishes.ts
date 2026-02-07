import { NextApiRequest, NextApiResponse } from "next";
import { hasuraClient } from "../../../src/lib/hasuraClient";
import { gql } from "graphql-request";

const GET_RESTAURANT_DISHES = gql`
  query GetRestaurantDishes($restaurant_id: uuid!) {
    restaurant_menu(
      where: { restaurant_id: { _eq: $restaurant_id } }
      order_by: { dishes: { name: asc }, ProductNames: { name: asc } }
    ) {
      id
      price
      discount
      quantity
      restaurant_id
      is_active
      SKU
      created_at
      updated_at
      promo
      promo_type
      preparingTime
      dish_id
      dishes {
        category
        created_at
        description
        id
        image
        ingredients
        name
        update_at
      }
      product_id
      ProductNames {
        barcode
        create_at
        description
        id
        image
        name
        sku
      }
    }
  }
`;

const GET_ALL_RESTAURANT_DISHES = gql`
  query GetAllRestaurantDishes {
    restaurant_menu(
      order_by: { ProductNames: { name: asc }, dishes: { name: asc } }
    ) {
      id
      price
      discount
      quantity
      restaurant_id
      is_active
      SKU
      created_at
      updated_at
      promo
      promo_type
      preparingTime
      dish_id
      product_id
      dishes {
        category
        created_at
        description
        id
        image
        ingredients
        name
        update_at
      }
      ProductNames {
        barcode
        create_at
        description
        id
        image
        name
        sku
      }
    }
  }
`;

// Raw response shape from Hasura (restaurant_menu + related tables)
interface RestaurantMenuDishRow {
  id: string;
  price: string;
  discount?: string | null;
  quantity: number;
  restaurant_id: string;
  is_active: boolean;
  SKU?: string | null;
  created_at: string;
  updated_at: string;
  promo?: boolean | null;
  promo_type?: string | null;
  preparingTime?: string | null;
  dish_id?: string | null;
  product_id?: string | null;
  dishes?: {
    category?: string | null;
    created_at: string;
    description?: string | null;
    id: string;
    image?: string | null;
    ingredients?: string | any;
    name: string;
    update_at: string;
  } | null;
  ProductNames?: {
    barcode?: string | null;
    create_at: string;
    description?: string | null;
    id: string;
    image?: string | null;
    name: string;
    sku?: string | null;
  } | null;
}

interface RestaurantMenuResponse {
  restaurant_menu: RestaurantMenuDishRow[];
}

// Transformed dish shape returned to the frontend
interface TransformedDish {
  id: string;
  name: string;
  description: string;
  price: string;
  image?: string;
  ingredients?: string | any; // jsonb can be string or object
  discount?: string;
  quantity: number;
  restaurant_id: string;
  is_active: boolean;
  category?: string;
  promo?: boolean;
  promo_type?: string;
  preparingTime?: string; // Preparation time as string from database (e.g., "15min", "1hr", "")
}

// Helper function to validate UUID format
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!hasuraClient) {
      throw new Error("Hasura client is not initialized");
    }

    const { restaurant_id } = req.query;

    let data: RestaurantMenuResponse;

    if (
      restaurant_id &&
      restaurant_id !== "undefined" &&
      isValidUUID(restaurant_id as string)
    ) {
      // Fetch dishes for a specific restaurant (restaurant_menu rows)
      data = await hasuraClient.request<RestaurantMenuResponse>(
        GET_RESTAURANT_DISHES,
        { restaurant_id }
      );
    } else {
      // If restaurant_id is invalid, log the issue and return empty dishes
      if (restaurant_id && restaurant_id !== "undefined") {
        console.warn(
          `Invalid restaurant_id provided: ${restaurant_id}. Expected valid UUID format.`
        );
      }

      // Fetch all dishes if no valid restaurant_id provided
      data = await hasuraClient.request<RestaurantMenuResponse>(
        GET_ALL_RESTAURANT_DISHES
      );
    }

    // Transform restaurant_menu rows into the Dish[] shape expected by the frontend
    const dishes: TransformedDish[] = (data.restaurant_menu || []).map(
      (menuItem) => {
        const product = menuItem.ProductNames;
        const dish = menuItem.dishes;

        return {
          id: menuItem.id,
          name: product?.name || dish?.name || "Unnamed Dish",
          description: product?.description || dish?.description || "",
          price: menuItem.price,
          image: product?.image || dish?.image || undefined,
          ingredients: dish?.ingredients ?? undefined,
          discount: menuItem.discount || undefined,
          quantity: menuItem.quantity,
          restaurant_id: menuItem.restaurant_id,
          is_active: menuItem.is_active,
          category: dish?.category || undefined,
          promo: !!menuItem.promo,
          promo_type: menuItem.promo_type || undefined,
          preparingTime: menuItem.preparingTime || undefined,
        };
      }
    );

    res.status(200).json({ dishes });
  } catch (error) {
    console.error("Error fetching restaurant dishes:", error);
    res.status(500).json({ error: "Failed to fetch restaurant dishes" });
  }
}
