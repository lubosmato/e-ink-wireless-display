import { readFileSync } from "fs"
import { builder } from "../builder"
import { Calendar, CalendarObject } from "./calendar"
import { Exchange, ExchangeObject } from "./currency"
import { Weather, WeatherObject } from "./weather"

type Display = {
  id: string
  calendar: Calendar
  weather: Weather
  exchange: Exchange
}

/*
Currency API:
curl -s -XGET 'https://api.exchangerate.host/timeseries?start_date=2020-01-01&end_date=2020-01-04'
*/

export const DisplayObject = builder.objectRef<Display>("Display").implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    calendar: t.expose("calendar", { type: CalendarObject }),
    weather: t.expose("weather", { type: WeatherObject }),
    exchange: t.expose("exchange", { type: ExchangeObject }),
    image: t.string({
      resolve: () =>
        readFileSync("./storage/image.jpg", { encoding: "base64" }),
    }),
  }),
})

builder.queryFields((t) => ({
  display: t.field({
    type: DisplayObject,
    async resolve() {
      // TODO load stuff from prisma
      return {
        id: "display-id",
        calendar: {
          id: "calendar-id",
        },
        weather: {
          id: "weather-id",
        },
        exchange: {
          id: "exchange-id",
        },
      }
    },
  }),
}))
