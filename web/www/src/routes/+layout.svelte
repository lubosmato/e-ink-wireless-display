<script lang="ts">
  import "../styles/app.sass"
</script>

<slot name="head" />

<main>
  <slot />
</main>

<style lang="sass">
main
  height: 100%
</style>
