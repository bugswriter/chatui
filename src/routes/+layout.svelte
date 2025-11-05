<!-- src/routes/+layout.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import { authStore } from "$lib/stores/authStore";
    import { uiStore } from "$lib/stores/uiStore";
    import { agentStore } from "$lib/stores/agentStore";
    import "../app.css";

    import Navbar from "$lib/components/Navbar.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import LoginModal from "$lib/components/auth/LoginModal.svelte";
    import ForgotPassword from "$lib/components/auth/ForgotPassword.svelte";
    import RegisterModal from "$lib/components/auth/RegisterModal.svelte";

    import { page } from "$app/stores";

    // --- Theme Management ---
    let theme: "light" | "dark" = "light"; // Default before mount to prevent SSR errors

    onMount(() => {
        // Initialize agent data globally when the app loads
        agentStore.initialize();

        const savedTheme = localStorage.getItem("theme");
        const systemPrefersDark = window.matchMedia(
            "(prefers-color-scheme: dark)",
        ).matches;

        // Determine and apply the initial theme
        if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
            theme = "dark";
        } else {
            theme = "light";
        }
        updateHtmlClass(theme);

        // Listen for changes in the user's OS/browser theme preference
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const systemThemeListener = (e: MediaQueryListEvent) => {
            // Only update if the user hasn't set an explicit preference in localStorage
            if (!localStorage.getItem("theme")) {
                const newTheme = e.matches ? "dark" : "light";
                theme = newTheme;
                updateHtmlClass(newTheme);
            }
        };
        mediaQuery.addEventListener("change", systemThemeListener);

        // Cleanup listener when the component is destroyed
        return () => {
            mediaQuery.removeEventListener("change", systemThemeListener);
        };
    });

    function updateHtmlClass(newTheme: "light" | "dark") {
        if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }

    function toggleTheme() {
        const newTheme = theme === "dark" ? "light" : "dark";
        theme = newTheme;
        // When the user toggles, we set an explicit preference in localStorage
        localStorage.setItem("theme", newTheme);
        updateHtmlClass(newTheme);
    }
    // --- End Theme Management ---

    $: isActivePage = $page.url.pathname === "/";

    function handleLoginSuccess() {
        uiStore.closeModals();
    }
</script>

{#if $authStore.isLoading}
    <div class="flex h-screen w-full items-center justify-center bg-background">
        <div
            class="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"
        />
    </div>
{:else}
    <div class="flex h-screen flex-col bg-background text-foreground">
        <Navbar currentTheme={theme} on:toggle={toggleTheme} />

        <main class="flex flex-1 flex-col overflow-y-auto">
            <div class="flex-grow">
                <slot />
            </div>
            {#if !isActivePage}
                <Footer />
            {/if}
        </main>
    </div>

    <!-- Modals -->
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
{/if}
