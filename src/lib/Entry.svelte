<script lang="ts">
  import { buf2hex, getIndex, LogEntry } from "$lib/ctlog";
  import { getContext } from "svelte";

  const logUrl: string = getContext("log_url");

  export let index = 0;
  let entry: LogEntry;

  async function refreshLeaf(i: number) {
    entry = await getIndex(logUrl, i);
  }

  $: refreshLeaf(index);
</script>

{#if entry !== undefined}
  <div class="border border-black max-w-full">
    <pre class="p-2 whitespace-pre-wrap overflow-auto">
Timestamp:   {entry.Timestamp}
UTC time:    {new Date(entry.Timestamp).toISOString()}
Local time:  {new Date(entry.Timestamp).toLocaleString()}
Fingerprint: {buf2hex(entry.Hash)}

{entry.Data}
    </pre>
  </div>
{:else}
  <p>Loading...</p>
{/if}
