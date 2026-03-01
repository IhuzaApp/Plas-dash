// ─────────────────────────────────────────────────────────────────────────────
// Dummy data for Production / Recipe Management (UI-only, no backend)
// To connect to a real API, replace the exported constants with API calls
// that return the same shape of data.
// ─────────────────────────────────────────────────────────────────────────────

export type RecipeCategory =
    | 'Bread & Pastry'
    | 'Cakes & Desserts'
    | 'Beverages'
    | 'Savory'
    | 'Pizza'
    | 'Salads & Sides'
    | 'Sauces & Dressings';

export type ProductionStatus = 'Draft' | 'In Progress' | 'Completed' | 'Cancelled';

// ─── Master ingredient catalogue ──────────────────────────────────────────────
// Replace with: GET /api/ingredients  → { id, name, unit, unitCost }[]
export interface IngredientCatalogueItem {
    id: string;
    name: string;
    unit: string;     // default purchase/measure unit
    unitCost: number; // cost per unit (USD)
}

export const INGREDIENT_CATALOGUE: IngredientCatalogueItem[] = [
    // User-specified core items
    { id: 'cat-001', name: 'Flour', unit: 'kg', unitCost: 2.00 },
    { id: 'cat-002', name: 'Sugar', unit: 'kg', unitCost: 1.50 },
    { id: 'cat-003', name: 'Yeast', unit: 'kg', unitCost: 5.00 },
    { id: 'cat-004', name: 'Cheese', unit: 'kg', unitCost: 8.00 },
    // Additional common ingredients
    { id: 'cat-005', name: 'Butter', unit: 'kg', unitCost: 6.00 },
    { id: 'cat-006', name: 'Eggs', unit: 'piece', unitCost: 0.25 },
    { id: 'cat-007', name: 'Fresh Milk', unit: 'liter', unitCost: 0.80 },
    { id: 'cat-008', name: 'Cocoa Powder', unit: 'kg', unitCost: 7.50 },
    { id: 'cat-009', name: 'Baking Powder', unit: 'kg', unitCost: 4.00 },
    { id: 'cat-010', name: 'Salt', unit: 'kg', unitCost: 0.30 },
    { id: 'cat-011', name: 'Olive Oil', unit: 'liter', unitCost: 5.00 },
    { id: 'cat-012', name: 'Tomatoes', unit: 'kg', unitCost: 1.20 },
    { id: 'cat-013', name: 'Onions', unit: 'kg', unitCost: 0.60 },
    { id: 'cat-014', name: 'Garlic', unit: 'kg', unitCost: 3.00 },
    { id: 'cat-015', name: 'Heavy Cream', unit: 'liter', unitCost: 3.50 },
    { id: 'cat-016', name: 'Vanilla Extract', unit: 'liter', unitCost: 40.00 },
    { id: 'cat-017', name: 'Mozzarella', unit: 'kg', unitCost: 10.00 },
    { id: 'cat-018', name: 'Pizza Dough Base', unit: 'kg', unitCost: 1.80 },
];

// ─── Ingredient line (per recipe) ────────────────────────────────────────────
export interface RecipeIngredient {
    id: string;
    catalogueItemId: string; // → IngredientCatalogueItem.id  (replace with inventoryItemId in backend)
    name: string;
    quantity: number;
    unit: string;
    unitCost: number; // USD – auto-filled from catalogue, editable
}

// ─── Recipe ──────────────────────────────────────────────────────────────────
export interface Recipe {
    id: string;
    name: string;
    sku: string;
    category: RecipeCategory;
    description: string;
    yieldQty: number;
    yieldUnit: string;
    wastePct: number;        // 0-100 — % waste applied to ingredient cost
    sellingPrice: number;    // per unit (USD)
    labourCostPct: number;   // 0-100
    overheadCostPct: number; // 0-100
    ingredients: RecipeIngredient[];
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
}

// ─── Production Order ─────────────────────────────────────────────────────────
export interface ProductionOrder {
    id: string;
    recipeId: string;
    recipeName: string;
    batchQty: number;
    status: ProductionStatus;
    assignedStaff: string;
    scheduledDate: string;
    completedDate?: string;
    notes?: string;
    totalIngredientCost: number;
    createdAt: string;
}

