<script lang="ts">
    import { tweened } from "svelte/motion";
    import { cubicOut } from "svelte/easing";
    import { CircleDollarSign } from "lucide-svelte";

    export let coins: number = 0;

    const displayedCoins = tweened(coins, {
        duration: 600,
        easing: cubicOut,
    });

    $: displayedCoins.set(coins);
</script>

<div
    class="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-sm"
>
    <CircleDollarSign class="h-4 w-4 text-primary" />
    <span class="font-medium text-foreground">
        {Math.round($displayedCoins)}
    </span>
    <span class="hidden text-muted-foreground sm:inline">Coins</span>
</div>
