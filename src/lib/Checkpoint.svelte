<script lang="ts">
  import { getContext, onMount } from "svelte";
  import { getCheckpoint, type Checkpoint } from "$lib/ctlog";

  const logUrl: string = getContext("log_url");

  export let finalIndex: number | undefined;
  export function refresh() {
    getCheckpoint(logUrl).then((cp) => {
      checkpoint = cp;
    });
  }

  let checkpoint: Checkpoint | undefined = undefined;

  $: if (checkpoint) {
    finalIndex = checkpoint.entries - 1;
  }

  onMount(async () => {
    checkpoint = await getCheckpoint(logUrl);
  });
</script>

{#if checkpoint}
  <div class="border border-black max-w-full">
    <pre class="p-2 whitespace-pre-wrap overflow-auto">{checkpoint.text}</pre>
  </div>
{:else}
  <p>Loading...</p>
{/if}
