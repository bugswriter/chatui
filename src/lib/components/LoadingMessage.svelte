<script lang="ts">
	import { Bot } from 'lucide-svelte';
	export let agentAvatar: string | undefined = undefined;
	export let agentName: string | undefined = undefined;
</script>

<div class="flex items-start gap-3 animate-[fade-in_0.5s_ease-out] mb-4">
	<!-- Avatar -->
	<div
		class="flex h-10 w-10 flex-shrink-0 items-center justify-center self-end rounded-full bg-gray-100 shadow-md"
	>
		{#if agentAvatar}
			<img
				src={agentAvatar}
				alt={agentName || 'Agent'}
				class="h-full w-full rounded-full object-cover"
			/>
		{:else}
			<Bot class="h-5 w-5 text-gray-500" />
		{/if}
	</div>

	<!-- Bubble -->
	<!-- UNIFIED DESIGN: Standard light gray bubble with subtle blur -->
	<div class="flex max-w-[75%] flex-col gap-1">
		<div
			class="rounded-xl bg-gray-100/80 backdrop-blur-lg px-4 py-3 text-gray-900 shadow-sm"
		>
			<div class="flex items-center gap-1.5">
				<span
					class="h-2 w-2 rounded-full bg-gray-500/60 animate-bounce"
				></span>
				<span
					class="h-2 w-2 rounded-full bg-gray-500/60 animate-bounce [animation-delay:0.2s]"
				></span>
				<span
					class="h-2 w-2 rounded-full bg-gray-500/60 animate-bounce [animation-delay:0.4s]"
				></span>
			</div>
		</div>
	</div>
</div>
