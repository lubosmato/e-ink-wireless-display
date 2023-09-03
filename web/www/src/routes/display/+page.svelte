<script lang="ts">
  import Events from "$lib/events/Events.svelte"
  import Clock from "$lib/Clock.svelte"
  import Weather from "$lib/Weather.svelte"
  import type { PageData } from "./$types"
  import Exchange from "$lib/Exchange.svelte"

  export let data: PageData
</script>

<svelte:head>
  <title>E-Ink display view</title>
</svelte:head>

<section>
  <div class="display-view">
    <div class="clock">
      <Clock nameDay={data.displayQuery.data.display.nameDay} />
    </div>
    <div class="weather">
      <Weather weather={data.displayQuery.data.display.weather} />
    </div>
    <div class="currency">
      <Exchange exchange={data.displayQuery.data.display.exchange} />
    </div>
    <div class="calendar">
      <Events events={data.displayQuery.data.display.calendar.week} />
    </div>
    <div class="image">
      <img
        src="data:image/jpg;base64, {data.displayQuery.data.display.image}"
        alt="Wallpaper"
      />
    </div>
  </div>
</section>

<style lang="sass">
  section
    height: 100%
    display: flex
    justify-content: center
    align-items: center

    .display-view
      width: 1200px
      height: 825px
      padding: 1rem

      display: grid
      grid-template-columns: 1fr 1fr 1fr
      grid-template-rows: 0.4fr 1fr 1fr
      gap: 1rem
      grid-template-areas: "clock weather currency" "image image calendar" "image image calendar"

  .clock
    grid-area: clock
    @include bordered

  .weather
    grid-area: weather
    @include bordered

  .currency
    grid-area: currency
    @include bordered

  .calendar
    grid-area: calendar

  .image
    grid-area: image
    @include bordered

    > img
      height: 100%
      width: 100%
      object-fit: cover
      @include bordered
</style>
