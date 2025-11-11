// src/lib/services/files.ts

import { API_CONFIG, getAuthToken } from "$lib/services/api";
import type { Attachment } from "$lib/types";

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
 * Confirms with the backend that a file upload is complete.
 * This triggers the backend to save the file's metadata permanently.
 * @param fileData The data received from the initial /stage endpoint.
 */
export const confirmUpload = async (fileData: {
  file_id: string;
  s3_key: string;
  filename: string;
  content_type: string;
}): Promise<void> => {
  const token = getAuthToken();
  if (!token) {
    throw new Error("Authentication token not found.");
  }

  const response = await fetch(`${API_CONFIG.sysAPIURL}/api/v1/files/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(fileData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to confirm upload:", errorText);
    throw new Error(
      `Server error: Could not confirm file upload for ${fileData.filename}.`,
    );
  }
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

  // ✅ FIX: Add '/view' to the end of the URL to match the backend route.
  const response = await fetch(
    `${API_CONFIG.sysAPIURL}/api/v1/files/${fileId}/view`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    // Add more context to the error message.
    const errorText = await response.text();
    console.error(`Failed to get presigned URL for ${fileId}:`, errorText);
    throw new Error(`Could not retrieve file URL for ${fileId}.`);
  }

  const data = await response.json();
  return data.url;
};

/**
 * ✅ FIX: Add this new, centralized download function.
 * Handles the entire file download process securely and efficiently.
 * 1. Fetches a fresh, temporary presigned URL for the given file ID.
 * 2. Triggers a browser download of the file content.
 * @param attachment The attachment object containing at least a file_id and filename.
 */
export const downloadFile = async (attachment: Attachment): Promise<void> => {
  if (!attachment.file_id) {
    throw new Error("Cannot download file: file_id is missing.");
  }

  try {
    // Step 1: Get a fresh, secure URL on-demand.
    const url = await getPresignedUrl(attachment.file_id);

    // Step 2: Use the Fetch API to get the file content as a blob.
    // This is more robust than directly using an anchor tag for cross-origin resources.
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch file: ${response.status} ${response.statusText}`,
      );
    }
    const blob = await response.blob();

    // Step 3: Create a temporary link and programmatically click it to trigger the download.
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = attachment.filename || "download";
    document.body.appendChild(link);
    link.click();

    // Step 4: Clean up by removing the link and revoking the object URL.
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Error during file download:", error);
    // Re-throw the error so the UI can catch it and display a message if needed.
    throw error;
  }
};
