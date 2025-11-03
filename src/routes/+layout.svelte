<script lang="ts">
    import { onMount } from "svelte";
    import { authStore } from "$lib/stores/authStore";
    import "../app.css";

    // --- Global Component Imports ---
    // These components will be present on every page of your application.
    import Navbar from "$lib/components/Navbar.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import LoginModal from "$lib/components/auth/Login.svelte";
    import RegisterModal from "$lib/components/auth/Register.svelte";

    // --- Global Modal State ---
    // This layout is the global "stage" that owns the state for modals
    // that can be opened from anywhere (like the Navbar).
    let isLoginModalOpen = false;
    let isRegisterModalOpen = false;

    onMount(() => {
        // Initialize the auth store once when the app shell loads.
        // This checks for a stored token and fetches user details.
        authStore.initialize();
    });

    // --- Global Modal Event Handlers ---
    function handleLoginSuccess() {
        isLoginModalOpen = false;
        isRegisterModalOpen = false;
    }

    function handleRegisterSuccess() {
        // A common UX pattern: after successful registration,
        // guide the user to log in immediately.
        isRegisterModalOpen = false;
        isLoginModalOpen = true;
    }
</script>

<!-- Show a full-page loading spinner only during the initial auth check -->
{#if $authStore.isLoading}
    <div class="flex h-screen w-full items-center justify-center bg-background">
        <div
            class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
        />
    </div>
{:else}
    <!--
    This flex container ensures the layout takes up the full screen height
    and allows the footer to stick to the bottom.
  -->
    <div class="flex min-h-screen flex-col">
        <!-- The Navbar listens for events to open the modals defined in this layout -->
        <Navbar
            on:openLogin={() => (isLoginModalOpen = true)}
            on:openRegister={() => (isRegisterModalOpen = true)}
        />

        <!--
      The <slot /> renders the actual page content (e.g., /, /about, /dashboard).
      'flex-grow' makes this main section expand to fill available space, pushing the footer down.
    -->
        <main class="flex-grow">
            <slot />
        </main>

        <!-- The global Footer is rendered at the bottom of every page -->
        <Footer />
    </div>

    <!--
    MODAL DEFINITIONS
    These are defined once, globally. They can now be triggered from any page
    because their state (`isOpen`) is managed here in the root layout.
  -->
    <LoginModal
        bind:isOpen={isLoginModalOpen}
        on:success={handleLoginSuccess}
        on:switchToRegister={() => {
            isLoginModalOpen = false;
            isRegisterModalOpen = true;
        }}
    />

    <RegisterModal
        bind:isOpen={isRegisterModalOpen}
        on:success={handleRegisterSuccess}
        on:switchToLogin={() => {
            isRegisterModalOpen = false;
            isLoginModalOpen = true;
        }}
    />
{/if}
