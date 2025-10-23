<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { LogOut } from 'lucide-svelte';
	import { settingsStore } from '$lib/stores/settingsStore';
	import { authStore } from '$lib/stores/authStore';

	export let isOpen: boolean = false;

	const dispatch = createEventDispatcher();
	function closeModal() {
		dispatch('close');
	}
	function handleLogout() {
		authStore.logout();
		closeModal();
	}
	function handleKeydown(event: KeyboardEvent) {
		if (isOpen && event.key === 'Escape') {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		on:click={closeModal}
		transition:fade={{ duration: 150 }}
		class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
	></div>

	<div
		transition:fade={{ duration: 150, start: 0.1 }}
		class="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
	>
		<div
			class="relative flex flex-col gap-4 rounded-xl border border-border bg-muted p-6 shadow-2xl"
		>
			<!-- Header -->
			<div>
				<h2 class="text-2xl font-bold text-foreground">Settings</h2>
				<p class="text-muted-foreground">Customize your experience.</p>
			</div>

			<!-- Settings Sections -->
			<div class="flex flex-col gap-6 pt-2">
				<!-- Display Section -->
				<div class="flex flex-col gap-2">
					<h3 class="text-sm font-semibold text-foreground/80">Display</h3>
					<label
						class="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-background p-3 transition-colors hover:bg-background/50"
					>
						<div>
							<p class="font-medium text-foreground">Show File Previews</p>
							<p class="text-xs text-muted-foreground">Display previews for images and videos.</p>
						</div>
						<input
							type="checkbox"
							class="toggle"
							bind:checked={$settingsStore.showFilePreviews}
						/>
					</label>
				</div>

				<!-- Account Section -->
				<div class="flex flex-col gap-4 border-t border-border pt-6">
					<h3 class="text-sm font-semibold text-foreground/80">Account</h3>
					<button
						on:click={handleLogout}
						class="flex w-full items-center justify-center gap-2 rounded-md bg-danger/10 py-2 font-semibold text-danger transition-colors hover:bg-danger/20"
					>
						<LogOut class="h-4 w-4" />
						Logout
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.toggle {
		appearance: none;
		position: relative;
		width: 38px;
		height: 22px;
		border-radius: var(--radius-full);
		background-color: hsl(var(--muted));
		transition: background-color 0.2s ease;
		flex-shrink: 0;
	}
	.toggle::after {
		content: '';
		position: absolute;
		top: 3px;
		left: 3px;
		width: 16px;
		height: 16px;
		border-radius: var(--radius-full);
		background-color: white;
		transition: transform 0.2s ease;
	}
	.toggle:checked {
		background-color: hsl(var(--primary));
	}
	.toggle:checked::after {
		transform: translateX(16px);
	}
</style>