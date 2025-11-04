<!-- src/routes/+layout.svelte -->
<script lang="ts">
    import { page } from "$app/stores";
    // ✅ REMOVED: invalidate is no longer needed here
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

    // ✅ SIMPLIFIED: This function just closes the modal now.
    function handleLoginSuccess() {
        uiStore.closeModals();
    }

    function handleRegisterSuccess() {
        uiStore.closeModals();
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
