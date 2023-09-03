import {
  addDays,
  differenceInSeconds,
  format,
  hoursToSeconds,
  isPast,
  isThisHour,
} from "date-fns"
import { builder } from "../builder"
import { cached } from "../cached"

type OpenMeteoError = {
  error: true
  reason: string
}
type OpenMeteoData = {
  error: undefined

  latitude: number
  longitude: number
  elevation: number
  generationtime_ms: number
  utc_offset_seconds: number
  timezone: string // eg. Europe/Berlin
  timezone_abbreviation: string // eg. CEST
  hourly: {
    time: string[] // eg. ["2022-07-01T00:00", ...]
    temperature_2m: number[]
    precipitation: number[]
    rain: number[]
    showers: number[]
    snowfall: number[]
    weathercode: WeatherCode[]
  }
  hourly_units: {
    time: string // eg. iso8601
    temperature_2m: string // eg. "°C"
    precipitation: string // eg. "mm"
    rain: string // eg. "mm"
    showers: string // eg. "mm"
    snowfall: string // eg. "cm"
    weathercode: string // eg. "wmo code"
  }
  current_weather: {
    time: string // eg. 2022-07-01T80:00
    temperature: number
    weathercode: WeatherCode
    windspeed: number // eg. km/h (see units)
    winddirection: number // °
  }
  daily: {
    time: string[] // eg. ["2022-11-26"]
    weathercode: WeatherCode[] // eg. [80]
    sunrise: string[] // eg. ["2022-11-26T07:18"]
    sunset: string[] // eg. ["2022-11-26T16:03"]
  }
  daily_units: {
    time: string // eg. "iso8601"
    weathercode: string // eg. "wmo code"
    sunrise: string // eg. "iso8601"
    sunset: string // eg. "iso8601"
  }
}
type OpenMeteoResponse = OpenMeteoData | OpenMeteoError

export type WeatherData = {
  sunsetAt: string
  sunriseAt: string
  code: WeatherCode
  presentPrecipitation: number
  hourly: WeatherHourly[]
}

export type WeatherHourly = {
  time: string
  temperature: number
  precipiation: number
  rain: number
  showers: number
  snowfall: number
  weatherCode: WeatherCode
}

enum WeatherCode {
  CLEAR_SKY = 0,
  MAINLY_CLEAR = 1,
  PARTLY_CLOUDY = 2,
  OVERCAST = 3,
  FOG = 45,
  DEPOSITING_RIME_FOG = 48,
  DRIZZLE_LIGHT = 51,
  DRIZZLE_MODERATE = 53,
  DRIZZLE_DENSE = 55,
  FREEZING_DRIZZLE_LIGHT = 56,
  FREEZING_DRIZZLE_DENSE = 57,
  RAIN_SLIGHT = 61,
  RAIN_MODERATE = 63,
  RAIN_HEAVY = 65,
  FREEZING_RAIN_LIGHT = 66,
  FREEZING_RAIN_HEAVY = 67,
  SNOW_FALL_SLIGHT = 71,
  SNOW_FALL_MODERATE = 73,
  SNOW_FALL_HEAVY = 75,
  SNOW_GRAINS = 77,
  RAIN_SHOWERS_SLIGHT = 80,
  RAIN_SHOWERS_MODERATE = 81,
  RAIN_SHOWERS_VIOLENT = 82,
  SNOW_SHOWERS_SLIGHT = 85,
  SNOW_SHOWERS_HEAVY = 86,
  THUNDERSTORM_SLIGHT_OR_MODERATE = 95,
  THUNDERSTORM_SLIGHT_HAIL = 96,
  THUNDERSTORM_HEAVY_HAIL = 99,
}

