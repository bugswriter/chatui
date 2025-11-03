<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade } from 'svelte/transition';
	import { LogOut, UserCircle, X } from 'lucide-svelte';
	import { settingsStore } from '$lib/stores/settingsStore';
	import { authStore } from '$lib/stores/authStore';

	export let isOpen: boolean = false;

	// --- State for avatar upload ---
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

	// --- Handler for file selection ---
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
	<!-- Backdrop -->
	<!-- UNIFIED DESIGN: Standard light backdrop blur -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div
		on:click={closeModal}
		transition:fade={{ duration: 150 }}
		class="fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm"
	></div>

	<!-- Modal Window -->
	<!-- UNIFIED DESIGN: Standard light card look -->
	<div
		transition:fade={{ duration: 150, start: 0.1 }}
		class="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
	>
		<div
			class="relative flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-2xl"
		>
			<!-- Close Button (NEW: Added for consistency) -->
			<button
				on:click={closeModal}
				class="absolute top-4 right-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 transition-colors"
				aria-label="Close settings"
			>
				<X class="h-5 w-5" />
			</button>

			<!-- Header -->
			<div>
				<h2 class="text-2xl font-bold text-gray-900">Settings</h2>
				<p class="text-gray-600">Customize your experience.</p>
			</div>

			<!-- Settings Sections -->
			<div class="flex flex-col gap-6 pt-2">
				<!-- Account Section for Profile Picture -->
				<div class="flex flex-col gap-3">
					<h3 class="text-sm font-semibold text-gray-700">Account</h3>
					<div class="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
						<!-- Avatar Display -->
						<div
							class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-white text-gray-500"
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
							<p class="font-medium text-gray-900">Profile Picture</p>
							<p class="text-xs text-gray-500">PNG, JPG, GIF up to 5MB.</p>
							<input
								bind:this={fileInput}
								on:change={handleFileSelect}
								type="file"
								accept="image/png, image/jpeg, image/gif"
								hidden
							/>
							<!-- UNIFIED DESIGN: Standard blue link color -->
							<button
								on:click={() => fileInput.click()}
								disabled={isUploading}
								class="mt-2 text-sm font-semibold text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
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
						<p class="text-xs text-center text-red-500">{uploadError}</p>
					{/if}
				</div>

				<!-- Display Section -->
				<div class="flex flex-col gap-2">
					<h3 class="text-sm font-semibold text-gray-700">Display</h3>
					<!-- UNIFIED DESIGN: Standard light background/border -->
					<label
						class="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white p-3 transition-colors hover:bg-gray-50"
					>
						<div>
							<p class="font-medium text-gray-900">Show File Previews</p>
							<p class="text-xs text-gray-500">Display previews for images and videos.</p>
						</div>
						<input
							type="checkbox"
							class="toggle"
							bind:checked={$settingsStore.showFilePreviews}
						/>
					</label>
				</div>

				<!-- Logout Section -->
				<div class="flex flex-col gap-4 border-t border-gray-200 pt-6">
					<!-- UNIFIED DESIGN: Standard red/danger button style -->
					<button
						on:click={handleLogout}
						class="flex w-full items-center justify-center gap-2 rounded-md bg-red-50 py-2 font-semibold text-red-600 transition-colors hover:bg-red-100"
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
	/* Custom CSS for the toggle remains, ensure var(--primary) is blue/indigo */
	.toggle {
		appearance: none;
		position: relative;
		width: 38px;
		height: 22px;
		border-radius: 9999px; /* full */
		background-color: #e5e7eb; /* muted */
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
		border-radius: 9999px; /* full */
		background-color: white;
		transition: transform 0.2s ease;
	}
	.toggle:checked {
		background-color: #3b82f6; /* primary blue */
	}
	.toggle:checked::after {
		transform: translateX(16px);
	}
</style>
