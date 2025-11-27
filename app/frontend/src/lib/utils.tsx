import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Formats large numbers in a readable way (e.g., 100B, 50M, 1.5K)
 * @param num The number to format
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted string (e.g., "100B", "50M", "1.5K")
 */
export function formatLargeNumber(num: number, decimals: number = 1): string {
  if (num === 0) return "0";
  
  const absNum = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  
  if (absNum >= 1_000_000_000_000) {
    // Trillions
    return `${sign}${(absNum / 1_000_000_000_000).toFixed(decimals)}T`;
  } else if (absNum >= 1_000_000_000) {
    // Billions
    return `${sign}${(absNum / 1_000_000_000).toFixed(decimals)}B`;
  } else if (absNum >= 1_000_000) {
    // Millions
    return `${sign}${(absNum / 1_000_000).toFixed(decimals)}M`;
  } else if (absNum >= 1_000) {
    // Thousands
    return `${sign}${(absNum / 1_000).toFixed(decimals)}K`;
  } else {
    // Less than 1000, show with 2 decimal places
    return `${sign}${absNum.toFixed(2)}`;
  }
}

/**
 * Formats currency amounts in a readable way (e.g., $100B USD, $50M USD, $1.5K USD)
 * @param amount The amount to format
 * @returns Formatted string (e.g., "$100B USD", "$50M USD", "$1.5K USD")
 */
export function formatLargeCurrency(amount: number): string {
  return `$${formatLargeNumber(amount)} USD`;
}

