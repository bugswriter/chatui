<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { LogOut, UserCircle } from 'lucide-svelte';
	import { settingsStore } from '$lib/stores/settingsStore';
	import { authStore } from '$lib/stores/authStore';

	export let isOpen: boolean = false;

	// --- NEW: State for avatar upload ---
	let fileInput: HTMLInputElement;
	let isUploading = false;
	let uploadError: string | null = null;

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

	// --- NEW: Handler for file selection ---
	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			isUploading = true;
			uploadError = null;
			try {
				await authStore.updateAvatar(file);
			} catch (error) {
				uploadError = error instanceof Error ? error.message : 'Upload failed.';
			} finally {
				isUploading = false;
			}
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
				<!-- ✅ NEW: Account Section for Profile Picture -->
				<div class="flex flex-col gap-3">
					<h3 class="text-sm font-semibold text-foreground/80">Account</h3>
					<div class="flex items-center gap-4 rounded-lg border border-border bg-background p-3">
						<!-- Avatar Display -->
						<div
							class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
						>
							{#if $authStore.user?.avatar}
								<img
									src={$authStore.user.avatar}
									alt="User avatar"
									class="h-full w-full rounded-full object-cover"
								/>
							{:else}
								<UserCircle class="h-10 w-10" />
							{/if}
						</div>
						<!-- Upload Controls -->
						<div class="flex-1">
							<p class="font-medium text-foreground">Profile Picture</p>
							<p class="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB.</p>
							<input
								bind:this={fileInput}
								on:change={handleFileSelect}
								type="file"
								accept="image/png, image/jpeg, image/gif"
								hidden
							/>
							<button
								on:click={() => fileInput.click()}
								disabled={isUploading}
								class="mt-2 text-sm font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{#if isUploading}
									Uploading...
								{:else}
									Change
								{/if}
							</button>
						</div>
					</div>
					{#if uploadError}
						<p class="text-xs text-center text-danger">{uploadError}</p>
					{/if}
				</div>

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

				<!-- Logout Section -->
				<div class="flex flex-col gap-4 border-t border-border pt-6">
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