<script lang="ts">
  import type { Weather, WeatherCode } from "src/generated/graphql"
  import Icon from "mdi-svelte"
  import _ from "lodash"
  import {
    mdiWeatherCloudy,
    mdiWeatherCloudyAlert,
    mdiWeatherCloudyArrowRight,
    mdiWeatherCloudyClock,
    mdiWeatherFog,
    mdiWeatherHail,
    mdiWeatherHazy,
    mdiWeatherHurricane,
    mdiWeatherLightning,
    mdiWeatherLightningRainy,
    mdiWeatherNight,
    mdiWeatherNightPartlyCloudy,
    mdiWeatherPartlyCloudy,
    mdiWeatherPartlyLightning,
    mdiWeatherPartlyRainy,
    mdiWeatherPartlySnowy,
    mdiWeatherPartlySnowyRainy,
    mdiWeatherPouring,
    mdiWeatherRainy,
    mdiWeatherSnowy,
    mdiWeatherSnowyHeavy,
    mdiWeatherSnowyRainy,
    mdiWeatherSunny,
    mdiWeatherSunnyAlert,
    mdiWeatherSunnyOff,
    mdiWeatherSunset,
    mdiWeatherSunsetDown,
    mdiWeatherSunsetUp,
    mdiWeatherTornado,
    mdiWeatherWindy,
    mdiWeatherWindyVariant,
    mdiSnowflake,
    mdiWaterOutline,
    mdiWaterAlertOutline,
  } from "@mdi/js"
  import { format, isPast } from "date-fns"

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

  const sunriseAt = new Date(weather.prediction.sunriseAt)
  const sunsetAt = new Date(weather.prediction.sunsetAt)

  const sunShould: "rise" | "set" = isPast(sunriseAt)
    ? isPast(sunsetAt)
      ? "rise"
      : "set"
    : "rise"
</script>

<div class="weather">
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
</div>

<style lang="sass">
  .weather 
    width: 100%
    height: 100%

    display: grid
    grid-template-columns: auto 0.75fr auto
    grid-template-rows: 1fr 0.5fr
    gap: 0
    grid-auto-flow: row
    grid-template-areas: "icon temp sun" "icon precipitation sun-time"
    > * 
      display: flex
      align-items: center
      justify-content: center

  .celsius
    font-size: 1.5rem
    margin-top: -1.5rem
    margin-left: 0.25em

  .icon
    grid-area: icon

  .temp
    grid-area: temp
    font-size: 3.5rem
    line-height: 1em
    font-weight: bold

  .precipitation
    grid-area: precipitation
    font-size: 1.5rem

  .sun
    grid-area: sun

  .sun-time
    grid-area: sun-time
    font-size: 1.5rem
</style>
