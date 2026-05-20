/**
 * aiProductsIndex.js — #366
 * Single source of truth for CANONICAL_SERVICE_PRODUCTS and AI_PRODUCTS.
 * Both are exported from this file — do NOT define them in multiple places.
 *
 * Usage: import { CANONICAL_SERVICE_PRODUCTS, AI_PRODUCTS } from "@/data/aiProductsIndex";
 */

// #366: CANONICAL_SERVICE_PRODUCTS and AI_PRODUCTS both came from aiProducts.js
// This index file ensures a single import source — avoids duplicate definitions

export { CANONICAL_SERVICE_PRODUCTS, AI_PRODUCTS } from "./aiProducts";
