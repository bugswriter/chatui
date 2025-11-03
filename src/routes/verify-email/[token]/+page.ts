// src/routes/verify-email/[token]/+page.ts

import { API_CONFIG } from "$lib/services/api";
import { error } from "@sveltejs/kit";

/** @type {import('./$types').PageLoad} */
export const load = async ({ params, fetch }) => {
  // 1. Get the token from the dynamic route parameter
  const token = params.token;

  if (!token) {
    // This should not happen if the route is hit, but is a safeguard
    throw error(400, "Verification token missing.");
  }

  try {
    // 2. Send the POST request to the verification endpoint
    const response = await fetch(
      `${API_CONFIG.authBaseUrl}/api/v1/auth/verify-email/confirm`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }), // 3. Send in required JSON format
      },
    );

    const data = await response.json().catch(() => ({
      detail: "Server did not return a valid JSON response.",
    }));

    // 4. Return status and message to the Svelte component
    if (response.ok) {
      return {
        status: "success",
        message: data.message || "Email verified successfully!",
      };
    } else {
      return {
        status: "error",
        message:
          data.detail ||
          `Verification failed (Status: ${response.status}). The token may be invalid or expired.`,
      };
    }
  } catch (e) {
    console.error("Email verification network error:", e);
    return {
      status: "error",
      message:
        "A network error occurred. Please check your internet connection or try again later.",
    };
  }
};
