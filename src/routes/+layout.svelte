<!-- src/routes/+layout.svelte -->
<script lang="ts">
    import { page } from "$app/stores";
    import { invalidate } from "$app/navigation"; // ✅ IMPORT invalidate
    import { authStore } from "$lib/stores/authStore";
    import { uiStore } from "$lib/stores/uiStore";
    import "../app.css";

    import type { PageData } from "./$types";

    import Navbar from "$lib/components/Navbar.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import LoginModal from "$lib/components/auth/LoginModal.svelte";
    import ForgotPassword from "$lib/components/auth/ForgotPassword.svelte";
    import RegisterModal from "$lib/components/auth/RegisterModal.svelte";

    export let data: PageData;

    // ✅ MODIFIED: This function now invalidates the layout data.
    async function handleLoginSuccess() {
        uiStore.closeModals();
        // This tells SvelteKit to re-run all load functions that
        // depend on 'app:auth', which includes this layout's load function.
        await invalidate("app:auth");
    }

    function handleRegisterSuccess() {
        uiStore.closeModals();
        // You can optionally show a "please verify your email" message here.
    }
</script>

{#if $authStore.isLoading && !data.isAuthenticated}
    <div class="flex h-screen w-full items-center justify-center bg-white">
        <div
            class="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
        />
    </div>
{:else}
    <div class="flex h-screen bg-background flex-col">
        <Navbar
            on:openLogin={uiStore.openLoginModal}
            on:openRegister={uiStore.openRegisterModal}
        />

        <!-- ✅ MODIFIED: Added padding-top to prevent content from going under the new absolute navbar -->
        <main class="flex-1 overflow-y-auto pt-14">
            <slot />
        </main>

        <Footer />
    </div>

    <LoginModal
        isOpen={$uiStore.isLoginModalOpen}
        on:success={handleLoginSuccess}
        on:switchToRegister={uiStore.openRegisterModal}
        on:switchToForgotPassword={uiStore.openForgotPasswordModal}
        on:close={uiStore.closeModals}
    />

    <RegisterModal
        isOpen={$uiStore.isRegisterModalOpen}
        on:success={handleRegisterSuccess}
        on:switchToLogin={uiStore.openLoginModal}
        on:close={uiStore.closeModals}
    />

    <ForgotPassword
        isOpen={$uiStore.isForgotPasswordModalOpen}
        on:switchToLogin={uiStore.openLoginModal}
        on:close={uiStore.closeModals}
    />
{/if}
