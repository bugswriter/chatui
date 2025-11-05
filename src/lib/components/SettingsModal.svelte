<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import { fade, scale } from "svelte/transition";
    import { LogOut, UserCircle, X } from "lucide-svelte";
    import { settingsStore } from "$lib/stores/settingsStore";
    import { authStore } from "$lib/stores/authStore";

    export let isOpen: boolean = false;

    let fileInput: HTMLInputElement;
    let isUploading = false;
    let uploadError: string | null = null;

    const dispatch = createEventDispatcher();

    function closeModal() {
        dispatch("close");
    }

    function handleLogout() {
        authStore.logout();
        closeModal();
    }

    function handleKeydown(event: KeyboardEvent) {
        if (isOpen && event.key === "Escape") {
            closeModal();
        }
    }

    async function handleFileSelect(event: Event) {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];

        if (file) {
            isUploading = true;
            uploadError = null;
            try {
                await authStore.updateAvatar(file);
            } catch (error) {
                uploadError =
                    error instanceof Error ? error.message : "Upload failed.";
            } finally {
                isUploading = false;
            }
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
    <!-- Backdrop -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div
        on:click={closeModal}
        transition:fade={{ duration: 150 }}
        class="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
    />

    <!-- Modal -->
    <div
        transition:scale={{ duration: 150, start: 0.95 }}
        class="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
    >
        <div
            class="relative flex flex-col rounded-xl border border-border bg-background shadow-2xl"
        >
            <!-- Header -->
            <div
                class="flex items-center justify-between border-b border-border p-4"
            >
                <div>
                    <h2
                        id="settings-title"
                        class="text-lg font-semibold text-foreground"
                    >
                        Settings
                    </h2>
                    <p class="text-sm text-muted-foreground">
                        Customize your experience.
                    </p>
                </div>
                <button
                    on:click={closeModal}
                    class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Close settings"
                >
                    <X class="h-5 w-5" />
                </button>
            </div>

            <!-- Content -->
            <div class="flex flex-col gap-y-6 p-6">
                <!-- Account Section -->
                <div class="flex flex-col gap-y-3">
                    <h3 class="text-sm font-semibold text-foreground">
                        Account
                    </h3>
                    <div
                        class="flex items-center gap-4 rounded-lg border border-border bg-muted/50 p-4"
                    >
                        <div
                            class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground"
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
                        <div class="flex-1">
                            <p class="font-medium text-foreground">
                                Profile Picture
                            </p>
                            <p class="text-xs text-muted-foreground">
                                PNG, JPG, GIF up to 5MB.
                            </p>
                            <input
                                bind:this={fileInput}
                                on:change={handleFileSelect}
                                type="file"
                                accept="image/png, image/jpeg, image/gif"
                                hidden
                            />
                            <button
                                on:click={() => fileInput.click()}
                                disabled={isUploading}
                                class="mt-2 text-sm font-semibold text-primary transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
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
                        <p class="text-center text-xs text-danger">
                            {uploadError}
                        </p>
                    {/if}
                </div>

                <!-- Display Section -->
                <div class="flex flex-col gap-y-3">
                    <h3 class="text-sm font-semibold text-foreground">
                        Display
                    </h3>
                    <label
                        class="flex cursor-pointer items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                    >
                        <div>
                            <p class="font-medium text-foreground">
                                Show File Previews
                            </p>
                            <p class="text-xs text-muted-foreground">
                                Display rich previews for images and videos.
                            </p>
                        </div>
                        <input
                            type="checkbox"
                            class="toggle"
                            bind:checked={$settingsStore.showFilePreviews}
                        />
                    </label>
                </div>
            </div>

            <!-- Footer / Logout -->
            <div class="border-t border-border bg-muted/30 p-4">
                <button
                    on:click={handleLogout}
                    class="flex w-full items-center justify-center gap-2 rounded-md bg-danger/10 py-2.5 font-semibold text-danger transition-colors hover:bg-danger/20"
                >
                    <LogOut class="h-4 w-4" />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .toggle {
        -webkit-appearance: none;
        appearance: none;
        position: relative;
        width: 38px;
        height: 22px;
        border-radius: 9999px;
        background-color: hsl(var(--muted));
        border: 1px solid hsl(var(--border));
        transition: background-color 0.2s ease-in-out;
        flex-shrink: 0;
    }
    .toggle::after {
        content: "";
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        border-radius: 9999px;
        background-color: hsl(var(--muted-foreground));
        transition:
            transform 0.2s ease-in-out,
            background-color 0.2s ease-in-out;
    }
    .toggle:checked {
        background-color: hsl(var(--primary));
        border-color: hsl(var(--primary));
    }
    .toggle:checked::after {
        background-color: hsl(var(--primary-foreground));
        transform: translateX(16px);
    }
</style>
