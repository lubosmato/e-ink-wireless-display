<script lang="ts">
  import type { Weather, WeatherCode } from "src/generated/graphql"
  import Icon from "mdi-svelte"
  import _ from "lodash"
  import {
    mdiWeatherCloudy,
    // mdiWeatherCloudyAlert,
    // mdiWeatherCloudyArrowRight,
    // mdiWeatherCloudyClock,
    mdiWeatherFog,
    mdiWeatherHail,
    // mdiWeatherHazy,
    // mdiWeatherHurricane,
    // mdiWeatherLightning,
    // mdiWeatherLightningRainy,
    // mdiWeatherNight,
    // mdiWeatherNightPartlyCloudy,
    mdiWeatherPartlyCloudy,
    // mdiWeatherPartlyLightning,
    // mdiWeatherPartlyRainy,
    // mdiWeatherPartlySnowy,
    // mdiWeatherPartlySnowyRainy,
    mdiWeatherPouring,
    mdiWeatherRainy,
    mdiWeatherSnowy,
    mdiWeatherSnowyHeavy,
    mdiWeatherSnowyRainy,
    mdiWeatherSunny,
    // mdiWeatherSunnyAlert,
    // mdiWeatherSunnyOff,
    // mdiWeatherSunset,
    mdiWeatherSunsetDown,
    mdiWeatherSunsetUp,
    // mdiWeatherTornado,
    // mdiWeatherWindy,
    // mdiWeatherWindyVariant,
    // mdiSnowflake,
    mdiWaterOutline,
    mdiWaterAlertOutline,
    mdiApiOff,
  } from "@mdi/js"
  import { addHours, format, isPast, startOfHour } from "date-fns"

  const icons: {
    [k in WeatherCode]: string
  } = {
    CLEAR_SKY: mdiWeatherSunny,
    DEPOSITING_RIME_FOG: mdiWeatherFog,
    DRIZZLE_DENSE: mdiWeatherPouring,
    DRIZZLE_LIGHT: mdiWeatherRainy,
    DRIZZLE_MODERATE: mdiWeatherRainy,
    FOG: mdiWeatherFog,
    FREEZING_DRIZZLE_DENSE: mdiWeatherSnowy,
    FREEZING_DRIZZLE_LIGHT: mdiWeatherSnowy,
    FREEZING_RAIN_HEAVY: mdiWeatherSnowyRainy,
    FREEZING_RAIN_LIGHT: mdiWeatherSnowyRainy,
    MAINLY_CLEAR: mdiWeatherSunny,
    OVERCAST: mdiWeatherCloudy,
    PARTLY_CLOUDY: mdiWeatherPartlyCloudy,
    RAIN_HEAVY: mdiWeatherPouring,
    RAIN_MODERATE: mdiWeatherRainy,
    RAIN_SHOWERS_MODERATE: mdiWeatherRainy,
    RAIN_SHOWERS_SLIGHT: mdiWeatherRainy,
    RAIN_SHOWERS_VIOLENT: mdiWeatherPouring,
    RAIN_SLIGHT: mdiWeatherRainy,
    SNOW_FALL_HEAVY: mdiWeatherSnowyHeavy,
    SNOW_FALL_MODERATE: mdiWeatherSnowyHeavy,
    SNOW_FALL_SLIGHT: mdiWeatherSnowy,
    SNOW_GRAINS: mdiWeatherHail,
    SNOW_SHOWERS_HEAVY: mdiWeatherSnowyHeavy,
    SNOW_SHOWERS_SLIGHT: mdiWeatherSnowy,
    THUNDERSTORM_HEAVY_HAIL: mdiWeatherHail,
    THUNDERSTORM_SLIGHT_HAIL: mdiWeatherHail,
    THUNDERSTORM_SLIGHT_OR_MODERATE: mdiWeatherHail,
  }

  export let weather: Weather

  const sunriseAt = new Date(weather.prediction?.sunriseAt ?? 0)
  const sunsetAt = new Date(weather.prediction?.sunsetAt ?? 0)

  const sunShould: "rise" | "set" = isPast(sunriseAt)
    ? isPast(sunsetAt)
      ? "rise"
      : "set"
    : "rise"

  const inFutureHours = 4
  const inFutureTime = startOfHour(addHours(new Date(), inFutureHours))

  const future = weather.prediction?.hourly.find(
    (s) => s.time === inFutureTime.toISOString(),
  )
</script>

<div class="weather">
  {#if !weather.prediction}
    <div class="error">
      <Icon path={mdiApiOff} />
    </div>
  {:else}
    <div class="icon">
      <Icon size="4" path={icons[weather.prediction.code]} color="black" />
    </div>
    <div class="temp">
      {_.floor(weather.prediction.temperature, 0)}
      <span class="celsius">°C</span>
    </div>
    <div class="precipitation">
      {_.floor(weather.prediction.presentPrecipitation, 0)} mm
      <Icon
        path={weather.prediction.presentPrecipitation > 0
          ? mdiWaterAlertOutline
          : mdiWaterOutline}
      />
    </div>
    <div class="sun">
      <Icon
        size="2.5"
        path={sunShould === "set" ? mdiWeatherSunsetDown : mdiWeatherSunsetUp}
      />
    </div>
    <div class="sun-time">
      {format(sunShould === "set" ? sunsetAt : sunriseAt, "H:mm")}
    </div>

    {#if future}
      <div class="future-time">{format(inFutureTime, "HH:mm")}</div>
      <div class="future-temp">
        <Icon size="1" path={icons[future.weatherCode]} color="black" />
        <span>{future.temperature}</span><span class="celsius">°C</span>
      </div>
      <div class="future-prec">
        {_.floor(future.precipitation, 0)} mm
        <Icon path={mdiWaterOutline} />
      </div>
    {/if}
  {/if}
</div>

<style lang="sass">
  .weather 
    width: 100%
    height: 100%

    display: grid
    grid-template-columns: auto 0.75fr auto
    grid-template-rows: 1fr 0.5fr 0.5fr
    gap: 0
    grid-auto-flow: row
    grid-template-areas: "icon temp sun" "icon precipitation sun-time" "future-time future-temp future-prec"
    > * 
      display: flex
      align-items: center
      justify-content: center

  .error
    grid-area: temp

  .icon
    grid-area: icon

  .temp
    grid-area: temp
    font-size: 3.5rem
    line-height: 1em
    font-weight: bold

    & > .celsius
      font-size: 1.5rem
      margin-top: -1.5rem
      margin-left: 0.25em

  .precipitation
    grid-area: precipitation
    font-size: 1.5rem

  .sun
    grid-area: sun

  .sun-time
    grid-area: sun-time
    font-size: 1.5rem

  .future-time
    grid-area: future-time
    border-top: 1px solid var(--color-grey)
    font-size: 1.5rem
    color: var(--color-light-text)

  .future-temp
    grid-area: future-temp
    border-top: 1px solid var(--color-grey)
    font-size: 1.5rem
    display: flex
    gap: 0.5rem
    
    .celsius
      font-size: 0.75rem
      margin-top: -0.5rem

  .future-prec
    grid-area: future-prec
    border-top: 1px solid var(--color-grey)
    font-size: 1.5rem
    display: flex
    align-items: center
    justify-content: center

</style>
