<script lang="ts">
  import { format } from "date-fns"
  import cs from "date-fns/locale/cs/index"
  import type { DisplayQuery } from "src/generated/graphql"
  import { readable } from "svelte/store"

  export let nameDay: DisplayQuery["display"]["nameDay"]

  const now = readable(new Date(), (set) => {
    const interval = setInterval(() => set(new Date()), 30_000)
    return () => clearInterval(interval)
  })

  $: time = format($now, "H:mm")
  $: day = format($now, "EEEE", { locale: cs })
  $: date = format($now, "d. MMMM", { locale: cs })
</script>

<div class="clock">
  <div class="time">
    {time}
  </div>
  <div class="day">{day}</div>
  <div class="date">{date}</div>
  <div class="today">
    Dnes má svátek <strong>{nameDay.nameDays?.today}</strong>
  </div>
</div>

<style lang="sass">
  .clock 
    width: 100%
    height: 100%

    display: grid
    grid-template-columns: 1fr 1fr
    grid-template-rows: 1fr 1fr 0.5fr
    grid-auto-flow: row
    grid-template-areas: "time day" "time date" "today today"
    align-items: center

    font-size: 1.5rem

  .time 
    grid-area: time
    font-size: 4rem
    justify-self: center

  .day 
    grid-area: day
    align-self: flex-end

  .date
    grid-area: date
    align-self: flex-start

  .today
    grid-area: today
    font-size: 1.25rem
    justify-self: center
</style>
