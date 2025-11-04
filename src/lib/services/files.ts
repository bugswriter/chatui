// src/lib/services/files.ts

import { API_CONFIG, getAuthToken } from "$lib/services/api";

// --- Type Definitions ---

// The expected response from the backend when staging a file.
export interface UploadUrlResponse {
  upload_url: string;
  upload_fields: Record<string, string>;
  file_id: string;
  s3_key: string;
}

// --- Service Functions ---

/**
 * Asks the backend for a pre-signed URL to upload a file directly to S3.
 * @param filename The name of the file to be uploaded.
 * @param contentType The MIME type of the file.
 * @returns An object containing the upload URL, required fields, and file identifiers.
 */
export const getUploadUrl = async (
  filename: string,
  contentType: string,
): Promise<UploadUrlResponse> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication token not found. Please log in.");
  }

  const response = await fetch(`${API_CONFIG.sysAPIURL}/api/v1/files/stage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename,
      content_type: contentType,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to get upload URL:", errorText);
    throw new Error(`Server error: Could not prepare file for upload.`);
  }

  return response.json();
};

/**
 * Asks the backend for a temporary, secure URL to view or download a file.
 * @param fileId The unique ID of the file.
 * @returns A promise that resolves to the pre-signed URL string.
 */
export const getPresignedUrl = async (fileId: string): Promise<string> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication token not found. Please log in.");
  }

  const response = await fetch(
    `${API_CONFIG.sysAPIURL}/api/v1/files/${fileId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Could not retrieve file URL. Please try again.`);
  }

  const data = await response.json();
  return data.url;
};
