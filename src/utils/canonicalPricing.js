/**
 * salesCatalog.js pricing fix — #361
 * CANONICAL PRICING (do not change without Nolan approval):
 * - Individual service: setup_fee = $297, monthly_fee = $97
 * - Starter bundle: $797 setup + $497/mo (2 services)
 * - Growth bundle: $1,297 setup + $997/mo (4 services)
 * - Elite bundle: $2,497 setup + $1,997/mo (6 services)
 *
 * Previous values were incorrect — see task #361.
 * This file documents the canonical values; update salesCatalog.js to match.
 */

export const CANONICAL_PRICING = {
  individual_service: { setup_fee: 297, monthly_fee: 97 },
  starter: { setup_fee: 797, monthly_rate: 497, services: 2 },
  growth: { setup_fee: 1297, monthly_rate: 997, services: 4 },
  elite: { setup_fee: 2497, monthly_rate: 1997, services: 6 },
};

// #361: verify salesCatalog.js individual service prices match CANONICAL_PRICING.individual_service
// If salesCatalog.js has different values, update them to: setup_fee: 297, monthly_fee: 97
