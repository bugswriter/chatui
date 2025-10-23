<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { authStore } from '$lib/stores/authStore';

	export let isOpen: boolean = false;
	let username = '';
	let password = '';

	const dispatch = createEventDispatcher();

	function closeModal() {
		dispatch('close');
	}

	async function handleSubmit() {
		if (!username || !password) return;
		try {
			await authStore.login(username, password);
			closeModal();
		} catch (error) {
			console.error('Login failed:', error);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (isOpen && event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
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
			class="relative flex flex-col gap-4 rounded-xl bg-muted p-6 shadow-2xl border border-border"
		>
			<!-- Header -->
			<div class="text-center">
				<h2 class="text-2xl font-bold text-foreground">Welcome Back</h2>
				<p class="text-muted-foreground text-sm">Log in to continue to munni.ai.</p>
			</div>

			<!-- Form -->
			<form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-3">
				<input
					bind:value={username}
					type="text"
					placeholder="Username"
					class="rounded-md border border-border bg-background p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
					disabled={$authStore.isLoading}
					required
				/>
				<input
					bind:value={password}
					type="password"
					placeholder="Password"
					class="rounded-md border border-border bg-background p-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
					disabled={$authStore.isLoading}
					required
				/>
				{#if $authStore.error}
					<div
						class="rounded-md bg-danger/10 p-2 text-center text-sm text-danger"
					>
						{$authStore.error}
					</div>
				{/if}
				<button
					type="submit"
					disabled={$authStore.isLoading}
					class="mt-2 rounded-md bg-primary py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{#if $authStore.isLoading}Logging in...{:else}Login{/if}
				</button>
			</form>

			<!-- OR Separator -->
			<div class="relative my-2">
				<div class="absolute inset-0 flex items-center">
					<span class="w-full border-t border-border" />
				</div>
				<div class="relative flex justify-center text-xs uppercase">
					<span class="bg-muted px-2 text-muted-foreground">Or continue with</span>
				</div>
			</div>

			<!-- Google Login -->
			<button
				class="flex items-center justify-center gap-2 rounded-md border border-border bg-background py-2.5 font-semibold text-sm text-foreground transition hover:bg-background/50"
			>
				<svg class="h-5 w-5" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
					><title>Google</title><path
						fill="currentColor"
						d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.9 2.04-4.58 2.04-3.81 0-6.89-3.11-6.89-7.01s3.08-7.01 6.89-7.01c1.93 0 3.59.69 4.83 1.89l2.7-2.72C18.17 1.25 15.48 0 12.48 0 5.88 0 0 5.88 0 12.02s5.88 12.02 12.48 12.02c6.8 0 12.02-5.04 12.02-12.36 0-.82-.07-1.42-.2-2.04H12.48z"
					/></svg
				>
				<span>Login with Google</span>
			</button>

			<!-- Footer Links -->
			<div class="flex justify-between text-sm text-muted-foreground mt-2">
				<button on:click={() => alert('Forgot password clicked')} class="hover:underline">
					Forgot Password?
				</button>
				<button class="hover:underline" disabled> Sign Up </button>
			</div>

			<!-- Close Button -->
			<button
				on:click={closeModal}
				class="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-background/50 transition"
				aria-label="Close"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"></line><line
						x1="6"
						y1="6"
						x2="18"
						y2="18"
					></line></svg
				>
			</button>
		</div>
	</div>
{/if}