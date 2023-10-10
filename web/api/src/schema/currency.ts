import { format, parse, subDays } from "date-fns"
import { builder } from "../builder"
import { cached } from "../cached"

export type Exchange = {
  id: string
}

const exchSymbols = ["CZK"] as const

export type ExchaneData = {
  days: Date[]
} & {
  [k in typeof exchSymbols[number]]: (number | null)[]
}

const ExchangeDataObject = builder
  .objectRef<ExchaneData>("ExchangeData")
  .implement({
    fields: (t) => ({
      days: t.expose("days", { type: ["Date"] }),
      CZK: t.field({
        type: ["Float"],
        nullable: { list: false, items: true },
        resolve: (p) => p.CZK,
      }),
    }),
  })

const queryApi = async () => {
  const baseUrl = "https://api.apilayer.com/exchangerates_data/timeseries"
  const start = format(subDays(new Date(), 30), "yyyy-MM-dd")
  const end = format(new Date(), "yyyy-MM-dd")

  const headers = new Headers()
  headers.append("apikey", process.env.EXCHANGE_API_KEY ?? "")

  const query = await fetch(
    `${baseUrl}?start_date=${start}&end_date=${end}&symbols=${exchSymbols.join(
      ",",
    )}&base=CHF`,
    {
      method: "GET",
      redirect: "follow",
      headers,
    },
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

  return result
}

const cachedQueryApi = cached(queryApi, 60 * 60 * 1_000) // one hour

export const ExchangeObject = builder
  .objectRef<Exchange>("Exchange")
  .implement({
    fields: (t) => ({
      id: t.exposeString("id"),
      rates: t.field({
        nullable: true,
        async resolve(parent) {
          try {
            const result = await cachedQueryApi()

            return {
              CZK: Object.values(result.rates).map((r) => r.CZK ?? null),
              days: Object.keys(result.rates).map((day) =>
                parse(day, "yyyy-MM-dd", new Date()),
              ),
            }
          } catch (e) {
            console.error(`Error while obtaining currency data: ${e}`)
            return null
          }
        },
        type: ExchangeDataObject,
      }),
    }),
  })
