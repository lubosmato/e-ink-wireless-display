<script lang="ts">
  import { page } from "$app/stores"
</script>

<header>
  <nav>
    <ul>
      <li class:active={$page.url.pathname === "/"}>
        <a data-sveltekit-prefetch href="/">Settings</a>
      </li>
      <li class:active={$page.url.pathname === "/display"}>
        <a data-sveltekit-prefetch href="/display">Live Display</a>
      </li>
    </ul>
  </nav>
</header>

<style>
</style>
