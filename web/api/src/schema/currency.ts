import { builder } from "../builder"

export type Exchange = {
  id: string
  from: string
  to: string
}

export const ExchangeObject = builder
  .objectRef<Exchange>("Exchange")
  .implement({
    fields: (t) => ({
      id: t.exposeString("id"),
      from: t.exposeString("from", {
        description: "currency code of currency being converted from. eg. USD",
      }),
      to: t.exposeString("to", {
        description: "currency code of currency being converted to. eg. EUR",
      }),
      rate: t.float({
        async resolve(parent) {
          type ExchangeRateResult = {
            success: boolean
            query: {
              from: string
              to: string
              amount: number
            }
            info: {
              rate: number
            }
            historical: boolean
            date: string // eg. "2022-11-27"
            result: number | null
          }

          const query = await fetch(
            `https://api.exchangerate.host/convert?from=${parent.from}&to=${parent.to}`,
          )
          const result = (await query.json()) as ExchangeRateResult
          if (result.result === null) throw new Error("unknown exchange rate")
          return result.result
        },
      }),
    }),
  })
