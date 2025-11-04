<!-- src/routes/+layout.svelte -->
<script lang="ts">
    import { page } from "$app/stores";
    import { invalidate } from "$app/navigation";
    import { authStore } from "$lib/stores/authStore";
    import "../app.css";

    // ✅ FIX: Import the generated type for this page's data
    import type { PageData } from "./$types";

    // --- Global Component Imports ---
    import Navbar from "$lib/components/Navbar.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import LoginModal from "$lib/components/auth/LoginModal.svelte";
    import ForgotPassword from "$lib/components/auth/ForgotPassword.svelte";
    import RegisterModal from "$lib/components/auth/RegisterModal.svelte";

    // ✅ FIX: Apply the imported type to the `data` prop.
    // This tells TypeScript the exact shape of the data object.
    export let data: PageData;

    let isLoginModalOpen = false;
    let isRegisterModalOpen = false;
    let isForgotPasswordOpen = false;

    async function handleLoginSuccess() {
        isLoginModalOpen = false;
        isRegisterModalOpen = false;

        await invalidate("app:auth");
    }

    function handleRegisterSuccess() {
        isRegisterModalOpen = false;
    }
</script>

<!--
  This `if` condition is now type-safe because TypeScript knows that
  `data` has a boolean property named `isAuthenticated`.
-->
{#if $authStore.isLoading && !data.isAuthenticated}
    <div class="flex h-screen w-full items-center justify-center bg-white">
        <div
            class="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
        />
    </div>
{:else}
    <div class="flex h-screen bg-background flex-col">
        <Navbar
            on:openLogin={() => (isLoginModalOpen = true)}
            on:openRegister={() => (isRegisterModalOpen = true)}
        />

        <main class="flex-1 overflow-y-auto">
            <slot />
        </main>

        <Footer />
    </div>

    <!-- Modals -->
    <LoginModal
        bind:isOpen={isLoginModalOpen}
        on:success={handleLoginSuccess}
        on:switchToRegister={() => {
            isLoginModalOpen = false;
            isRegisterModalOpen = true;
        }}
        on:switchToForgotPassword={() => {
            isLoginModalOpen = false;
            isForgotPasswordOpen = true;
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

    <ForgotPassword
        bind:isOpen={isForgotPasswordOpen}
        on:switchToLogin={() => {
            isForgotPasswordOpen = false;
            isLoginModalOpen = true;
        }}
    />
{/if}
