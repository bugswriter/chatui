<!-- src/lib/components/ChatInput.svelte -->
<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { fade } from "svelte/transition";
    import { Send, Paperclip, X, FileIcon, Reply } from "lucide-svelte";
    import { getUploadUrl } from "$lib/services/files";
    import { agentStore } from "$lib/stores/agentStore";
    import { authStore } from "$lib/stores/authStore"; // ✅ To check auth status
    import { uiStore } from "$lib/stores/uiStore"; // ✅ To open the modal directly
    import type { Attachment, Agent } from "$lib/types";

    export let isLoading: boolean = false;
    export let isStreaming: boolean = false;
    export let reattachedFiles: Attachment[] = [];

    let message = "";
    let stagedFiles: StagedAttachment[] = [];
    let isUploading = false;
    let uploadError: string | null = null;
    let textareaElement: HTMLTextAreaElement;
    let fileInputElement: HTMLInputElement;

    const dispatch = createEventDispatcher();

    // --- State for Agent Suggestions ---
    let showSuggestions = false;
    let suggestions: Agent[] = [];
    let activeSuggestionIndex = 0;
    let suggestionTriggerPosition = 0;

    interface StagedAttachment {
        file: File;
        uploadData: {
            upload_url: string;
            upload_fields: Record<string, string>;
            file_id: string;
            s3_key: string;
        };
        filename: string;
        preview?: string;
    }

    onMount(() => {
        document.addEventListener("click", handleClickOutside);
    });
    onDestroy(() => {
        document.removeEventListener("click", handleClickOutside);
    });

    function handleClickOutside(event: MouseEvent) {
        if (
            showSuggestions &&
            !event.composedPath().includes(textareaElement)
        ) {
            showSuggestions = false;
        }
    }

    function autoresize(element: HTMLTextAreaElement) {
        function resize() {
            element.style.height = "auto";
            const newHeight = Math.min(element.scrollHeight, 200);
            element.style.height = `${newHeight}px`;
        }
        element.addEventListener("input", resize);
        requestAnimationFrame(resize);
        return {
            destroy() {
                element.removeEventListener("input", resize);
            },
        };
    }

    async function handleSubmit() {
        // ✅ SIMPLE AUTH CHECK: If not logged in, open modal and stop.
        if (!$authStore.isAuthenticated) {
            uiStore.openLoginModal();
            return;
        }

        if (
            isLoading ||
            isStreaming ||
            (!message.trim() &&
                stagedFiles.length === 0 &&
                reattachedFiles.length === 0)
        )
            return;

        isUploading = true;
        uploadError = null;
        try {
            const uploadedAttachments = await Promise.all(
                stagedFiles.map(async (fileInfo) => {
                    const formData = new FormData();
                    Object.entries(fileInfo.uploadData.upload_fields).forEach(
                        ([key, value]) => formData.append(key, value),
                    );
                    formData.append("file", fileInfo.file);
                    const s3Response = await fetch(
                        fileInfo.uploadData.upload_url,
                        { method: "POST", body: formData },
                    );
                    if (!s3Response.ok)
                        throw new Error(
                            `Upload failed for ${fileInfo.filename}`,
                        );
                    return {
                        file_id: fileInfo.uploadData.file_id,
                        s3_key: fileInfo.uploadData.s3_key,
                        filename: fileInfo.filename,
                        content_type:
                            fileInfo.file.type || "application/octet-stream",
                        size: fileInfo.file.size,
                    };
                }),
            );
            const allAttachments = [...uploadedAttachments, ...reattachedFiles];
            dispatch("send", { message, attachments: allAttachments });
            message = "";
            stagedFiles = [];
        } catch (error) {
            uploadError =
                error instanceof Error
                    ? error.message
                    : "An unknown upload error occurred.";
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
                selectSuggestion(suggestions[activeSuggestionIndex]);
            } else if (event.key === "Escape") {
                event.preventDefault();
                showSuggestions = false;
            }
        } else if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    }

    function handleInput() {
        const cursorPosition = textareaElement.selectionStart;
        const textBeforeCursor = message.substring(0, cursorPosition);
        const atMatch = textBeforeCursor.match(/@(\w*)$/);

        if (atMatch) {
            const query = atMatch[1];
            const results = agentStore.search(query);
            if (results.length > 0) {
                suggestions = results;
                showSuggestions = true;
                activeSuggestionIndex = 0;
                suggestionTriggerPosition = atMatch.index!;
            } else {
                showSuggestions = false;
            }
        } else {
            showSuggestions = false;
        }
    }

    function selectSuggestion(agent: Agent) {
        const textBefore = message.substring(0, suggestionTriggerPosition);
        const textAfter = message.substring(textareaElement.selectionStart);
        message = `${textBefore}@${agent.name} ${textAfter}`;
        showSuggestions = false;
        setTimeout(() => {
            const newCursorPos =
                suggestionTriggerPosition + agent.name.length + 2;
            textareaElement.focus();
            textareaElement.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    }

    async function handleFileSelect(event: Event) {
        // ✅ SIMPLE AUTH CHECK: If not logged in, open modal and stop.
        if (!$authStore.isAuthenticated) {
            uiStore.openLoginModal();
            // Clear the file input so the user can try again after login
            const target = event.target as HTMLInputElement;
            if (target) target.value = "";
            return;
        }

        const target = event.target as HTMLInputElement;
        const files = Array.from(target.files || []);
        if (files.length === 0) return;

        isUploading = true;
        uploadError = null;
        try {
            const newStagedFiles: StagedAttachment[] = [];
            for (const file of files) {
                const uploadData = await getUploadUrl(
                    file.name,
                    file.type || "application/octet-stream",
                );
                const stagedFile: StagedAttachment = {
                    file,
                    uploadData,
                    filename: file.name,
                };
                if (file.type.startsWith("image/"))
                    stagedFile.preview = URL.createObjectURL(file);
                newStagedFiles.push(stagedFile);
            }
            stagedFiles = [...stagedFiles, ...newStagedFiles];
        } catch (error) {
            uploadError =
                error instanceof Error ? error.message : "File staging failed.";
        } finally {
            isUploading = false;
            if (fileInputElement) fileInputElement.value = "";
        }
    }

    function removeStagedFile(index: number) {
        const file = stagedFiles[index];
        if (file.preview) URL.revokeObjectURL(file.preview);
        stagedFiles = stagedFiles.filter((_, i) => i !== index);
    }

    function removeReattachedFile(index: number) {
        dispatch("removeReattached", { index });
    }
</script>

<div class="w-full bg-transparent px-4">
    <div
        class="max-w-4xl bg-background backdrop-blur-md rounded-t-4xl pb-3 mx-auto relative"
    >
        <!-- Agent Suggestion Popup is always available -->
        {#if showSuggestions}
            <div
                transition:fade={{ duration: 100 }}
                class="absolute bottom-full mb-2 w-full max-w-sm rounded-lg border border-border bg-muted/90 backdrop-blur-md shadow-2xl overflow-hidden z-30"
            >
                <ul class="p-1 max-h-[300px] overflow-y-auto">
                    {#each suggestions as agent, i (agent.id)}
                        {@const isActive = activeSuggestionIndex === i}
                        <li>
                            <button
                                class="w-full text-left flex items-center gap-3 p-2 rounded-md transition-colors"
                                class:bg-primary={isActive}
                                class:text-primary-foreground={isActive}
                                on:click={() => selectSuggestion(agent)}
                                on:mouseenter={() =>
                                    (activeSuggestionIndex = i)}
                            >
                                <img
                                    src={agent.avatar}
                                    alt={agent.name}
                                    class="w-10 h-10 rounded-md object-cover flex-shrink-0"
                                />
                                <div class="min-w-0">
                                    <p
                                        class="font-semibold truncate"
                                        class:text-primary-foreground={isActive}
                                    >
                                        {agent.name}
                                    </p>
                                    <p
                                        class="text-xs truncate"
                                        class:text-primary-foreground={isActive}
                                        class:text-muted-foreground={!isActive}
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

        <!-- File Previews -->
        {#if stagedFiles.length > 0 || reattachedFiles.length > 0}
            <div class="mb-3 flex flex-wrap gap-3">
                {#each stagedFiles as file, index (file.filename + file.file.size)}
                    <div
                        class="relative group flex items-center gap-2 rounded-lg bg-muted p-2 border border-border shadow-sm"
                    >
                        {#if file.preview}
                            <img
                                src={file.preview}
                                alt={file.filename}
                                class="w-11 h-11 rounded-md object-cover"
                            />
                        {:else}
                            <div
                                class="flex h-11 w-11 items-center justify-center rounded-md bg-background"
                            >
                                <FileIcon
                                    class="w-6 h-6 text-muted-foreground"
                                />
                            </div>
                        {/if}
                        <span
                            class="text-sm max-w-[120px] truncate text-foreground"
                            >{file.filename}</span
                        >
                        <button
                            on:click={() => removeStagedFile(index)}
                            class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-danger hover:text-danger-foreground"
                            aria-label="Remove file"
                            ><X class="w-3 h-3" /></button
                        >
                    </div>
                {/each}
                {#each reattachedFiles as file, index (file.s3_key)}
                    <div
                        class="relative group flex items-center gap-2 rounded-lg bg-primary/10 p-2 border border-primary/20 shadow-sm"
                    >
                        <div
                            class="flex h-11 w-11 items-center justify-center rounded-md bg-background/50"
                        >
                            {#if file.url && file.content_type?.startsWith("image/")}
                                <img
                                    src={file.url}
                                    alt={file.filename}
                                    class="w-full h-full rounded-md object-cover"
                                />
                            {:else}
                                <Reply class="w-5 h-5 text-primary" />
                            {/if}
                        </div>
                        <span
                            class="text-sm max-w-[120px] truncate text-foreground"
                            >{file.filename}</span
                        >
                        <button
                            on:click={() => removeReattachedFile(index)}
                            class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-muted-foreground/20 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all hover:bg-danger hover:text-danger-foreground"
                            aria-label="Remove re-attached file"
                            ><X class="w-3 h-3" /></button
                        >
                    </div>
                {/each}
            </div>
        {/if}

        <!-- Main Input Container is always visible -->
        <div
            class="relative flex w-full items-end rounded-2xl backdrop-blur-lg bg-background border border-border shadow-md transition-all focus-within:ring-2 focus-within:ring-primary/40"
        >
            <input
                bind:this={fileInputElement}
                type="file"
                multiple
                hidden
                on:change={handleFileSelect}
            />
            <div class="flex-shrink-0 p-2">
                <button
                    on:click={() => fileInputElement.click()}
                    disabled={isLoading || isStreaming || isUploading}
                    class="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
                    aria-label="Attach file"
                >
                    <Paperclip class="w-5 h-5" />
                </button>
            </div>
            <textarea
                bind:this={textareaElement}
                use:autoresize
                bind:value={message}
                on:keydown={handleKeyDown}
                on:input={handleInput}
                disabled={isLoading || isStreaming || isUploading}
                placeholder="Message @Agent or ask anything..."
                class="flex-1 resize-none bg-transparent py-[16px] text-foreground placeholder:text-foreground/50 focus:outline-none disabled:opacity-50"
                rows="1"
            ></textarea>
            <div class="flex-shrink-0 p-2">
                <button
                    on:click={handleSubmit}
                    disabled={isLoading ||
                        isStreaming ||
                        isUploading ||
                        (!message.trim() &&
                            stagedFiles.length === 0 &&
                            reattachedFiles.length === 0)}
                    class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:bg-primary/90 disabled:bg-border disabled:text-muted-foreground disabled:shadow-none"
                    aria-label="Send message"
                >
                    <Send class="w-5 h-5" />
                </button>
            </div>
        </div>
    </div>
</div>
