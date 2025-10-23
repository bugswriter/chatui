<!-- src/lib/components/LoginModal.svelte -->

<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { fade } from "svelte/transition";
  import { authStore } from "$lib/stores/authStore";

  export let isOpen: boolean = false;
  let username = "";
  let password = "";

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch("close");
  }

  async function handleSubmit() {
    if (!username || !password) return;
    try {
      await authStore.login(username, password);
      closeModal();
    } catch (error) {
      console.error("Login failed:", error);
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (isOpen && event.key === "Escape") {
      closeModal();
    }
  }

  function handleGoogleLogin() {
    alert("Google login clicked");
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <div
    on:click={closeModal}
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
  ></div>

  <!-- Modal -->
  <div
    transition:fade={{ duration: 150, start: 0.1 }}
    class="fixed top-1/2 left-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2"
  >
    <div
      class="relative flex flex-col gap-4 rounded-lg bg-background/90 p-6 shadow-lg border border-foreground/10"
    >
      <!-- Header -->
      <div class="text-center">
        <h2 class="text-2xl font-bold text-foreground">Welcome Back</h2>
        <p class="text-muted-foreground text-sm">
          Log in to continue to Hannah's Hive.
        </p>
      </div>

      <!-- Form -->
      <form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-3">
        <input
          bind:value={username}
          type="text"
          placeholder="Username"
          class="rounded-md border border-foreground/20 bg-background/50 p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={$authStore.isLoading}
          required
        />
        <input
          bind:value={password}
          type="password"
          placeholder="Password"
          class="rounded-md border border-foreground/20 bg-background/50 p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={$authStore.isLoading}
          required
        />
        {#if $authStore.error}
          <div
            class="rounded-md bg-red-500/10 p-2 text-center text-sm text-red-500"
          >
            {$authStore.error}
          </div>
        {/if}
        <button
          type="submit"
          disabled={$authStore.isLoading}
          class="mt-2 rounded-md bg-primary py-2 font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if $authStore.isLoading}Logging in...{:else}Login{/if}
        </button>
      </form>

      <!-- Google Login -->
      <button
        on:click={handleGoogleLogin}
        class="flex items-center justify-center gap-2 rounded-md border border-foreground/20 bg-background/50 py-2 font-semibold text-sm hover:bg-muted transition"
      >
        <img
          src="https://www.svgrepo.com/show/61540/google.svg"
          alt="Google"
          class="h-5 w-5 flex-shrink-0"
        />
        <span>Login with Google</span>
      </button>

      <!-- Footer Links -->
      <div class="flex justify-between text-sm text-muted-foreground mt-1">
        <button
          on:click={() => alert("Forgot password clicked")}
          class="hover:underline"
        >
          Forgot Password?
        </button>
        <button class="hover:underline" disabled> Sign Up </button>
      </div>

      <!-- Close Button -->
      <button
        on:click={closeModal}
        class="absolute top-3 right-3 rounded-full p-1 text-muted-foreground hover:bg-muted transition"
        aria-label="Close"
      >
        &times;
      </button>
    </div>
  </div>
{/if}
