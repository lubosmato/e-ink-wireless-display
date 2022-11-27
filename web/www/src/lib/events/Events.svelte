<script lang="ts">
  import { isPast, isToday, isWithinInterval } from "date-fns"
  import type { DisplayQuery } from "../../generated/graphql"
  import Event from "./Event.svelte"
  import More from "./More.svelte"

  export let events: DisplayQuery["display"]["calendar"]["week"]

  const isInPast = (
    event: DisplayQuery["display"]["calendar"]["week"][number],
  ): boolean => {
    return event.end ? isPast(new Date(event.end)) : false
  }

  const isTodaysEvent = (
    event: DisplayQuery["display"]["calendar"]["week"][number],
  ): boolean => {
    const start = new Date(event.start ?? 0)
    const end = new Date(event.end ?? 0)
    return isWithinInterval(new Date(), { start, end }) || isToday(start)
  }

  const futureEvents = events.filter((e) => !isInPast(e))
  const todayEvents = futureEvents.filter((e) => isTodaysEvent(e))
  const todayEventsToShow = todayEvents.slice(0, 4)
  const moreTodayEvents = todayEvents.length - todayEventsToShow.length

  const weekEvents = futureEvents.filter((e) => !isTodaysEvent(e))
  const weekEventsToShow = weekEvents.slice(0, 4)
  const moreWeekEvents = weekEvents.length - weekEventsToShow.length
</script>

<div class="events">
  <div>
    <h5>Dnes</h5>
    {#each todayEventsToShow as event}
      <Event {event} />
    {:else}
      <div class="note">Žádné události</div>
    {/each}
    <More moreEvents={moreTodayEvents} />
  </div>

  <div class="upcoming">
    <h5>Další dny</h5>
    {#each weekEventsToShow as event}
      <Event brief {event} />
    {:else}
      <div class="note">Žádné události</div>
    {/each}
    <More moreEvents={moreWeekEvents} />
  </div>
</div>

<style lang="sass">
.events
  width: 100%
  & > *
    display: flex
    flex-direction: column
.upcoming
  margin-top: 1rem
</style>
