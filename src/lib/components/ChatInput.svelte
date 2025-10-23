<script lang="ts">
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { Send, Paperclip, X, FileIcon, Reply } from 'lucide-svelte';
	import { getUploadUrl } from '$lib/services/files';
	import { getAuthToken } from '$lib/services/api';
	import { agentStore } from '$lib/stores/agentStore'; // ✅ IMPORT agent store
	import type { Attachment, Agent } from '$lib/types';

	export let isLoading: boolean = false;
	export let isStreaming: boolean = false;
	export let reattachedFiles: Attachment[] = [];

	let message = '';
	let stagedFiles: StagedAttachment[] = [];
	let isUploading = false;
	let uploadError: string | null = null;
	let textareaElement: HTMLTextAreaElement;
	let fileInputElement: HTMLInputElement;

	const dispatch = createEventDispatcher();

	// --- ✅ NEW: State for Agent Suggestions ---
	let showSuggestions = false;
	let suggestions: Agent[] = [];
	let activeSuggestionIndex = 0;
	let suggestionPosition = { top: 0, left: 0 };
	let suggestionTriggerPosition = 0; // The character index of the '@'
	let ghostElement: HTMLDivElement; // For calculating cursor position

	interface StagedAttachment {
		file: File;
		uploadData: { upload_url: string; upload_fields: Record<string, string>; file_id: string; s3_key: string; };
		filename: string;
		preview?: string;
	}
	
	onMount(() => {
		// Close suggestions if user clicks outside
		document.addEventListener('click', handleClickOutside);
	});
	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
	});

	function handleClickOutside(event: MouseEvent) {
		if (showSuggestions && !event.composedPath().includes(textareaElement)) {
			showSuggestions = false;
		}
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
		if (isLoading || isStreaming || (!message.trim() && stagedFiles.length === 0 && reattachedFiles.length === 0)) return;
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
						size: fileInfo.file.size
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
		if (showSuggestions) {
			if (event.key === 'ArrowDown') {
				event.preventDefault();
				activeSuggestionIndex = (activeSuggestionIndex + 1) % suggestions.length;
			} else if (event.key === 'ArrowUp') {
				event.preventDefault();
				activeSuggestionIndex = (activeSuggestionIndex - 1 + suggestions.length) % suggestions.length;
			} else if (event.key === 'Enter' || event.key === 'Tab') {
				event.preventDefault();
				selectSuggestion(suggestions[activeSuggestionIndex]);
			} else if (event.key === 'Escape') {
				event.preventDefault();
				showSuggestions = false;
			}
		} else if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	}

	// ✅ NEW: Handle input to trigger suggestions
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
				
				// Calculate position for the suggestion box
				const textToMeasure = message.substring(0, suggestionTriggerPosition);
				ghostElement.textContent = textToMeasure;
				const ghostSpan = document.createElement('span');
				ghostElement.appendChild(ghostSpan);
				
				const rect = textareaElement.getBoundingClientRect();
				const ghostRect = ghostSpan.getBoundingClientRect();

				suggestionPosition = {
					top: rect.top - (ghostRect.top - rect.top),
					left: rect.left + (ghostRect.left - rect.left)
				};

			} else {
				showSuggestions = false;
			}
		} else {
			showSuggestions = false;
		}
	}

	// ✅ NEW: Select a suggestion and update the textarea
	function selectSuggestion(agent: Agent) {
		const textBefore = message.substring(0, suggestionTriggerPosition);
		const textAfter = message.substring(textareaElement.selectionStart);
		message = `${textBefore}@${agent.name} ${textAfter}`;
		
		showSuggestions = false;
		
		// Move cursor after the inserted name
		setTimeout(() => {
			const newCursorPos = suggestionTriggerPosition + agent.name.length + 2;
			textareaElement.focus();
			textareaElement.setSelectionRange(newCursorPos, newCursorPos);
		}, 0);
	}

	async function handleFileSelect(event: Event) {
		// ... (function unchanged)
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
		// ... (function unchanged)
		const file = stagedFiles[index];
		if (file.preview) URL.revokeObjectURL(file.preview);
		stagedFiles = stagedFiles.filter((_, i) => i !== index);
	}
	function removeReattachedFile(index: number) {
		// ... (function unchanged)
		dispatch('removeReattached', { index });
	}
