// Storage utilities for LocalStorage management
// Includes quota checking and data compression

import type { TreeData, StorageInfo } from "../types/tree";

const STORAGE_KEY = "lifestory_trees";
const MAX_STORAGE_BYTES = 5 * 1024 * 1024; // 5MB localStorage limit
const WARNING_THRESHOLD = 0.8; // 80%

/**
 * Check current localStorage usage
 */
export function checkStorageQuota(): StorageInfo {
  let used = 0;

  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage.getItem(key)?.length || 0;
      }
    }
    // Convert char length to approximate bytes (2 bytes per char in UTF-16)
    used = used * 2;
  } catch (e) {
    console.error("Error checking storage:", e);
  }

  const percentage = used / MAX_STORAGE_BYTES;

  return {
    used,
    total: MAX_STORAGE_BYTES,
    percentage,
    warning: percentage >= WARNING_THRESHOLD,
  };
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Load trees from localStorage
 */
export function loadTrees(): TreeData[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as TreeData[];
    }
  } catch (e) {
    console.error("Failed to load trees:", e);
  }

  return [];
}

/**
 * Save trees to localStorage with quota check
 */
export function saveTrees(trees: TreeData[]): {
  success: boolean;
  error?: string;
} {
  if (typeof window === "undefined") {
    return { success: false, error: "Not in browser" };
  }

  try {
    const data = JSON.stringify(trees);
    const dataSize = data.length * 2; // Approximate bytes

    const quota = checkStorageQuota();
    const newUsage =
      quota.used -
      (localStorage.getItem(STORAGE_KEY)?.length || 0) * 2 +
      dataSize;

    if (newUsage > MAX_STORAGE_BYTES) {
      return {
        success: false,
        error: `Storage penuh! Gunakan ${formatBytes(
          newUsage
        )} dari ${formatBytes(
          MAX_STORAGE_BYTES
        )}. Hapus beberapa foto atau export data.`,
      };
    }

    localStorage.setItem(STORAGE_KEY, data);
    return { success: true };
  } catch (e) {
    console.error("Failed to save trees:", e);
    return { success: false, error: "Gagal menyimpan data" };
  }
}

/**
 * Export trees as JSON file download
 */
export function exportToJSON(
  trees: TreeData[],
  filename: string = "lifestory-backup"
): void {
  const data = JSON.stringify(trees, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}-${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import trees from JSON file
 */
export function importFromJSON(file: File): Promise<TreeData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data)) {
          resolve(data as TreeData[]);
        } else {
          reject(new Error("Invalid format: expected array"));
        }
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/**
 * Clear all tree data (with confirmation)
 */
export function clearAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
}
