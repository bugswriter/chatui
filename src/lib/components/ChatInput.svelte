<!-- src/lib/components/ChatInput.svelte -->
<script lang="ts">
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { slide } from "svelte/transition";
    import { agentStore } from "$lib/stores/agentStore";
    import { authStore } from "$lib/stores/authStore";
    import { uiStore } from "$lib/stores/uiStore";
    import type { Agent, Attachment } from "$lib/types";
    import { getUploadUrl } from "$lib/services/files";
    import { File as FileIcon, Paperclip, Reply, Send, X } from "lucide-svelte";

    export let isLoading: boolean = false;
    export let isStreaming: boolean = false;
    export let reattachedFiles: Attachment[] = [];

    let message = "";
    let stagedFiles: StagedAttachment[] = [];
    let isUploading = false;
    let uploadError: string | null = null;
    let textareaElement: HTMLTextAreaElement;
    let fileInputElement: HTMLInputElement;
    let suggestionsContainer: HTMLDivElement;
    let isFocused = false;

    const dispatch = createEventDispatcher();

    let showSuggestions = false;
    let suggestions: Agent[] = [];
    let activeSuggestionIndex = -1;
    let suggestionTriggerPosition: number | null = null;

    interface StagedAttachment {
        file: File;
        preview: string | null;
        filename: string;
        uploadData: {
            upload_url: string;
            upload_fields: Record<string, string>;
            file_id: string;
            s3_key: string;
        };
    }

    onMount(() => {
        document.addEventListener("click", handleClickOutside, true);
    });

    onDestroy(() => {
        document.removeEventListener("click", handleClickOutside, true);
    });

    function handleClickOutside(event: MouseEvent) {
        if (
            showSuggestions &&
            suggestionsContainer &&
            !suggestionsContainer.contains(event.target as Node)
        ) {
            showSuggestions = false;
        }
    }

    function autoresize() {
        if (!textareaElement) return;
        textareaElement.style.height = "auto";
        const newHeight = Math.min(textareaElement.scrollHeight, 200);
        textareaElement.style.height = `${newHeight}px`;
    }

    async function handleSubmit() {
        if (
            isUploading ||
            isStreaming ||
            (message.trim() === "" &&
                stagedFiles.length === 0 &&
                reattachedFiles.length === 0)
        ) {
            return;
        }
        if (!$authStore.isAuthenticated) {
            uiStore.openLoginModal();
            return;
        }

        isUploading = true;
        uploadError = null;

        try {
            const uploadedAttachments: Attachment[] = await Promise.all(
                stagedFiles.map(async (stagedFile) => {
                    const formData = new FormData();
                    Object.entries(stagedFile.uploadData.upload_fields).forEach(
                        ([key, value]) => {
                            formData.append(key, value);
                        },
                    );
                    formData.append("file", stagedFile.file);

                    const s3Response = await fetch(
                        stagedFile.uploadData.upload_url,
                        {
                            method: "POST",
                            body: formData,
                        },
                    );

                    if (!s3Response.ok) {
                        throw new Error(
                            `Upload failed for ${stagedFile.filename}`,
                        );
                    }

                    return {
                        file_id: stagedFile.uploadData.file_id,
                        s3_key: stagedFile.uploadData.s3_key,
                        filename: stagedFile.filename,
                        content_type:
                            stagedFile.file.type || "application/octet-stream",
                        size: stagedFile.file.size,
                    };
                }),
            );

            const allAttachments = [...uploadedAttachments, ...reattachedFiles];

            dispatch("send", {
                message: message.trim(),
                attachments: allAttachments,
            });

            message = "";
            stagedFiles = [];
            autoresize();
        } catch (error) {
            uploadError =
                error instanceof Error
                    ? error.message
                    : "An unknown error occurred during upload.";
        } finally {
            isUploading = false;
        }
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (showSuggestions) {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                activeSuggestionIndex =
                    (activeSuggestionIndex + 1) % suggestions.length;
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                activeSuggestionIndex =
                    (activeSuggestionIndex - 1 + suggestions.length) %
                    suggestions.length;
            } else if (event.key === "Enter" || event.key === "Tab") {
                event.preventDefault();
                if (activeSuggestionIndex !== -1) {
                    selectSuggestion(suggestions[activeSuggestionIndex]);
                }
            } else if (event.key === "Escape") {
                showSuggestions = false;
            }
            return;
        }

        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    }

    function handleInput() {
        autoresize();
        const cursorPosition = textareaElement.selectionStart;
        const textBeforeCursor = message.substring(0, cursorPosition);
        const atMatch = textBeforeCursor.match(/@(\w*)$/);

        if (atMatch) {
            suggestionTriggerPosition = atMatch.index;
            const query = atMatch[1].toLowerCase();
            const results = agentStore.search(query);
            if (results.length > 0) {
                suggestions = results;
                showSuggestions = true;
                activeSuggestionIndex = 0;
            } else {
                showSuggestions = false;
            }
        } else {
            showSuggestions = false;
        }
    }

    function selectSuggestion(agent: Agent) {
        if (suggestionTriggerPosition === null) return;

        const textBefore = message.substring(0, suggestionTriggerPosition);
        const textAfter = message.substring(textareaElement.selectionStart);
        message = `${textBefore}@${agent.name} ${textAfter}`;

        showSuggestions = false;
        suggestionTriggerPosition = null;

        const newCursorPos = textBefore.length + agent.name.length + 2;
        textareaElement.focus();
        setTimeout(() => {
            textareaElement.setSelectionRange(newCursorPos, newCursorPos);
            autoresize();
        }, 10);
    }

    async function handleFileSelect(event: Event) {
        if (!$authStore.isAuthenticated) {
            uiStore.openLoginModal();
            return;
        }
        const target = event.target as HTMLInputElement;
        if (!target.files) return;

        uploadError = null;
        const files = Array.from(target.files);
        if (files.length === 0) return;

        try {
            const newStagedFilesPromises = files.map(async (file) => {
                const uploadData = await getUploadUrl(
                    file.name,
                    file.type || "application/octet-stream",
                );
                let preview: string | null = null;
                if (file.type.startsWith("image/")) {
                    preview = URL.createObjectURL(file);
                }
                return { file, preview, filename: file.name, uploadData };
            });

            const newStagedFiles = await Promise.all(newStagedFilesPromises);
            stagedFiles = [...stagedFiles, ...newStagedFiles];
        } catch (err) {
            uploadError =
                err instanceof Error
                    ? err.message
                    : "Failed to prepare files for upload.";
        } finally {
            if (fileInputElement) {
                fileInputElement.value = "";
            }
        }
    }

    function removeStagedFile(index: number) {
        const file = stagedFiles[index];
        if (file.preview) {
            URL.revokeObjectURL(file.preview);
        }
        stagedFiles = stagedFiles.filter((_, i) => i !== index);
    }

    function removeReattachedFile(index: number) {
        dispatch("removeReattached", { index });
    }

    $: canSend =
        !isUploading &&
        !isStreaming &&
        (message.trim() !== "" ||
            stagedFiles.length > 0 ||
            reattachedFiles.length > 0);