const WeatherCodeDescriptions: {
  [K in keyof typeof WeatherCode]: {
    value: (typeof WeatherCode)[K]
    description: string
  }
} = {
  CLEAR_SKY: { value: WeatherCode.CLEAR_SKY, description: "Clear sky" },
  MAINLY_CLEAR: {
    value: WeatherCode.MAINLY_CLEAR,
    description: "Mainly clear",
  },
  PARTLY_CLOUDY: {
    value: WeatherCode.PARTLY_CLOUDY,
    description: "Partly cloudy",
  },
  OVERCAST: { value: WeatherCode.OVERCAST, description: "Overcast" },
  FOG: { value: WeatherCode.FOG, description: "Fog" },
  DEPOSITING_RIME_FOG: {
    value: WeatherCode.DEPOSITING_RIME_FOG,
    description: "Depositing rime fog",
  },
  DRIZZLE_LIGHT: {
    value: WeatherCode.DRIZZLE_LIGHT,
    description: "Drizzle: Light",
  },
  DRIZZLE_MODERATE: {
    value: WeatherCode.DRIZZLE_MODERATE,
    description: "Drizzle: Moderate",
  },
  DRIZZLE_DENSE: {
    value: WeatherCode.DRIZZLE_DENSE,
    description: "Drizzle: Dense",
  },
  FREEZING_DRIZZLE_LIGHT: {
    value: WeatherCode.FREEZING_DRIZZLE_LIGHT,
    description: "Freezing Drizzle: Light",
  },
  FREEZING_DRIZZLE_DENSE: {
    value: WeatherCode.FREEZING_DRIZZLE_DENSE,
    description: "Freezing Drizzle: Dense",
  },
  RAIN_SLIGHT: { value: WeatherCode.RAIN_SLIGHT, description: "Rain: Slight" },
  RAIN_MODERATE: {
    value: WeatherCode.RAIN_MODERATE,
    description: "Rain: Moderate",
  },
  RAIN_HEAVY: { value: WeatherCode.RAIN_HEAVY, description: "Rain: Heavy" },
  FREEZING_RAIN_LIGHT: {
    value: WeatherCode.FREEZING_RAIN_LIGHT,
    description: "Freezing Rain: Light",
  },
  FREEZING_RAIN_HEAVY: {
    value: WeatherCode.FREEZING_RAIN_HEAVY,
    description: "Freezing Rain: Heavy",
  },
  SNOW_FALL_SLIGHT: {
    value: WeatherCode.SNOW_FALL_SLIGHT,
    description: "Snow fall: Slight",
  },
  SNOW_FALL_MODERATE: {
    value: WeatherCode.SNOW_FALL_MODERATE,
    description: "Snow fall: Moderate",
  },
  SNOW_FALL_HEAVY: {
    value: WeatherCode.SNOW_FALL_HEAVY,
    description: "Snow fall: Heavy",
  },
  SNOW_GRAINS: { value: WeatherCode.SNOW_GRAINS, description: "Snow grains" },
  RAIN_SHOWERS_SLIGHT: {
    value: WeatherCode.RAIN_SHOWERS_SLIGHT,
    description: "Rain showers: Slight",
  },
  RAIN_SHOWERS_MODERATE: {
    value: WeatherCode.RAIN_SHOWERS_MODERATE,
    description: "Rain showers: Moderate",
  },
  RAIN_SHOWERS_VIOLENT: {
    value: WeatherCode.RAIN_SHOWERS_VIOLENT,
    description: "Rain showers: Violent",
  },
  SNOW_SHOWERS_SLIGHT: {
    value: WeatherCode.SNOW_SHOWERS_SLIGHT,
    description: "Snow showers: Slight",
  },
  SNOW_SHOWERS_HEAVY: {
    value: WeatherCode.SNOW_SHOWERS_HEAVY,
    description: "Snow showers: Heavy",
  },
  THUNDERSTORM_SLIGHT_OR_MODERATE: {
    value: WeatherCode.THUNDERSTORM_SLIGHT_OR_MODERATE,
    description: "Thunderstorm: Slight or moderate",
  },
  THUNDERSTORM_SLIGHT_HAIL: {
    value: WeatherCode.THUNDERSTORM_SLIGHT_HAIL,
    description: "Thunderstorm: Slight hail",
  },
  THUNDERSTORM_HEAVY_HAIL: {
    value: WeatherCode.THUNDERSTORM_HEAVY_HAIL,
    description: "Thunderstorm: Heavy hail",
  },
} as const

