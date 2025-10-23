<!-- src/lib/components/LoadingMessage.svelte -->

<script lang="ts">
	import { Bot } from 'lucide-svelte';
	export let agentAvatar: string | undefined = undefined;
	export let agentName: string | undefined = undefined;
</script>

<div class="flex items-start gap-3 animate-[fade-in_0.5s_ease-out] mb-4">
	<div class="flex h-9 w-9 flex-shrink-0 items-center justify-center self-end rounded-full bg-muted">
		{#if agentAvatar}
			<img src={agentAvatar} alt={agentName || 'Agent'} class="h-full w-full rounded-full object-cover" />
		{:else}
			<Bot class="h-5 w-5 text-muted-foreground" />
		{/if}
	</div>

	<div class="flex max-w-[75%] flex-col gap-1">
		<div class="rounded-lg bg-muted px-4 py-3 text-foreground">
			<div class="flex items-center gap-1.5">
				<!-- CORRECTED: from <span /> to <span></span> -->
				<span class="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce"></span>
				<span class="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0.2s]"></span>
				<span class="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0.4s]"></span>
			</div>
		</div>
	</div>
</div>