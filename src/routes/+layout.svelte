<!-- src/routes/+layout.svelte -->
<script lang="ts">
    import { authStore } from "$lib/stores/authStore";
    import { uiStore } from "$lib/stores/uiStore";
    import "../app.css";

    import Navbar from "$lib/components/Navbar.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import LoginModal from "$lib/components/auth/LoginModal.svelte";
    import ForgotPassword from "$lib/components/auth/ForgotPassword.svelte";
    import RegisterModal from "$lib/components/auth/RegisterModal.svelte";

    // ✅ SIMPLIFIED: The only job here is to close the modal.
    // The authStore now handles its own state updates and invalidation,
    // and the UI will react automatically to the store change.
    function handleLoginSuccess() {
        uiStore.closeModals();
    }
</script>

<!-- The logic now correctly relies only on the reactive `$authStore` -->
{#if $authStore.isLoading}
    <div class="flex h-screen w-full items-center justify-center bg-white">
        <div
            class="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
        />
    </div>
{:else}
    <div class="flex h-screen bg-background flex-col">
        <Navbar />

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
        on:switchToLogin={uiStore.openLoginModal}
        on:close={uiStore.closeModals}
    />

    <ForgotPassword
        isOpen={$uiStore.isForgotPasswordModalOpen}
        on:switchToLogin={uiStore.openLoginModal}
        on:close={uiStore.closeModals}
    />
{/if}
