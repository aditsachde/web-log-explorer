<script lang="ts">
  import { setContext } from "svelte";
  import Route from "./Route.svelte";

  let logUrl;

  if (import.meta.env.VITE_LOG_URL) {
    logUrl = import.meta.env.VITE_LOG_URL;
  } else {
    // Get the current full URL in the browser
    const fullPath = window.location.href;
    // Extract the base URL
    logUrl = fullPath.substring(0, fullPath.lastIndexOf("/") + 1);
  }

  setContext("log_url", logUrl);
  console.log("Using logUrl: ", logUrl);
</script>

<div class="flex flex-col items-center justify-start pt-10">
  {#if logUrl}
    <Route />
  {/if}
</div>
