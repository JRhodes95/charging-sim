import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugifyNickname(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function generateSlug(nickname: string, id: string): string {
  const cleanNickname = slugifyNickname(nickname);
  const partialId = id.substring(0, 6);
  return `${cleanNickname || "untitled"}-${partialId}`;
}
