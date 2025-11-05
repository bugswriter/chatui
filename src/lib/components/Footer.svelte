<script lang="ts">
    const currentYear = new Date().getFullYear();
</script>

<footer class="border-t bg-background/95">
    <div
        class="container mx-auto flex flex-col-reverse items-center justify-between gap-y-4 px-6 py-8 sm:flex-row"
    >
        <p class="text-sm text-muted-foreground">
            &copy; {currentYear} bw.ai — All Rights Reserved.
        </p>
        <div class="flex items-center gap-x-6">
            <a
                href="/about"
                class="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                About
            </a>
            <a
                href="/pricing"
                class="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                Pricing
            </a>
            <a
                href="/agents"
                class="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                Agents
            </a>
        </div>
    </div>
</footer>
