<!-- src/lib/components/CoinDisplay.svelte -->
<script lang="ts">
    import { tweened } from "svelte/motion";
    import { cubicOut } from "svelte/easing";

    export let coins: number = 0;

    const displayedCoins = tweened(coins, {
        duration: 600,
        easing: cubicOut,
    });

    let pulseClass = "";

    $: {
        if (typeof $displayedCoins === "number" && coins !== $displayedCoins) {
            // Use standard Tailwind colors for pulse animation consistency
            pulseClass =
                coins > $displayedCoins
                    ? "animate-pulse-green" // Assuming a green animation for gain
                    : "animate-pulse-red";  // Assuming a red animation for loss
        }
        displayedCoins.set(coins);
    }
</script>

{#key coins}
    <!-- UNIFIED DESIGN: Standard amber for coin icon -->
    <div class="inline-flex items-center gap-1">
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
            class="lucide lucide-circle-dollar-sign text-amber-500"
            ><circle cx="12" cy="12" r="10" /><path
                d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"
            /><path d="M12 18V6" /></svg
        >
        <span class="font-semibold text-gray-900 {pulseClass}"
            >{Math.round($displayedCoins)}</span
        >
    </div>
{/key}
