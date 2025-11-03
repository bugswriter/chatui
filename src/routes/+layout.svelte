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
        isRegisterModalOpen = false;
        isLoginModalOpen = true;
    }
</script>

{#if $authStore.isLoading}
    <div class="flex h-screen w-full items-center justify-center bg-background">
        <div
            class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
        />
    </div>
{:else}
    <!-- This is the key container. It fills the screen and arranges children vertically -->
    <div class="flex h-screen flex-col">
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
