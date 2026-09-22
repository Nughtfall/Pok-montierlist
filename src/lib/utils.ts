import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function displayTier(tier: string) {
  return tier.replace("_PLUS", "+").replaceAll("_", " ");
}
