/**
 * Utility functions for generating URL-friendly slugs
 */

/**
 * Converts a vehicle nickname into a URL-safe slug format
 * @param name - The nickname to slugify
 * @returns A lowercase, hyphenated slug with non-alphanumeric characters removed
 */
export function slugifyNickname(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generates a complete slug for a vehicle using nickname and partial ID
 * @param nickname - The vehicle's nickname
 * @param id - The vehicle's full ID
 * @returns A slug in the format "slugified-nickname-partialId"
 */
export function generateSlug(nickname: string, id: string): string {
  const cleanNickname = slugifyNickname(nickname);
  const partialId = id.substring(0, 6);
  return `${cleanNickname || "untitled"}-${partialId}`;
}