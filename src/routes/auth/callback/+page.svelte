<!-- src/routes/auth/callback/+page.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { authToken } from "$lib/stores/tokenStore";
    import { Loader2 } from "lucide-svelte";

    // The 'data' prop is automatically populated by the return value
    // of the `load` function in the +page.ts file.
    export let data: { token: string | null; error: string | null };

    onMount(() => {
        // This code is GUARANTEED to run ONLY in the browser.
        if (data.error) {
            console.error("OAuth Callback Error:", data.error);
            // You can optionally show a toast/notification here
            goto("/"); // Redirect home on error
        } else if (data.token) {
            console.log(
                "OAuth callback successful. Token found, saving and redirecting...",
            );

            // 1. Save the token to localStorage via our synchronized store.
            authToken.set(data.token);

            // 2. Redirect to the homepage. The main layout will detect the new
            //    token and automatically complete the login process.
            goto("/", { replaceState: true });
        } else {
            // This handles the edge case where someone navigates here manually.
            console.error("Callback page loaded without a token or error.");
            goto("/");
        }
    });
</script>

<!-- This UI will be shown for a moment while the onMount logic runs -->
<div
    class="flex h-screen w-full flex-col items-center justify-center bg-white space-y-4"
>
    <Loader2 class="h-10 w-10 animate-spin text-blue-600" />
    <h1 class="text-xl font-semibold text-gray-800">Finalizing sign in...</h1>
    <p class="text-gray-500">Please wait, you will be redirected shortly.</p>
</div>
