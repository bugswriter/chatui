<!-- src/lib/components/Navbar.svelte -->
<script lang="ts">
	import { Settings, CircleDollarSign } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { authStore } from '$lib/stores/authStore';
	import { onMount } from 'svelte'; // ✅ Import onMount
	import CoinAnimator from './CoinAnimator.svelte'; // ✅ Import our new component

	const dispatch = createEventDispatcher();

	// --- ✅ NEW: Logic for Coin Animation ---
	let previousCoins: number | undefined = undefined;
	let animations: { id: number; value: string; type: 'danger' | 'success' }[] = [];
	let nextAnimationId = 0;

	// This function runs whenever the authStore changes.
	authStore.subscribe((store) => {
		const currentCoins = store.user?.coins;

		// We need to check if previousCoins is defined to avoid firing on initial load.
		if (currentCoins !== undefined && previousCoins !== undefined) {
			const difference = currentCoins - previousCoins;

			if (difference !== 0) {
				const id = nextAnimationId++;
				const value = difference > 0 ? `+${difference.toFixed(0)}` : `${difference.toFixed(0)}`;
				const type = difference > 0 ? 'success' : 'danger';

				// Add a new animation to our list. Svelte will render it.
				animations = [...animations, { id, value, type }];
			}
		}

		// Update previousCoins for the next change detection.
		previousCoins = currentCoins;
	});

	// Function to remove an animation from the list after it has completed.
	function handleAnimationComplete(id: number) {
		animations = animations.filter((anim) => anim.id !== id);
	}

	// Format coins like 1234 -> 1.2K
	function formatCoins(coins: number): string {
		if (coins >= 1000) return `${(coins / 1000).toFixed(1)}K`;
		return coins.toFixed(0); // Display whole numbers for coins
	}
</script>

<header class="fixed top-0 left-0 w-full z-20 h-14 bg-background/70 backdrop-blur-sm border-border">
	<div class="max-w-[1920px] mx-auto px-5 h-full flex items-center justify-between">
		<!-- App Title -->
		<a href="/" class="text-xl font-bold text-primary tracking-wide">munni.ai</a>

		<!-- User Info & Settings -->
		{#if $authStore.isAuthenticated && $authStore.user}
			<div class="flex items-center gap-4">
				<!-- Coin Balance -->
				<!-- ✅ NEW: Add a relative container for the animation -->
				<div class="relative flex items-center gap-2 text-sm font-semibold text-foreground">
					<CircleDollarSign class="w-5 h-5 text-orange-300" />
					<span>{formatCoins($authStore.user.coins)}</span>

					<!-- ✅ NEW: Render the animations -->
					{#each animations as anim (anim.id)}
						<CoinAnimator
							value={anim.value}
							type={anim.type}
							onComplete={() => handleAnimationComplete(anim.id)}
						/>
					{/each}
				</div>

				<!-- Settings Button -->
				<button
					on:click={() => dispatch('settingsClick')}
					class="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
					aria-label="Open settings"
				>
					<Settings class="w-5 h-5" />
				</button>
			</div>
		{/if}
	</div>
</header>