<!-- src/lib/components/ChatInput.svelte -->

<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Send, Paperclip, X, FileIcon } from 'lucide-svelte';
	import { getUploadUrl } from '$lib/services/files';
	import { getAuthToken } from '$lib/services/api';

	export let isLoading: boolean = false;
	export let isStreaming: boolean = false;
	export let reattachedFiles: any[] = [];

	let message = '';
	let stagedFiles: StagedAttachment[] = [];
	let isUploading = false;
	let uploadError: string | null = null;
	let textareaElement: HTMLTextAreaElement;
	let fileInputElement: HTMLInputElement;

	const dispatch = createEventDispatcher();

	interface StagedAttachment {
		file: File;
		uploadData: { upload_url: string; upload_fields: Record<string, string>; file_id: string; s3_key: string; };
		filename: string;
		preview?: string;
	}

	function autoresize(element: HTMLTextAreaElement) {
		function resize() {
			element.style.height = 'auto';
			const newHeight = Math.min(element.scrollHeight, 200);
			element.style.height = `${newHeight}px`;
		}
		element.addEventListener('input', resize);
		requestAnimationFrame(resize);
		return { destroy() { element.removeEventListener('input', resize); } };
	}

	async function handleSubmit() {
		if (isLoading || isStreaming || (!message.trim() && stagedFiles.length === 0)) return;
		isUploading = true;
		uploadError = null;
		try {
			const uploadedAttachments = await Promise.all(
				stagedFiles.map(async (fileInfo) => {
					const formData = new FormData();
					Object.entries(fileInfo.uploadData.upload_fields).forEach(([key, value]) => formData.append(key, value));
					formData.append('file', fileInfo.file);
					const s3Response = await fetch(fileInfo.uploadData.upload_url, { method: 'POST', body: formData });
					if (!s3Response.ok) throw new Error(`Upload failed for ${fileInfo.filename}`);
					return {
						file_id: fileInfo.uploadData.file_id,
						s3_key: fileInfo.uploadData.s3_key,
						filename: fileInfo.filename,
						content_type: fileInfo.file.type || 'application/octet-stream',
						size: fileInfo.file.size // ✅ ADDED: Include the file size
					};
				})
			);
			const allAttachments = [...uploadedAttachments, ...reattachedFiles];
			dispatch('send', { message, attachments: allAttachments });
			message = '';
			stagedFiles = [];
		} catch (error) {
			uploadError = error instanceof Error ? error.message : 'An unknown upload error occurred.';
		} finally {
			isUploading = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	}

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = Array.from(target.files || []);
		if (files.length === 0) return;
		if (!getAuthToken()) {
			dispatch('requestLogin');
			return;
		}
		isUploading = true;
		uploadError = null;
		try {
			const newStagedFiles: StagedAttachment[] = [];
			for (const file of files) {
				const uploadData = await getUploadUrl(file.name, file.type || 'application/octet-stream');
				const stagedFile: StagedAttachment = { file, uploadData, filename: file.name };
				if (file.type.startsWith('image/')) stagedFile.preview = URL.createObjectURL(file);
				newStagedFiles.push(stagedFile);
			}
			stagedFiles = [...stagedFiles, ...newStagedFiles];
		} catch (error) {
			uploadError = error instanceof Error ? error.message : 'File staging failed.';
		} finally {
			isUploading = false;
			if (fileInputElement) fileInputElement.value = '';
		}
	}

	function removeStagedFile(index: number) {
		const file = stagedFiles[index];
		if (file.preview) URL.revokeObjectURL(file.preview);
		stagedFiles = stagedFiles.filter((_, i) => i !== index);
	}

	function removeReattachedFile(index: number) {
		dispatch('removeReattached', { index });
	}
</script>

<!-- The MARKUP remains unchanged -->
<div class="w-full bg-transparent px-4 py-2">
	<div class="max-w-4xl mx-auto">
		<!-- File Preview Area -->
		{#if stagedFiles.length > 0}
			<div class="mb-3 flex flex-wrap gap-3">
				{#each stagedFiles as file, index (file.filename + file.file.size)}
					<div
						class="relative group flex items-center gap-2 rounded-lg bg-background/20 backdrop-blur-sm p-2 border border-white/10 shadow-md"
					>
						{#if file.preview}
							<img
								src={file.preview}
								alt={file.filename}
								class="w-11 h-11 rounded-md object-cover"
							/>
						{:else}
							<div class="flex h-11 w-11 items-center justify-center rounded-md bg-black/10">
								<FileIcon class="w-6 h-6 text-white/70" />
							</div>
						{/if}
						<span class="text-sm max-w-[120px] truncate text-foreground">{file.filename}</span>
						<button
							on:click={() => removeStagedFile(index)}
							class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-background opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground"
							aria-label="Remove file"
						>
							<X class="w-3 h-3" />
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<!-- Main Input Container -->
		<div
			class="relative flex w-full items-end rounded-3xl bg-background/80 backdrop-blur-lg border border-foreground/10 shadow-md transition-all focus-within:border-primary/50 focus-within:shadow-lg"
		>
			<input bind:this={fileInputElement} type="file" multiple hidden on:change={handleFileSelect} />
			<div class="flex-shrink-0 p-2">
				<button
					on:click={() => fileInputElement.click()}
					disabled={isLoading || isStreaming || isUploading}
					class="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/10 hover:text-foreground disabled:opacity-50"
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
				disabled={isLoading || isStreaming || isUploading}
				placeholder="Message Hannah..."
				class="flex-1 resize-none bg-transparent py-[18px] text-base placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
				rows="1"
			></textarea>
			<div class="flex-shrink-0 p-2">
				<button
					on:click={handleSubmit}
					disabled={isLoading || isStreaming || isUploading || (!message.trim() && stagedFiles.length === 0)}
					class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50 disabled:bg-muted"
					aria-label="Send message"
				>
					<Send class="w-5 h-5" />
				</button>
			</div>
		</div>
	</div>
</div>