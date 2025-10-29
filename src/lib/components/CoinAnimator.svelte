<!-- src/lib/components/CoinAnimator.svelte -->
<script lang="ts">
    import { tweened } from "svelte/motion";
    import { cubicOut } from "svelte/easing";
    import { onMount } from "svelte";

    // The reactive coin value from the parent store.
    export let coins: number = 0;

    // A "tweened" store smoothly animates the number from its old value to the new one.
    const displayedCoins = tweened(coins, {
        duration: 600, // Animation duration in milliseconds
        easing: cubicOut,
    });

    // A key block re-triggers its content and animations whenever the 'coins' prop changes.
    // This is perfect for our pulse effect.
    let pulseClass = "";

    // A reactive statement that updates the tweened store whenever the 'coins' prop changes.
    $: {
        // Svelte's reactivity will trigger this block when `coins` updates.
        if (typeof $displayedCoins === "number" && coins !== $displayedCoins) {
            // Determine the pulse color based on whether coins increased or decreased.
            pulseClass = coins > $displayedCoins ? "pulse-green" : "pulse-red";
        }
        // Set the new target value for the tweened animation.
        displayedCoins.set(coins);
    }
</script>

{#key coins}
    <div class="coin-display {pulseClass}">
        <!-- Coin Icon -->
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-circle-dollar-sign text-amber-400"
            ><circle cx="12" cy="12" r="10" /><path
                d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"
            /><path d="M12 18V6" /></svg
        >
        <!-- The animated number. We round it to prevent showing decimals during the animation. -->
        <span class="font-semibold text-foreground"
            >{Math.round($displayedCoins)}</span
        >
    </div>
{/key}

<style>
    .coin-display {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
    }

    @keyframes pulse-green {
        0% {
            transform: scale(1);
            color: #22c55e; /* green-500 */
        }
        50% {
            transform: scale(1.2);
            color: #22c55e;
        }
        100% {
            transform: scale(1);
            color: inherit;
        }
    }

    @keyframes pulse-red {
        0% {
            transform: scale(1);
            color: #ef4444; /* red-500 */
        }
        50% {
            transform: scale(1.2);
            color: #ef4444;
        }
        100% {
            transform: scale(1);
            color: inherit;
        }
    }

    /* We apply the animation only to the number span inside the display */
    .pulse-green span {
        animation: pulse-green 0.5s ease-out;
    }

    .pulse-red span {
        animation: pulse-red 0.5s ease-out;
    }
</style>
