import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "RD$") {
  return `${currency} ${amount.toLocaleString("es-DO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function generateQuoteCode(
  prefix: string,
  number: number,
  length = 6,
): string {
  const padded = number.toString().padStart(length, "0");
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${padded}`;
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay = 300,
) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface SharePayload {
  title?: string;
  text?: string;
  url: string;
}

export async function shareContent(
  payload: SharePayload,
  onCopy?: () => void,
): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({
        title: payload.title || "",
        text: payload.text || "",
        url: payload.url,
      });
      return true;
    }
  } catch (err: any) {
    if (err?.name === "AbortError") return false;
  }

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(payload.url);
      if (onCopy) onCopy();
      return true;
    }
  } catch {}

  // Last resort: select the URL so the user can copy it manually
  const input = document.createElement("input");
  input.value = payload.url;
  document.body.appendChild(input);
  input.select();
  try {
    document.execCommand("copy");
    if (onCopy) onCopy();
  } finally {
    document.body.removeChild(input);
  }
  return true;
}

export async function downloadFile(
  url: string,
  filename: string,
): Promise<void> {
  try {
    const response = await fetch(url, { mode: "cors" });
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch {
    // Fallback for cross-origin or network errors: open in new tab
    window.open(url, "_blank");
  }
}