// ─── Inventory snapshot (for stock simulation) ───────────────────────────────
export interface InventorySnapshot {
    id: string;
    name: string;
    currentStock: number;
    unit: string;
    lowStockThreshold: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK RECIPES
// ─────────────────────────────────────────────────────────────────────────────
export const DUMMY_RECIPES: Recipe[] = [
    {
        id: 'rec-001',
        name: 'Classic White Bread Loaf',
        sku: 'BRD-001',
        category: 'Bread & Pastry',
        description: 'A light, fluffy white bread loaf perfect for sandwiches.',
        yieldQty: 12,
        yieldUnit: 'loaves',
        wastePct: 5,
        sellingPrice: 3.50,
        labourCostPct: 15,
        overheadCostPct: 10,
        isActive: true,
        createdAt: '2025-11-01T08:00:00Z',
        updatedAt: '2026-01-15T09:00:00Z',
        ingredients: [
            { id: 'ri-001', catalogueItemId: 'cat-001', name: 'Flour', quantity: 5, unit: 'kg', unitCost: 2.00 },
            { id: 'ri-002', catalogueItemId: 'cat-003', name: 'Yeast', quantity: 0.05, unit: 'kg', unitCost: 5.00 },
            { id: 'ri-003', catalogueItemId: 'cat-010', name: 'Salt', quantity: 0.1, unit: 'kg', unitCost: 0.30 },
            { id: 'ri-004', catalogueItemId: 'cat-005', name: 'Butter', quantity: 0.3, unit: 'kg', unitCost: 6.00 },
            { id: 'ri-005', catalogueItemId: 'cat-007', name: 'Fresh Milk', quantity: 1.5, unit: 'liter', unitCost: 0.80 },
        ],
    },
    {
        id: 'rec-002',
        name: 'Chocolate Fudge Cake',
        sku: 'CKE-001',
        category: 'Cakes & Desserts',
        description: 'Rich, moist chocolate cake with fudge frosting.',
        yieldQty: 8,
        yieldUnit: 'slices',
        wastePct: 3,
        sellingPrice: 6.50,
        labourCostPct: 20,
        overheadCostPct: 12,
        isActive: true,
        createdAt: '2025-10-15T10:00:00Z',
        updatedAt: '2026-02-10T11:30:00Z',
        ingredients: [
            { id: 'ri-006', catalogueItemId: 'cat-001', name: 'Flour', quantity: 2, unit: 'kg', unitCost: 2.00 },
            { id: 'ri-007', catalogueItemId: 'cat-008', name: 'Cocoa Powder', quantity: 0.5, unit: 'kg', unitCost: 7.50 },
            { id: 'ri-008', catalogueItemId: 'cat-002', name: 'Sugar', quantity: 1.5, unit: 'kg', unitCost: 1.50 },
            { id: 'ri-009', catalogueItemId: 'cat-005', name: 'Butter', quantity: 0.5, unit: 'kg', unitCost: 6.00 },
            { id: 'ri-010', catalogueItemId: 'cat-006', name: 'Eggs', quantity: 6, unit: 'piece', unitCost: 0.25 },
            { id: 'ri-011', catalogueItemId: 'cat-007', name: 'Fresh Milk', quantity: 0.5, unit: 'liter', unitCost: 0.80 },
        ],
    },
    {
        id: 'rec-003',
        name: 'Butter Croissant',
        sku: 'BRD-002',
        category: 'Bread & Pastry',
        description: 'Flaky, buttery French-style croissants.',
        yieldQty: 24,
        yieldUnit: 'pieces',
        wastePct: 8,
        sellingPrice: 2.20,
        labourCostPct: 25,
        overheadCostPct: 10,
        isActive: true,
        createdAt: '2025-12-01T07:00:00Z',
        updatedAt: '2026-01-22T08:00:00Z',
        ingredients: [
            { id: 'ri-012', catalogueItemId: 'cat-001', name: 'Flour', quantity: 4, unit: 'kg', unitCost: 2.00 },
            { id: 'ri-013', catalogueItemId: 'cat-005', name: 'Butter', quantity: 2, unit: 'kg', unitCost: 6.00 },
            { id: 'ri-014', catalogueItemId: 'cat-002', name: 'Sugar', quantity: 0.2, unit: 'kg', unitCost: 1.50 },
            { id: 'ri-015', catalogueItemId: 'cat-010', name: 'Salt', quantity: 0.06, unit: 'kg', unitCost: 0.30 },
            { id: 'ri-016', catalogueItemId: 'cat-003', name: 'Yeast', quantity: 0.04, unit: 'kg', unitCost: 5.00 },
        ],
    },
    {
        id: 'rec-004',
        name: 'Margherita Pizza',
        sku: 'PIZ-001',
        category: 'Pizza',
        description: 'Classic Neapolitan pizza with tomato, mozzarella and basil.',
        yieldQty: 1,
        yieldUnit: 'pizza',
        wastePct: 4,
        sellingPrice: 12.00,
        labourCostPct: 18,
        overheadCostPct: 10,
        isActive: true,
        createdAt: '2026-01-05T09:00:00Z',
        updatedAt: '2026-01-30T10:00:00Z',
        ingredients: [
            { id: 'ri-017', catalogueItemId: 'cat-018', name: 'Pizza Dough Base', quantity: 0.3, unit: 'kg', unitCost: 1.80 },
            { id: 'ri-018', catalogueItemId: 'cat-012', name: 'Tomatoes', quantity: 0.2, unit: 'kg', unitCost: 1.20 },
            { id: 'ri-019', catalogueItemId: 'cat-017', name: 'Mozzarella', quantity: 0.15, unit: 'kg', unitCost: 10.00 },
            { id: 'ri-020', catalogueItemId: 'cat-004', name: 'Cheese', quantity: 0.05, unit: 'kg', unitCost: 8.00 },
            { id: 'ri-021', catalogueItemId: 'cat-011', name: 'Olive Oil', quantity: 0.02, unit: 'liter', unitCost: 5.00 },
            { id: 'ri-022', catalogueItemId: 'cat-010', name: 'Salt', quantity: 0.005, unit: 'kg', unitCost: 0.30 },
        ],
    },
    {
        id: 'rec-005',
        name: 'Vanilla Cheesecake',
        sku: 'CKE-002',
        category: 'Cakes & Desserts',
        description: 'Creamy New York-style vanilla cheesecake.',
        yieldQty: 10,
        yieldUnit: 'slices',
        wastePct: 5,
        sellingPrice: 7.00,
        labourCostPct: 20,
        overheadCostPct: 12,
        isActive: false,
        createdAt: '2026-01-20T11:00:00Z',
        updatedAt: '2026-02-05T12:00:00Z',
        ingredients: [
            { id: 'ri-023', catalogueItemId: 'cat-004', name: 'Cheese', quantity: 0.5, unit: 'kg', unitCost: 8.00 },
            { id: 'ri-024', catalogueItemId: 'cat-015', name: 'Heavy Cream', quantity: 0.3, unit: 'liter', unitCost: 3.50 },
            { id: 'ri-025', catalogueItemId: 'cat-002', name: 'Sugar', quantity: 0.3, unit: 'kg', unitCost: 1.50 },
            { id: 'ri-026', catalogueItemId: 'cat-006', name: 'Eggs', quantity: 4, unit: 'piece', unitCost: 0.25 },
            { id: 'ri-027', catalogueItemId: 'cat-016', name: 'Vanilla Extract', quantity: 0.01, unit: 'liter', unitCost: 40.00 },
            { id: 'ri-028', catalogueItemId: 'cat-001', name: 'Flour', quantity: 0.3, unit: 'kg', unitCost: 2.00 },
        ],
    },
    {
        id: 'rec-006',
        name: 'Classic Tomato Sauce',
        sku: 'SAU-001',
        category: 'Sauces & Dressings',
        description: 'A rich tomato sauce for pasta and pizza.',
        yieldQty: 10,
        yieldUnit: 'portions',
        wastePct: 5,
        sellingPrice: 1.50,
        labourCostPct: 10,
        overheadCostPct: 8,
        isActive: true,
        createdAt: '2026-01-05T09:00:00Z',
        updatedAt: '2026-01-30T10:00:00Z',
        ingredients: [
            { id: 'ri-029', catalogueItemId: 'cat-012', name: 'Tomatoes', quantity: 3, unit: 'kg', unitCost: 1.20 },
            { id: 'ri-030', catalogueItemId: 'cat-013', name: 'Onions', quantity: 0.5, unit: 'kg', unitCost: 0.60 },
            { id: 'ri-031', catalogueItemId: 'cat-014', name: 'Garlic', quantity: 0.1, unit: 'kg', unitCost: 3.00 },
            { id: 'ri-032', catalogueItemId: 'cat-011', name: 'Olive Oil', quantity: 0.2, unit: 'liter', unitCost: 5.00 },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK PRODUCTION ORDERS
// ─────────────────────────────────────────────────────────────────────────────
export const DUMMY_PRODUCTION_ORDERS: ProductionOrder[] = [
    {
        id: 'po-001', recipeId: 'rec-001', recipeName: 'Classic White Bread Loaf',
        batchQty: 5, status: 'Completed', assignedStaff: 'Alice Uwimana',
        scheduledDate: '2026-02-20T06:00:00Z', completedDate: '2026-02-20T10:00:00Z',
        totalIngredientCost: 45.50, notes: 'Morning batch for weekend rush.', createdAt: '2026-02-18T14:00:00Z',
    },
    {
        id: 'po-002', recipeId: 'rec-002', recipeName: 'Chocolate Fudge Cake',
        batchQty: 3, status: 'Completed', assignedStaff: 'Jean-Pierre Habimana',
        scheduledDate: '2026-02-21T08:00:00Z', completedDate: '2026-02-21T14:00:00Z',
        totalIngredientCost: 68.00, createdAt: '2026-02-19T09:00:00Z',
    },
    {
        id: 'po-003', recipeId: 'rec-003', recipeName: 'Butter Croissant',
        batchQty: 2, status: 'In Progress', assignedStaff: 'Marie Mukamana',
        scheduledDate: '2026-02-28T05:00:00Z', totalIngredientCost: 140.00,
        notes: 'Double-check lamination layers.', createdAt: '2026-02-26T16:00:00Z',
    },
    {
        id: 'po-004', recipeId: 'rec-004', recipeName: 'Margherita Pizza',
        batchQty: 10, status: 'In Progress', assignedStaff: 'Eric Nshimiyimana',
        scheduledDate: '2026-02-28T09:00:00Z', totalIngredientCost: 35.00, createdAt: '2026-02-27T11:00:00Z',
    },
    {
        id: 'po-005', recipeId: 'rec-006', recipeName: 'Classic Tomato Sauce',
        batchQty: 4, status: 'Draft', assignedStaff: 'Alice Uwimana',
        scheduledDate: '2026-03-01T06:00:00Z', totalIngredientCost: 72.00, createdAt: '2026-02-28T14:00:00Z',
    },
    {
        id: 'po-006', recipeId: 'rec-001', recipeName: 'Classic White Bread Loaf',
        batchQty: 8, status: 'Draft', assignedStaff: 'Jean-Pierre Habimana',
        scheduledDate: '2026-03-02T06:00:00Z', totalIngredientCost: 72.00, createdAt: '2026-02-28T15:00:00Z',
    },
    {
        id: 'po-007', recipeId: 'rec-002', recipeName: 'Chocolate Fudge Cake',
        batchQty: 2, status: 'Cancelled', assignedStaff: 'Marie Mukamana',
        scheduledDate: '2026-02-25T08:00:00Z', totalIngredientCost: 45.00,
        notes: 'Cancelled due to cocoa shortage.', createdAt: '2026-02-23T10:00:00Z',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// MOCK INVENTORY SNAPSHOT (for Stock Simulation)
// ─────────────────────────────────────────────────────────────────────────────
export const DUMMY_INVENTORY_SNAPSHOT = [
    { id: 'inv-001', name: 'Flour', currentStock: 120, unit: 'kg', lowStockThreshold: 20 },
    { id: 'inv-002', name: 'Sugar', currentStock: 80, unit: 'kg', lowStockThreshold: 15 },
    { id: 'inv-003', name: 'Butter', currentStock: 45, unit: 'kg', lowStockThreshold: 10 },
    { id: 'inv-004', name: 'Eggs', currentStock: 200, unit: 'piece', lowStockThreshold: 50 },
    { id: 'inv-005', name: 'Fresh Milk', currentStock: 60, unit: 'liter', lowStockThreshold: 10 },
    { id: 'inv-006', name: 'Cocoa Powder', currentStock: 18, unit: 'kg', lowStockThreshold: 5 },
    { id: 'inv-007', name: 'Baking Powder', currentStock: 12, unit: 'kg', lowStockThreshold: 3 },
    { id: 'inv-008', name: 'Vanilla Extract', currentStock: 8, unit: 'liter', lowStockThreshold: 2 },
    { id: 'inv-009', name: 'Salt', currentStock: 50, unit: 'kg', lowStockThreshold: 5 },
    { id: 'inv-010', name: 'Yeast', currentStock: 6, unit: 'kg', lowStockThreshold: 2 },
    { id: 'inv-011', name: 'Olive Oil', currentStock: 25, unit: 'liter', lowStockThreshold: 5 },
    { id: 'inv-012', name: 'Tomatoes', currentStock: 40, unit: 'kg', lowStockThreshold: 8 },
    { id: 'inv-013', name: 'Onions', currentStock: 35, unit: 'kg', lowStockThreshold: 5 },
    { id: 'inv-014', name: 'Garlic', currentStock: 10, unit: 'kg', lowStockThreshold: 2 },
    { id: 'inv-015', name: 'Heavy Cream', currentStock: 20, unit: 'liter', lowStockThreshold: 4 },
];

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD TREND DATA
// ─────────────────────────────────────────────────────────────────────────────
export const PRODUCTION_MONTHLY_TREND = [
    { month: 'Sep', batches: 18, units: 320, cost: 280 },
    { month: 'Oct', batches: 22, units: 410, cost: 350 },
    { month: 'Nov', batches: 25, units: 480, cost: 420 },
    { month: 'Dec', batches: 35, units: 680, cost: 590 },
    { month: 'Jan', batches: 28, units: 520, cost: 460 },
    { month: 'Feb', batches: 30, units: 560, cost: 510 },
];

export const RECIPE_PRODUCTION_VOLUME = DUMMY_RECIPES.map(r => ({
    name: r.name.length > 20 ? r.name.slice(0, 18) + '…' : r.name,
    fullName: r.name,
    batches: DUMMY_PRODUCTION_ORDERS.filter(o => o.recipeId === r.id && o.status === 'Completed').length,
})).sort((a, b) => b.batches - a.batches);

// ─────────────────────────────────────────────────────────────────────────────
// COST CALCULATION HELPERS
// These functions mirror what the backend should compute — easy to delete once
// the API returns pre-computed cost fields.
// ─────────────────────────────────────────────────────────────────────────────

/** Raw ingredient subtotal (USD) for one batch of the recipe */
export function computeIngredientCost(recipe: Recipe): number {
    return recipe.ingredients.reduce((sum, ing) => sum + ing.quantity * ing.unitCost, 0);
}

/**
 * Full cost breakdown for N batches.
 * wastePct inflates ingredient cost before applying labour & overhead.
 */
export function computeFullCost(
    recipe: Recipe,
    batches = 1
): {
    ingredientCost: number;
    wasteCost: number;
    labourCost: number;
    overheadCost: number;
    totalCost: number;
    costPerUnit: number;
} {
    const rawIngredient = computeIngredientCost(recipe) * batches;
    const wasteCost = rawIngredient * (recipe.wastePct / 100);
    const ingredientCost = rawIngredient + wasteCost;
    const labourCost = (ingredientCost * recipe.labourCostPct) / 100;
    const overheadCost = (ingredientCost * recipe.overheadCostPct) / 100;
    const totalCost = ingredientCost + labourCost + overheadCost;
    const costPerUnit = recipe.yieldQty * batches > 0 ? totalCost / (recipe.yieldQty * batches) : 0;
    return { ingredientCost, wasteCost, labourCost, overheadCost, totalCost, costPerUnit };
}
