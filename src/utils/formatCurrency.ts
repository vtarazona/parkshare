/**
 * Format cents to display price (e.g., 250 -> "2,50 €")
 */
export function formatCents(cents: number): string {
  const euros = cents / 100;
  return euros.toFixed(2).replace('.', ',') + ' €';
}

/**
 * Format price per hour for display (e.g., 150 -> "1,50 €/h")
 */
export function formatPricePerHour(cents: number): string {
  return formatCents(cents) + '/h';
}
