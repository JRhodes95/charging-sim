import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for combining and merging Tailwind CSS classes
 * Combines clsx for conditional classes with twMerge for deduplication
 * @param inputs - Class values to combine and merge
 * @returns Merged and deduplicated class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}