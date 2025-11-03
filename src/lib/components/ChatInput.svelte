<script lang="ts">
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { fade } from "svelte/transition";
    import { Send, Paperclip, X, FileIcon } from "lucide-svelte";
    import { getUploadUrl } from "$lib/services/files";
    import { getAuthToken } from "$lib/services/api";
    import { agentStore } from "$lib/stores/agentStore";
    import type { Attachment, Agent } from "$lib/types";

    export let isLoading = false;
    export let isStreaming = false;
    export let reattachedFiles: Attachment[] = [];

    const dispatch = createEventDispatcher();
    let message = "";
    let stagedFiles: StagedAttachment[] = [];
    let isUploading = false;
    let uploadError: string | null = null;
    let textareaElement: HTMLTextAreaElement;
    let fileInputElement: HTMLInputElement;
    let showSuggestions = false;

    interface StagedAttachment {
        file: File;
        uploadData: any;
        filename: string;
        preview?: string;
    }

    onMount(() => document.addEventListener("click", handleClickOutside));
    onDestroy(() => document.removeEventListener("click", handleClickOutside));

    function handleClickOutside(e: MouseEvent) {
        // Keeping this handler simple as suggestions logic is absent
        if (!e.composedPath().includes(textareaElement))
            showSuggestions = false;
    }

    function autoresize(el: HTMLTextAreaElement) {
        const resize = () => {
            el.style.height = "auto";
            el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
        };
        el.addEventListener("input", resize);
        requestAnimationFrame(resize);
        return { destroy: () => el.removeEventListener("input", resize) };
    }

    async function handleSubmit() {
        if (
            isLoading ||
            isStreaming ||
            (!message.trim() &&
                stagedFiles.length === 0 &&
                reattachedFiles.length === 0)
        )
            return;
        if (!getAuthToken()) {
            // Dispatch event for the layout to open the login modal
            dispatch("requestLogin");
            return;
        }
        isUploading = true;
        uploadError = null;
        try {
            const uploaded = await Promise.all(
                stagedFiles.map(async (f) => {
                    const formData = new FormData();
                    Object.entries(f.uploadData.upload_fields).forEach(
                        ([k, v]) => formData.append(k, v),
                    );
                    formData.append("file", f.file);
                    const r = await fetch(f.uploadData.upload_url, {
                        method: "POST",
                        body: formData,
                    });
                    if (!r.ok) throw new Error(`Upload failed: ${f.filename}`);
                    return {
                        file_id: f.uploadData.file_id,
                        s3_key: f.uploadData.s3_key,
                        filename: f.filename,
                        content_type: f.file.type,
                        size: f.file.size,
                    };
                }),
            );
            dispatch("send", {
                message,
                attachments: [...uploaded, ...reattachedFiles],
            });
            message = "";
            stagedFiles = [];
        } catch (err) {
            uploadError = err instanceof Error ? err.message : "Upload failed.";
        } finally {
            isUploading = false;
        }
    }

    async function handleFileSelect(e: Event) {
        const target = e.target as HTMLInputElement;
        const files = Array.from(target.files || []);
        if (!files.length) return;
        if (!getAuthToken()) {
            // Dispatch event for the layout to open the login modal
            dispatch("requestLogin");
            return;
        }
        isUploading = true;
        try {
            const newFiles = [];
            for (const file of files) {
                const data = await getUploadUrl(
                    file.name,
                    file.type || "application/octet-stream",
                );
                newFiles.push({
                    file,
                    uploadData: data,
                    filename: file.name,
                    preview: file.type.startsWith("image/")
                        ? URL.createObjectURL(file)
                        : undefined,
                });
            }
            stagedFiles = [...stagedFiles, ...newFiles];
        } finally {
            isUploading = false;
            if (fileInputElement) fileInputElement.value = "";
        }
    }

    function removeStagedFile(i: number) {
        const f = stagedFiles[i];
        if (f.preview) URL.revokeObjectURL(f.preview);
        stagedFiles.splice(i, 1);
        stagedFiles = [...stagedFiles];
    }
</script>

<!-- UNIFIED DESIGN: Use bg-white for fixed footer, consistent border/shadow -->
<div class="w-full px-4 py-4 bg-white border-t border-gray-100 shadow-md">
    <div class="max-w-3xl mx-auto relative">
        <!-- File Previews -->
        {#if stagedFiles.length > 0}
            <div class="mb-3 flex flex-wrap gap-3">
                {#each stagedFiles as file, i}
                    <!-- UNIFIED DESIGN: Standard rounded-xl card look -->
                    <div
                        class="relative group flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm"
                    >
                        {#if file.preview}
                            <img
                                src={file.preview}
                                alt={file.filename}
                                class="w-11 h-11 rounded-lg object-cover"
                            />
                        {:else}
                            <div
                                class="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-50"
                            >
                                <FileIcon class="w-5 h-5 text-gray-400" />
                            </div>
                        {/if}
                        <span
                            class="text-sm text-gray-700 max-w-[100px] truncate"
                            >{file.filename}</span
                        >
                        <button
                            on:click={() => removeStagedFile(i)}
                            class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                            aria-label="Remove file"
                        >
                            <X class="w-3 h-3" />
                        </button>
                    </div>
                {/each}
            </div>
        {/if}

        <!-- Chat Input Box -->
        <!-- UNIFIED DESIGN: Keeps the signature rounded-3xl, standardized shadow/border -->
        <div
            class="flex items-end gap-2 rounded-3xl bg-white border border-gray-300 shadow-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all"
        >
            <input
                bind:this={fileInputElement}
                type="file"
                multiple
                hidden
                on:change={handleFileSelect}
            />

            <!-- Attach Button -->
            <button
                on:click={() => fileInputElement.click()}
                disabled={isUploading || isStreaming}
                class="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50"
                aria-label="Attach"
            >
                <Paperclip class="w-5 h-5" />
            </button>

            <!-- Textarea -->
            <textarea
                bind:this={textareaElement}
                use:autoresize
                bind:value={message}
                placeholder="Message munni.ai..."
                on:keydown={(e) =>
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    (e.preventDefault(), handleSubmit())}
                class="flex-1 resize-none bg-transparent py-3 text-base text-gray-800 placeholder:text-gray-400 focus:outline-none"
                rows="1"
            ></textarea>

            <!-- Send Button -->
            <!-- UNIFIED DESIGN: Standardized black button with hover state -->
            <button
                on:click={handleSubmit}
                disabled={isUploading ||
                    isStreaming ||
                    (!message.trim() && stagedFiles.length === 0)}
                class="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white hover:bg-gray-700 transition-all shadow-md disabled:opacity-40"
                aria-label="Send"
            >
                <Send class="w-5 h-5" />
            </button>
        </div>
    </div>
</div>
