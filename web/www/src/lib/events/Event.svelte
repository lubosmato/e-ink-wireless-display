<script lang="ts">
  import {
    differenceInDays,
    format,
    formatDuration,
    intervalToDuration,
  } from "date-fns"
  import cs from "date-fns/locale/cs/index"
  import type { DisplayQuery } from "src/generated/graphql"

  export let brief = false
  export let event: DisplayQuery["display"]["calendar"]["week"][number]

  const startDate = new Date(event.start ?? 0)
  const endDate = new Date(event.end ?? 0)

  const isFullDay =
    event.start &&
    event.end &&
    differenceInDays(new Date(event.end), new Date(event.start)) > 0

  const start = brief
    ? format(startDate, "d. MMM", { locale: cs })
    : format(startDate, "H:mm", { locale: cs })
  const duration = intervalToDuration({ start: startDate, end: endDate })

  const durationText = brief
    ? format(startDate, "EEEE", { locale: cs })
    : duration
    ? formatDuration(duration, {
        locale: cs,
        format: (duration?.hours ?? 0) > 0 ? ["hours"] : ["hours", "minutes"],
      })
    : ""
</script>

<div class="event">
  {#if isFullDay && !brief}
    <div class="day">den</div>
  {:else}
    <div class="day-top">{start}</div>
    <div class="day-bottom">{durationText}</div>
  {/if}
  <div class="summary">{event.summary}</div>
</div>

<style lang="sass">
  .event
    @include bordered
    border-radius: 8px
    padding: 4px 8px
    margin: 4px 0
  
    display: grid
    grid-template-columns: 70px 1fr
    grid-template-rows: 1fr 1fr
    gap: 0 0.5rem
    grid-auto-flow: row

    align-items: center
    max-height: 58px

    & > *
      white-space: nowrap
      overflow: hidden
      text-overflow: ellipsis

  .day-top
    grid-area: 1 / 1 / 2 / 2
    font-size: 1.5rem
    justify-self: center

  .day-bottom
    grid-area: 2 / 1 / 3 / 2
    font-style: italic
    justify-self: center
    max-width: 65px

  .summary
    grid-area: 1 / 2 / 3 / 3
    white-space: normal
    font-weight: bold
    line-height: 1.25rem
    max-height: 2.5rem

  .day
    grid-area: 1 / 1 / 3 / 2
    font-weight: bold
    justify-self: center
</style>