</script>

<div class="container relative mx-auto max-w-3xl px-4 pt-2 pb-1 sm:px-6">
    {#if showSuggestions}
        <div
            bind:this={suggestionsContainer}
            class="absolute bottom-full mb-2 w-full origin-bottom overflow-hidden rounded-xl border bg-popover shadow-lg"
            transition:slide={{ duration: 150 }}
        >
            <ul class="max-h-[300px] overflow-y-auto p-1">
                {#each suggestions as agent, i (agent.id)}
                    {@const isActive = activeSuggestionIndex === i}
                    <li>
                        <button
                            type="button"
                            on:click={() => selectSuggestion(agent)}
                            class="flex w-full items-center gap-3 rounded-lg p-2 text-left"
                            class:bg-muted={isActive}
                        >
                            <img
                                src={agent.avatar}
                                alt={agent.name}
                                class="h-8 w-8 rounded-full object-cover"
                            />
                            <div class="min-w-0">
                                <p
                                    class="truncate text-sm font-medium text-popover-foreground"
                                >
                                    {agent.name}
                                </p>
                                <p
                                    class="truncate text-xs text-muted-foreground"
                                >
                                    {agent.description}
                                </p>
                            </div>
                        </button>
                    </li>
                {/each}
            </ul>
        </div>
    {/if}

    {#if stagedFiles.length > 0 || reattachedFiles.length > 0}
        <div class="mb-3 flex flex-wrap gap-3">
            {#each stagedFiles as file, index (file.uploadData.s3_key)}
                <div
                    class="flex items-center gap-2 rounded-lg bg-muted p-2 text-sm"
                >
                    <div
                        class="flex h-8 w-8 items-center justify-center rounded-md bg-background"
                    >
                        {#if file.preview}
                            <img
                                src={file.preview}
                                alt={file.filename}
                                class="h-full w-full rounded-md object-cover"
                            />
                        {:else}
                            <FileIcon class="h-5 w-5 text-muted-foreground" />
                        {/if}
                    </div>
                    <span class="max-w-[120px] truncate text-foreground"
                        >{file.filename}</span
                    >
                    <button
                        on:click={() => removeStagedFile(index)}
                        class="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                    >
                        <X class="h-3 w-3" />
                    </button>
                </div>
            {/each}
            {#each reattachedFiles as file, index (file.s3_key)}
                <div
                    class="flex items-center gap-2 rounded-lg bg-muted p-2 text-sm"
                >
                    <div
                        class="flex h-8 w-8 items-center justify-center rounded-md bg-background"
                    >
                        {#if file.url && file.content_type?.startsWith("image/")}
                            <img
                                src={file.url}
                                alt={file.filename}
                                class="h-full w-full rounded-md object-cover"
                            />
                        {:else}
                            <Reply class="h-5 w-5 text-primary" />
                        {/if}
                    </div>
                    <span class="max-w-[120px] truncate text-foreground"
                        >{file.filename}</span
                    >
                    <button
                        on:click={() => removeReattachedFile(index)}
                        class="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                    >
                        <X class="h-3 w-3" />
                    </button>
                </div>
            {/each}
        </div>
    {/if}

    {#if uploadError}
        <p class="mb-2 text-center text-sm text-danger">{uploadError}</p>
    {/if}

    <div
        class="relative flex min-h-[3.5rem] w-full items-end gap-2 rounded-3xl border border-border/50 bg-background/80 p-2 shadow-lg backdrop-blur-lg transition-all"
        class:ring-2={isFocused}
        class:ring-ring={isFocused}
    >
        <input
            bind:this={fileInputElement}
            type="file"
            multiple
            hidden
            on:change={handleFileSelect}
            accept="image/*, application/pdf, .txt, .md"
        />

        <button
            on:click={() => fileInputElement.click()}
            disabled={isUploading || isStreaming}
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label="Attach file"
        >
            <Paperclip class="h-5 w-5" />
        </button>

        <textarea
            bind:this={textareaElement}
            bind:value={message}
            on:keydown={handleKeyDown}
            on:input={handleInput}
            on:focus={() => (isFocused = true)}
            on:blur={() => (isFocused = false)}
            disabled={isUploading || isStreaming}
            rows="1"
            placeholder="Type a message..."
            class="w-full flex-1 resize-none self-center border-none bg-transparent py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
        />

        <button
            on:click={handleSubmit}
            disabled={!canSend}
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:scale-90 disabled:bg-muted disabled:text-muted-foreground"
            aria-label="Send message"
        >
            {#if isUploading}
                <div
                    class="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
            {:else}
                <Send class="h-5 w-5" />
            {/if}
        </button>
    </div>
</div>
