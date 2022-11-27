<script lang="ts">
  import { format } from "date-fns"
  import cs from "date-fns/locale/cs"
  import { readable } from "svelte/store"

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
</div>

<style lang="sass">
  .clock 
    width: 100%
    height: 100%

    display: grid
    grid-template-columns: 1fr 1fr
    grid-template-rows: 1fr 1fr
    grid-auto-flow: row
    grid-template-areas: "time day" "time date"
    align-items: center

    font-size: 1.75rem

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
</style>
