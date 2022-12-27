import { format, parse, subDays } from "date-fns"
import { builder } from "../builder"

export type Exchange = {
  id: string
}

const exchSymbols = ["CZK"] as const

export type ExchaneData = {
  days: Date[]
} & {
  [k in typeof exchSymbols[number]]: number[]
}

const ExchangeDataObject = builder
  .objectRef<ExchaneData>("ExchangeData")
  .implement({
    fields: (t) => ({
      days: t.expose("days", { type: ["Date"] }),
      CZK: t.exposeFloatList("CZK"),
    }),
  })

export const ExchangeObject = builder
  .objectRef<Exchange>("Exchange")
  .implement({
    fields: (t) => ({
      id: t.exposeString("id"),
      rates: t.field({
        async resolve(parent) {
          const baseUrl = "https://api.exchangerate.host/timeseries"
          const start = format(subDays(new Date(), 30), "yyyy-MM-dd")
          const end = format(new Date(), "yyyy-MM-dd")

          const query = await fetch(
            `${baseUrl}?start_date=${start}&end_date=${end}&symbols=${exchSymbols.join(
              ",",
            )}&base=CHF`,
          )

          type ExchangeRateResult = {
            success: boolean
            timeseries: true
            base: string
            start_date: string
            end_date: string
            rates: {
              [day: string]: {
                [k in typeof exchSymbols[number]]: number
              }
            }
          }

          const result = (await query.json()) as ExchangeRateResult | null
          if (result === null) throw new Error("unknown exchange rate")

          return {
            CZK: Object.values(result.rates).map((r) => r.CZK),
            days: Object.keys(result.rates).map((day) =>
              parse(day, "yyyy-MM-dd", new Date()),
            ),
          }
        },
        type: ExchangeDataObject,
      }),
    }),
  })
