<!-- src/routes/+layout.svelte -->

<script>
	// Import the global stylesheet. This will apply to every page in your app.
	import '../app.css';
</script>

<!-- The <slot /> component renders the content of the current page -->
<!-- (e.g., your +page.svelte file) -->
<slot />