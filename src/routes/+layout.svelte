<script>
	// Import the global stylesheet. This will apply to every page in your app.
	import '../app.css';
</script>

<!-- ✅ ADDED: svelte:head to inject styles into the document head -->
<svelte:head>
	<!-- Import a theme for highlight.js from a CDN for code block styling -->
	<link
		rel="stylesheet"
		href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css"
	/>
</svelte:head>

<!-- 
  This special <slot /> component renders the content of the current page.
  The styling defined in app.css will automatically apply to everything
  rendered inside this slot.
-->
<slot />