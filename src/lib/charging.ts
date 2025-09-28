/**
 * Utility functions for electric vehicle charging operations
 */

/**
 * Formats a charge percentage to display with one decimal place
 * @param input - The charge percentage as a number
 * @returns The formatted percentage string with one decimal place
 */
export function formatChargePercentage(input: number): string {
  return input.toFixed(1);
}

/**
 * Returns the appropriate Tailwind CSS background color class based on charge level
 * @param charge - The charge percentage (0-100)
 * @returns The Tailwind CSS class for the appropriate color
 */
export function getChargeStatusColor(charge: number): string {
  if (charge > 80) return "bg-green-500";
  if (charge > 50) return "bg-yellow-500";
  if (charge > 20) return "bg-orange-500";
  return "bg-red-500";
}

/**
 * Returns a human-readable status text based on charge level
 * @param charge - The charge percentage (0-100)
 * @returns A descriptive status text
 */
export function getChargeStatusText(charge: number): string {
  if (charge > 80) return "Excellent";
  if (charge > 50) return "Good";
  if (charge > 20) return "Low";
  return "Critical";
}