const getWeatherData = async () => {
  const now = new Date()

  const startDate = format(now, "yyyy-MM-dd")
  const endDate = format(addDays(now, 1), "yyyy-MM-dd")
  const timezone = "Europe/Prague"
  const dailyVars = "weathercode,sunrise,sunset"
  const hourlyVars =
    "temperature_2m,precipitation,rain,showers,snowfall,weathercode"
  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=49.20&longitude=16.61&hourly=${hourlyVars}&daily=${dailyVars}&current_weather=true&timezone=${timezone}&start_date=${startDate}&end_date=${endDate}`

  const req = await fetch(endpoint)
  const weather = (await req.json()) as OpenMeteoResponse
  if (weather.error) {
    throw new Error(`Could not get weather data: ${weather.reason}`)
  }

  return weather
}

const WeatherCodeEnum = builder.enumType("WeatherCode", {
  values: WeatherCodeDescriptions,
})

type HourlySample = {
  [K in keyof OpenMeteoData["hourly"]]: OpenMeteoData["hourly"][K][0]
}

const WeatherSample = builder
  .objectRef<HourlySample>("WeatherSample")
  .implement({
    fields: (t) => ({
      time: t.field({
        type: "Date",
        resolve: (parent) => new Date(parent.time),
      }),
      temperature: t.exposeFloat("temperature_2m"),
      precipitation: t.exposeFloat("precipitation"),
      rain: t.exposeFloat("rain"),
      showers: t.exposeFloat("showers"),
      snowfall: t.exposeFloat("snowfall"),
      weatherCode: t.expose("weathercode", { type: WeatherCodeEnum }),
    }),
  })

const approximate = (a: number, b: number, t: number) => {
  const delta = b - a
  return a + Math.min(Math.max(t, 0), 1) * delta
}

const approximateFromHourlySeries = (times: string[], values: number[]) => {
  const index = times.findIndex((t) => isThisHour(new Date(t)))
  const time = times[index]
  const currentValue = values[index]
  const nextHourValue = values[index + 1] ?? currentValue
  const t = differenceInSeconds(new Date(), new Date(time)) / hoursToSeconds(1)

  return approximate(currentValue, nextHourValue, t)
}

const WeatherDataObject = builder
  .objectRef<OpenMeteoData>("WeatherData")
  .implement({
    fields: (t) => ({
      sunsetAt: t.field({
        type: "Date",
        resolve: (parent) => new Date(parent.daily.sunset[0]),
      }),
      sunriseAt: t.field({
        type: "Date",
        resolve: (parent) => {
          const todaySunset = new Date(parent.daily.sunset[0])
          if (isPast(todaySunset)) {
            const tomorrowSunrise = new Date(parent.daily.sunrise[1])
            return tomorrowSunrise
          }
          const todaySunrise = new Date(parent.daily.sunrise[0])
          return todaySunrise
        },
      }),
      code: t.field({
        type: WeatherCodeEnum,
        resolve: (parent) => parent.current_weather.weathercode,
      }),
      temperature: t.float({
        resolve: (parent) =>
          approximateFromHourlySeries(
            parent.hourly.time,
            parent.hourly.temperature_2m,
          ),
      }),
      presentPrecipitation: t.float({
        resolve: (parent) => {
          return approximateFromHourlySeries(
            parent.hourly.time,
            parent.hourly.precipitation,
          )
        },
      }),
      hourly: t.field({
        type: [WeatherSample],
        resolve: (parent) => {
          return parent.hourly.time.map((_, i) => ({
            precipitation: parent.hourly.precipitation[i],
            rain: parent.hourly.rain[i],
            showers: parent.hourly.showers[i],
            snowfall: parent.hourly.snowfall[i],
            temperature_2m: parent.hourly.temperature_2m[i],
            time: parent.hourly.time[i],
            weathercode: parent.hourly.weathercode[i],
          }))
        },
      }),
    }),
  })

export type Weather = {
  id: string
  // TODO add other fields or take them from prisma (in future)
}

const cachedGetWeatherData = cached(getWeatherData, 5 * 60 * 1_000) // 5 minutes

export const WeatherObject = builder.objectRef<Weather>("Weather").implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    prediction: t.field({
      nullable: true,
      type: WeatherDataObject,
      resolve: async () => {
        // return JSON.parse(
        //   `{"latitude":49.2,"longitude":16.619999,"generationtime_ms":1.0269880294799805,"utc_offset_seconds":3600,"timezone":"Europe/Prague","timezone_abbreviation":"CET","elevation":217.0,"current_weather":{"temperature":4.2,"windspeed":3.7,"winddirection":61.0,"weathercode":0,"time":"2022-11-27T17:00"},"hourly_units":{"time":"iso8601","temperature_2m":"°C","precipitation":"mm","rain":"mm","showers":"mm","snowfall":"cm","weathercode":"wmo code"},"hourly":{"time":["2022-11-27T00:00","2022-11-27T01:00","2022-11-27T02:00","2022-11-27T03:00","2022-11-27T04:00","2022-11-27T05:00","2022-11-27T06:00","2022-11-27T07:00","2022-11-27T08:00","2022-11-27T09:00","2022-11-27T10:00","2022-11-27T11:00","2022-11-27T12:00","2022-11-27T13:00","2022-11-27T14:00","2022-11-27T15:00","2022-11-27T16:00","2022-11-27T17:00","2022-11-27T18:00","2022-11-27T19:00","2022-11-27T20:00","2022-11-27T21:00","2022-11-27T22:00","2022-11-27T23:00","2022-11-28T00:00","2022-11-28T01:00","2022-11-28T02:00","2022-11-28T03:00","2022-11-28T04:00","2022-11-28T05:00","2022-11-28T06:00","2022-11-28T07:00","2022-11-28T08:00","2022-11-28T09:00","2022-11-28T10:00","2022-11-28T11:00","2022-11-28T12:00","2022-11-28T13:00","2022-11-28T14:00","2022-11-28T15:00","2022-11-28T16:00","2022-11-28T17:00","2022-11-28T18:00","2022-11-28T19:00","2022-11-28T20:00","2022-11-28T21:00","2022-11-28T22:00","2022-11-28T23:00"],"temperature_2m":[3.3,2.7,1.9,1.0,1.3,1.2,0.2,0.5,0.9,1.7,4.1,5.4,6.5,7.1,7.3,6.9,5.8,4.2,1.7,0.7,-0.2,-0.2,0.7,1.5,1.3,1.7,2.1,2.2,2.3,2.8,3.1,3.2,3.2,3.5,4.2,4.5,4.7,4.8,4.4,4.0,4.0,3.8,3.4,3.3,3.2,3.1,2.9,2.8],"precipitation":[0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00],"rain":[0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00],"showers":[0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00],"snowfall":[0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00],"weathercode":[2,2,45,45,45,45,45,45,45,45,2,0,1,2,1,0,0,0,0,45,45,45,2,2,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3]},"daily_units":{"time":"iso8601","weathercode":"wmo code","sunrise":"iso8601","sunset":"iso8601"},"daily":{"time":["2022-11-27","2022-11-28"],"weathercode":[45,3],"sunrise":["2022-11-27T07:19","2022-11-28T07:21"],"sunset":["2022-11-27T16:02","2022-11-28T16:02"]}}`,
        // )
        try {
          return await cachedGetWeatherData()
        } catch (e) {
          console.error(`Could not query weather data: ${e}`)
          return null
        }
      },
    }),
  }),
})
