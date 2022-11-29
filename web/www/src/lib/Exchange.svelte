<script lang="ts">
  import { mdiArrowRight } from "@mdi/js"
  import Icon from "mdi-svelte"
  import type { Exchange } from "src/generated/graphql"
  import _ from "lodash"

  export let exchange: Exchange
</script>

<div class="exchange">
  <div class="rate">
    1 <div class="currency">{exchange.from}</div>
    <div class="arrow">
      <Icon path={mdiArrowRight} />
    </div>
    <div class="value">{_.floor(exchange.rate, 3)}</div>
    <div class="currency">{exchange.to}</div>
  </div>
</div>

<style lang="sass">
  .exchange 
    width: 100%
    height: 100%
    display: flex
    flex-direction: row
    align-items: center
    justify-content: center

    .rate 
      font-size: 3rem
      display: flex
      flex-direction: row
      align-items: center
      gap: 0.25rem

  .value 
    font-weight: bold

  .arrow 
    margin: 0 0.25rem

  .currency 
    font-size: 0.55em
    align-self: flex-end

</style>
