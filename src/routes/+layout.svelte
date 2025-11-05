<!-- src/routes/+layout.svelte -->
<script lang="ts">
    import { invalidate } from "$app/navigation";
    import { authStore } from "$lib/stores/authStore";
    import { uiStore } from "$lib/stores/uiStore";
    import "../app.css";

    // ✅ REMOVED: `page` store import is not used
    // ✅ REMOVED: The `data` prop export is no longer needed here
    // import type { PageData } from "./$types";
    // export let data: PageData;

    import Navbar from "$lib/components/Navbar.svelte";
    import Footer from "$lib/components/Footer.svelte";
    import LoginModal from "$lib/components/auth/LoginModal.svelte";
    import ForgotPassword from "$lib/components/auth/ForgotPassword.svelte";
    import RegisterModal from "$lib/components/auth/RegisterModal.svelte";

    async function handleLoginSuccess() {
        uiStore.closeModals();
        await invalidate("app:auth");
    }

    // ✅ REMOVED: This function is no longer needed as the RegisterModal handles its own success state.
    // function handleRegisterSuccess() {
    //     uiStore.closeModals();
    // }
</script>

<!-- The logic now correctly relies only on the reactive store -->
{#if $authStore.isLoading}
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
        on:switchToLogin={uiStore.openLoginModal}
        on:close={uiStore.closeModals}
    />

    <!-- ✅ TYPO FIX: Changed to isForgotPasswordModalOpen -->
    <ForgotPassword
        isOpen={$uiStore.isForgotPasswordModalOpen}
        on:switchToLogin={uiStore.openLoginModal}
        on:close={uiStore.closeModals}
    />
{/if}
