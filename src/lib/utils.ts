/**
 * Converts a file size in bytes to a human-readable string (KB, MB, GB).
 * @param bytes The file size in bytes.
 * @returns A formatted string like "1.2 MB" or an empty string if input is invalid.
 */
export function formatFileSize(bytes: number | undefined): string {
  if (!bytes || bytes === 0) return "";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  // Prevent errors from Math.log(0)
  const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
