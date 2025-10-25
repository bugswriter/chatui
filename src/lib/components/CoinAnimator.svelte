<!-- src/lib/components/CoinAnimator.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';

	// The value to display, e.g., "-4" or "+1000"
	export let value: string = '';
	// 'danger' for spending, 'success' for gaining
	export let type: 'danger' | 'success' = 'danger';

	// This is a self-destructing component. It will remove itself
	// from the DOM after the animation completes to keep things clean.
	export let onComplete: () => void;

	// CSS classes based on the type prop
	$: colorClass = type === 'danger' ? 'text-danger' : 'text-green-500';

	// The animation lasts 2 seconds (2000ms). After that, we call the
	// onComplete function passed from the parent.
	onMount(() => {
		const timer = setTimeout(() => {
			onComplete();
		}, 2000);

		// Cleanup function to prevent memory leaks if the component
		// is destroyed before the timer finishes.
		return () => clearTimeout(timer);
	});
</script>

<div
	class="coin-animation absolute bottom-full left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-sm font-bold {colorClass}"
>
	{value}
</div>

<style>
	@keyframes soul-leaving {
		0% {
			transform: translateY(0) scale(1);
			opacity: 1;
		}
		100% {
			/* Move 50px upwards, scale down slightly, and fade out */
			transform: translateY(-50px) scale(0.8);
			opacity: 0;
		}
	}

	.coin-animation {
		/* Apply the animation */
		animation: soul-leaving 2s ease-out forwards;
		/* Prevent user from interacting with the animated element */
		pointer-events: none;
	}
</style>