<script lang="ts">
  export let moreEvents: number
</script>

{#if moreEvents !== 0}
  <div class="note">
    a {moreEvents} další {moreEvents === 1
      ? "událost"
      : moreEvents < 5
      ? "události"
      : "událostí"}...
  </div>
{/if}
