<script lang="ts">
    const currentYear = new Date().getFullYear();
</script>

<footer class="border-t border-border bg-muted text-muted-foreground">
    <div
        class="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row"
    >
        <!-- Copyright Notice -->
        <p class="text-center text-sm sm:text-left">
            &copy; {currentYear} bugswriter.ai. All Rights Reserved.
        </p>

        <!-- Simple Navigation Links -->
        <div class="flex items-center gap-6">
            <a
                href="/about"
                class="text-sm font-medium transition-colors hover:text-foreground"
            >
                About
            </a>
            <a
                href="/pricing"
                class="text-sm font-medium transition-colors hover:text-foreground"
            >
                Pricing
            </a>
            <a
                href="/terms"
                class="text-sm font-medium transition-colors hover:text-foreground"
            >
                Terms of Service
            </a>
        </div>
    </div>
</footer>
