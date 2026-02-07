import { NextResponse } from "next/server";
import { hasuraClient } from "@/lib/hasuraClient";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  if (!query || typeof query !== "string") {
    return NextResponse.json(
      { message: "Query parameter is required" },
      { status: 400 }
    );
  }
  try {
    const searchTerm = `%${query}%`;
    const results: any[] = [];
    if (!hasuraClient) {
      throw new Error("Hasura client not initialized");
    }
    const productsQuery = `
      query SearchProducts($searchTerm: String!) {
        Products(where: {_or: [{ProductName: {name: {_ilike: $searchTerm}}}, {ProductName: {description: {_ilike: $searchTerm}}}]}) {
          id
          ProductName {
            name
            description
          }
          price
          final_price
          image
          Shop {
            id
            name
          }
        }
      }
    `;
    const productsResponse = (await hasuraClient.request(productsQuery, {
      searchTerm,
    })) as any;
    const products = productsResponse.Products.map((product: any) => ({
      ...product,
      name: product.ProductName?.name || product.name,
      description: product.ProductName?.description || product.description,
      type: "product",
      shop_name: product.Shop?.name,
      shop_id: product.Shop?.id,
      image_url: product.image,
      price: product.final_price || product.price,
    }));
    results.push(...products);
    const shopsQuery = `
      query SearchShops($searchTerm: String!) {
        Shops(where: {_or: [{name: {_ilike: $searchTerm}}, {description: {_ilike: $searchTerm}}]}) {
          id
          name
          description
          address
          image
        }
      }
    `;
    const shopsResponse = (await hasuraClient.request(shopsQuery, {
      searchTerm,
    })) as any;
    const shops = shopsResponse.Shops.map((shop: any) => ({
      ...shop,
      type: "shop",
      image_url: shop.image,
    }));
    results.push(...shops);
    try {
      const recipesResponse = await fetch(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`
      );
      const recipesData = await recipesResponse.json();
      if (recipesData.meals) {
        const recipes = recipesData.meals.map((recipe: any) => ({
          id: recipe.idMeal,
          name: recipe.strMeal,
          description: recipe.strCategory || "Recipe",
          cooking_time: recipe.strArea || "Various",
          image_url: recipe.strMealThumb,
          type: "recipe",
        }));
        results.push(...recipes);
      }
    } catch {
      console.log("TheMealDB API error, skipping recipes search");
    }
    const sortedResults = results.sort((a, b) => {
      const aName = a.name?.toLowerCase() || "";
      const bName = b.name?.toLowerCase() || "";
      const searchLower = query.toLowerCase();
      const aExact = aName === searchLower;
      const bExact = bName === searchLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      const aStarts = aName.startsWith(searchLower);
      const bStarts = bName.startsWith(searchLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
    return NextResponse.json({ results: sortedResults });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
