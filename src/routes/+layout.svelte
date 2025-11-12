<!-- src/routes/+layout.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import "../app.css";

    import { browser } from "$app/environment"; // <-- ADD THIS IMPORT
    import { goto } from "$app/navigation";
    import Navbar from "$lib/components/Navbar.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import LoginModal from "$lib/components/auth/LoginModal.svelte";
    import ForgotPassword from "$lib/components/auth/ForgotPassword.svelte";
    import RegisterModal from "$lib/components/auth/RegisterModal.svelte";
    import { uiStore } from "$lib/stores/uiStore";
    import { page } from "$app/stores";

    // ✅ THIS IS THE KEY CHANGE.
    // The `data` prop is automatically passed from your +layout.ts file.
    export let data;

    let previousIsAuthenticated = data.isAuthenticated;
    $: {
        // This block runs whenever `data` changes.
        // We only care about the transition from logged-in to logged-out.
        if (browser && previousIsAuthenticated && !data.isAuthenticated) {
            goto("/", { replaceState: true });
        }
        // Update the state for the next check.
        previousIsAuthenticated = data.isAuthenticated;
    }

    // --- Theme Management (Unchanged) ---
    let theme: "light" | "dark" = "light";
    onMount(() => {
        const savedTheme = localStorage.getItem("theme");
        const systemPrefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)",
        ).matches;
        theme =
            savedTheme === "dark" || (!savedTheme && systemPrefersDark)
                ? "dark"
                : "light";
        updateHtmlClass(theme);

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const systemThemeListener = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem("theme")) {
                theme = e.matches ? "dark" : "light";
                updateHtmlClass(theme);
            }
        };
        mediaQuery.addEventListener("change", systemThemeListener);
        return () =>
            mediaQuery.removeEventListener("change", systemThemeListener);
    });

    function updateHtmlClass(newTheme: "light" | "dark") {
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    }

    function toggleTheme() {
        theme = theme === "dark" ? "light" : "dark";
        localStorage.setItem("theme", theme);
        updateHtmlClass(theme);
    }
    // --- End Theme Management ---

    $: isChatPage =
        $page.url.pathname === "/" || $page.url.pathname.startsWith("/c/");

    function handleLoginSuccess() {
        uiStore.closeModals();
    }
</script>

<!-- ✅ REMOVED: The #if $authStore.isLoading block is no longer needed.
SvelteKit's router handles the loading state implicitly by waiting for the `load` function. -->

<div class="flex h-screen flex-col bg-background text-foreground">
    <!-- ✅ PASS DATA AS PROPS: We pass the auth state down to the Navbar. -->
    <Navbar
        isAuthenticated={data.isAuthenticated}
        user={data.user}
        currentTheme={theme}
        on:toggle={toggleTheme}
    />

    <main class="flex-1 flex flex-col overflow-y-auto">
        <slot />
    </main>

    {#if !isChatPage}
        <Footer />
    {/if}
</div>

<!-- Modals (Unchanged) -->
<LoginModal
    isOpen={$uiStore.isLoginModalOpen}
    on:success={handleLoginSuccess}
    on:switchToRegister={uiStore.openRegisterModal}
    on:switchToForgotPassword={uiStore.openForgotPasswordModal}
    on:close={uiStore.closeModals}
/>
<RegisterModal
    isOpen={$uiStore.isRegisterModalOpen}
    on:switchToLogin={uiStore.openLoginModal}
    on:close={uiStore.closeModals}
/>
<ForgotPassword
    isOpen={$uiStore.isForgotPasswordModalOpen}
    on:switchToLogin={uiStore.openLoginModal}
    on:close={uiStore.closeModals}
/>
