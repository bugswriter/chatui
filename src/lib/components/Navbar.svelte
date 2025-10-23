<!-- src/lib/components/Navbar.svelte -->

<script lang="ts">
	import { Settings, Coins } from 'lucide-svelte';
	import { createEventDispatcher } from 'svelte';
	import { authStore } from '$lib/stores/authStore';

	const dispatch = createEventDispatcher();

	// Format coins like 1234 -> 1.2K
	function formatCoins(coins: number): string {
		if (coins >= 1000) return `${(coins / 1000).toFixed(1)}K`;
		return coins.toFixed(2);
	}
</script>

<header
	class="fixed top-0 left-0 w-full z-20 h-14 bg-white/10 backdrop-blur-lg shadow-none border-0"
>
	<div class="max-w-[1920px] mx-auto px-5 h-full flex items-center justify-between">
		<!-- App Title -->
		<h1 class="text-xl font-bold text-primary tracking-wide">munni.ai</h1>

		<!-- User Info & Settings -->
		{#if $authStore.isAuthenticated && $authStore.user}
			<div class="flex items-center gap-4">
				<!-- Coin Balance -->
				<div class="flex items-center gap-1.5 text-sm font-semibold text-foreground">
					<Coins class="w-5 h-5 text-yellow-400" />
					<span>{formatCoins($authStore.user.coins)}</span>
				</div>

				<!-- Settings Button -->
				<button
					on:click={() => dispatch('settingsClick')}
					class="flex h-9 w-9 items-center justify-center rounded-md hover:bg-white/20 transition-colors duration-200"
					aria-label="Open settings"
				>
					<Settings class="w-5 h-5 text-muted-foreground" />
				</button>
			</div>
		{/if}
	</div>
</header>
