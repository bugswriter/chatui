<!-- src/routes/+layout.svelte -->
<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import { authStore } from "$lib/stores/authStore";
    import "../app.css";

    // --- Global Component Imports ---
    import Navbar from "$lib/components/Navbar.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import LoginModal from "$lib/components/auth/LoginModal.svelte";
    import RegisterModal from "$lib/components/auth/RegisterModal.svelte";

    let isLoginModalOpen = false;
    let isRegisterModalOpen = false;

    onMount(() => {
        authStore.initialize();
    });

    function handleLoginSuccess() {
        isLoginModalOpen = false;
        isRegisterModalOpen = false;
    }

    function handleRegisterSuccess() {
        // After successful registration, usually redirect to login or show success.
        // The service now returns a message asking to check email, so we close modal.
        isRegisterModalOpen = false;
    }

    // NOTE: An event handler for 'requestLogin' from ChatInput should be added here
    // to open the login modal when a non-authenticated user tries to send a message.
    // However, since the ChatInput code only dispatches 'requestLogin' and the
    // existing Navbar already dispatches 'openLogin', we'll rely on the parent
    // component in the current structure (likely +page.svelte) to handle the ChatInput's event
    // and forward it to here (or ChatInput should dispatch 'openLogin' directly if it's simpler).

    // --- Template structure is consistent with the light theme ---
</script>

{#if $authStore.isLoading}
    <!-- UNIFIED DESIGN: Standard light background and primary spinner color -->
    <div class="flex h-screen w-full items-center justify-center bg-white">
        <div
            class="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
        />
    </div>
{:else}
    <!-- UNIFIED DESIGN: The base background is white/light gray -->
    <div class="flex h-screen bg-background flex-col">
        <!-- The Navbar is a direct child and does not scroll -->
        <Navbar
            on:openLogin={() => (isLoginModalOpen = true)}
            on:openRegister={() => (isRegisterModalOpen = true)}
        />

        <!-- This main element grows to fill the remaining space and is the ONLY scrollable part -->
        <main class="flex-1 overflow-y-auto">
            <slot />
        </main>

        {#if $page.route.id !== "/"}
            <Footer />
        {/if}
    </div>

    <!-- Modals are triggered globally via events from Navbar/ChatInput -->
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
