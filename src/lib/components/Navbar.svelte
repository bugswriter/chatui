<!-- src/lib/components/Navbar.svelte -->
<script lang="ts">
    import { Settings, CircleDollarSign } from "lucide-svelte";
    import { createEventDispatcher } from "svelte";
    import { authStore } from "$lib/stores/authStore";
    import CoinAnimator from "./CoinAnimator.svelte";

    const dispatch = createEventDispatcher();

    let previousCoins: number | undefined = undefined;
    let animations: {
        id: number;
        value: string;
        type: "danger" | "success";
    }[] = [];
    let nextAnimationId = 0;

    authStore.subscribe((store) => {
        const currentCoins = store.user?.coins;

        if (currentCoins !== undefined && previousCoins !== undefined) {
            const difference = currentCoins - previousCoins;

            if (difference !== 0) {
                const id = nextAnimationId++;
                // ✅ FIX: Use toLocaleString for a cleaner difference format too
                const value =
                    difference > 0
                        ? `+${difference.toLocaleString()}`
                        : `${difference.toLocaleString()}`;
                const type = difference > 0 ? "success" : "danger";

                animations = [...animations, { id, value, type }];
            }
        }

        previousCoins = currentCoins;
    });

    function handleAnimationComplete(id: number) {
        animations = animations.filter((anim) => anim.id !== id);
    }

    // ✅ FIX: Update the formatting function
    function formatCoins(coins: number): string {
        // This will format numbers like 1234.56 into "1,235"
        return Math.round(coins).toLocaleString("en-US");
    }
</script>

<header
    class="fixed top-0 left-0 w-full z-20 h-14 bg-background/70 backdrop-blur-sm border-border"
>
    <div
        class="max-w-[1920px] mx-auto px-5 h-full flex items-center justify-between"
    >
        <a href="/" class="text-xl font-bold text-primary tracking-wide"
            >munni.ai</a
        >
        {#if $authStore.isAuthenticated && $authStore.user}
            <div class="flex items-center gap-4">
                <div
                    class="relative flex items-center gap-2 text-sm font-semibold text-foreground"
                >
                    <CircleDollarSign class="w-5 h-5 text-orange-300" />
                    <span>{formatCoins($authStore.user.coins)}</span>
                    {#each animations as anim (anim.id)}
                        <CoinAnimator
                            value={anim.value}
                            type={anim.type}
                            onComplete={() => handleAnimationComplete(anim.id)}
                        />
                    {/each}
                </div>
                <button
                    on:click={() => dispatch("settingsClick")}
                    class="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    aria-label="Open settings"
                >
                    <Settings class="w-5 h-5" />
                </button>
            </div>
        {/if}
    </div>
</header>
