<script>
	// Import the global stylesheet. This will apply to every page in your app.
	import '../app.css';
</script>

<!-- 
  This special <slot /> component renders the content of the current page.
  The styling defined in app.css will automatically apply to everything
  rendered inside this slot.
-->
<slot />