</script>

<div class="w-full bg-transparent px-4 py-2">
	<div class="max-w-4xl mx-auto relative">
		<!-- ✅ NEW: Agent Suggestion Popup -->
		{#if showSuggestions}
			<div
				transition:fade={{ duration: 100 }}
				class="absolute bottom-full mb-2 w-full max-w-md rounded-lg border border-foreground/10 bg-background/90 backdrop-blur-md shadow-2xl overflow-hidden z-30"
				style="left: {suggestionPosition.left}px; transform: translateX(-50%); max-height: 300px; overflow-y: auto;"
			>
				<ul class="p-1">
					{#each suggestions as agent, i (agent.id)}
						<li>
							<button
								class="w-full text-left flex items-center gap-3 p-2 rounded-md transition-colors"
								class:bg-primary={activeSuggestionIndex === i}
								on:click={() => selectSuggestion(agent)}
								on:mouseenter={() => (activeSuggestionIndex = i)}
							>
								<img src={agent.avatar} alt={agent.name} class="w-10 h-10 rounded-md object-cover flex-shrink-0" />
								<div class="min-w-0">
									<p class="font-semibold text-foreground truncate">{agent.name}</p>
									<p class="text-xs text-muted-foreground truncate">{agent.description}</p>
								</div>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		<!-- Staged File Preview Area -->
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

		<!-- Re-attached File Preview Area -->
		{#if reattachedFiles.length > 0}
			<div class="mb-3 flex flex-wrap gap-3">
				{#each reattachedFiles as file, index (file.s3_key)}
					<div
						class="relative group flex items-center gap-2 rounded-lg bg-primary/10 backdrop-blur-sm p-2 border border-primary/20 shadow-md"
					>
						<div class="flex h-11 w-11 items-center justify-center rounded-md bg-black/10">
							{#if file.url && file.content_type?.startsWith('image/')}
								<img
									src={file.url}
									alt={file.filename}
									class="w-full h-full rounded-md object-cover"
								/>
							{:else}
								<Reply class="w-5 h-5 text-primary" />
							{/if}
						</div>
						<span class="text-sm max-w-[120px] truncate text-foreground">{file.filename}</span>
						<button
							on:click={() => removeReattachedFile(index)}
							class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground/80 text-background opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground"
							aria-label="Remove re-attached file"
						>
							<X class="w-3 h-3" />
						</button>
					</div>
				{/each}
			</div>
		{/if}

		<!-- ✅ NEW: Ghost element for cursor position calculation -->
		<div bind:this={ghostElement} class="absolute whitespace-pre-wrap -z-10 opacity-0 pointer-events-none chat-input-ghost"></div>

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
				on:input={handleInput}
				disabled={isLoading || isStreaming || isUploading}
				placeholder="Message Hannah..."
				class="flex-1 resize-none bg-transparent py-[18px] text-base placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 chat-input-textarea"
				rows="1"
			></textarea>
			<div class="flex-shrink-0 p-2">
				<button
					on:click={handleSubmit}
					disabled={isLoading || isStreaming || isUploading || (!message.trim() && stagedFiles.length === 0 && reattachedFiles.length === 0)}
					class="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50 disabled:bg-muted"
					aria-label="Send message"
				>
					<Send class="w-5 h-5" />
				</button>
			</div>
		</div>
	</div>
</div>

<!-- ✅ NEW: Styles for the ghost element to match the textarea -->
<style>
	.chat-input-textarea, .chat-input-ghost {
		flex: 1 1 0%;
		resize: none;
		background-color: transparent;
		padding-top: 18px;
		padding-bottom: 18px;
		font-size: 1rem; /* 16px */
		line-height: 1.5rem; /* 24px */
		border: none;
		outline: none;
	}
</style>