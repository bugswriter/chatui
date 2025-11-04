// src/routes/auth/callback/+page.ts

import { goto } from "$app/navigation";
import { authToken } from "$lib/stores/tokenStore";
import { error } from "@sveltejs/kit";

/** @type {import('./$types').PageLoad} */
export const load = async ({ url }) => {
  // This function must run on the client, as it accesses localStorage via the store
  // and performs a client-side redirect. SvelteKit handles this correctly.

  const token = url.searchParams.get("token");
  const errorMsg = url.searchParams.get("error");

  if (errorMsg) {
    // If the backend detected an error (e.g., invalid state), it can redirect with an error param
    console.error("OAuth Callback Error:", errorMsg);
    // Redirect to home page, maybe with an error message shown via another store or query param
    goto("/");
    // Throw a client-side error to stop further execution
    throw error(400, "Authentication failed: " + errorMsg);
  }

  if (token) {
    // ✅ SUCCESS: We found a token in the URL.
    console.log("OAuth callback successful, token received.");

    // 1. Save the token. Our tokenStore automatically syncs to localStorage.
    authToken.set(token);

    // 2. Redirect the user to the homepage. The main layout's `onMount`
    //    will see the new token and run `authStore.initialize()`,
    //    completing the login process.
    //    `replaceState: true` removes the callback URL from browser history.
    goto("/", { replaceState: true });

    // Return an empty object because we are redirecting away.
    return {};
  } else {
    // This happens if the user lands on /auth/callback without a token.
    console.error("OAuth Callback Error: No token found in URL.");
    goto("/");
    throw error(400, "Invalid authentication callback.");
  }
};
