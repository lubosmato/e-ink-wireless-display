<script lang="ts">
  import {
    mdiApiOff,
    mdiArrowRight,
    mdiTriangleSmallDown,
    mdiTriangleSmallUp,
  } from "@mdi/js"
  import {
    CategoryScale,
    Chart as ChartJS,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
  } from "chart.js"
  import { format } from "date-fns"
  import _ from "lodash"
  import Icon from "mdi-svelte"
  import type { Exchange } from "src/generated/graphql"
  import { Line } from "svelte-chartjs"

  ChartJS.register(
    Title,
    Tooltip,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
  )

  export let exchange: Exchange

  const czk = exchange.rates?.CZK.map((v) => (v === null ? NaN : v)) ?? []
  const currentCzk = czk.filter((v) => !isNaN(v)).at(-1)

  const min = Math.min(...czk.filter((v) => !isNaN(v)))
  const max = Math.max(...czk.filter((v) => !isNaN(v)))

  const options = {
    animation: {
      duration: 0,
    },
    plugins: {
      tooltip: {
        enabled: false,
      },
    },
    maintainAspectRatio: false,
    responsive: true,
    scales: {
      x: {
        display: false,
      },
      y: {
        display: true,
        min,
        max,
      },
    },
  }

  const data = {
    labels:
      exchange.rates?.days.map((day) => format(new Date(day), "dd")) ?? [],
    datasets: [
      {
        label: "My First dataset",
        fill: true,
        lineTension: 0.0,
        borderWidth: 1,
        backgroundColor: "rgb(255, 255, 255)",
        borderColor: "rgb(0, 0, 0)",
        borderCapStyle: "round",
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: "miter",
        pointBorderColor: "rgb(205, 130,1 58)",
        pointBackgroundColor: "rgb(255, 255, 255)",
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "rgb(0, 0, 0)",
        pointHoverBorderColor: "rgba(220, 220, 220,1)",
        pointHoverBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 10,
        data: czk,
      },
    ],
  }
</script>

<div class="exchange">
  {#if exchange?.rates === null}
    <Icon path={mdiApiOff} />
  {:else}
    <div class="rate">
      1 <div class="currency">CHF</div>
      <div class="arrow">
        <Icon path={mdiArrowRight} />
      </div>
      <div class="value">{_.floor(currentCzk, 3)}</div>
      <div class="currency">CZK</div>
      <div class="minmax">
        <div>
          <Icon path={mdiTriangleSmallUp} />
          {_.floor(max, 3)}
        </div>
        <div>
          <Icon path={mdiTriangleSmallDown} />
          {_.floor(min, 3)}
        </div>
      </div>
    </div>
    <div class="history">
      <Line {data} {options} />
    </div>
  {/if}
</div>

<style lang="sass">
  .exchange 
    width: 100%
    height: 100%
    display: flex
    flex-direction: column
    align-items: center
    justify-content: center

    .rate 
      font-size: 2rem
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

  .minmax
    font-size: 1rem
    display: flex
    flex-direction: column
    justify-content: center
    margin-left: 0.25rem
    > div
      display: flex
      white-space: nowrap

  .history
    padding: 0 0.5rem
    max-height: 50px
    width: 100%

</style>
