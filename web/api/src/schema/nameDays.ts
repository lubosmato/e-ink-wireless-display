import { format } from "date-fns"
import { builder } from "../builder"
import { cached } from "../cached"

type NameDayResponse = {
  name: string
}[]

export type NameDay = {
  id: string
}

export type NameDays = {
  today: string
  tomorrow: string
}

const getNameDays = async (): Promise<NameDays> => {
  const now = new Date()

  const today = format(now, "yyyy-MM-dd")
  const endpoint = `https://svatkyapi.cz/api/week/${today}`

  const req = await fetch(endpoint)
  const nameDaysWeek = (await req.json()) as NameDayResponse
  if (!nameDaysWeek || nameDaysWeek.length < 2) throw new Error()

  return {
    today: nameDaysWeek[0].name,
    tomorrow: nameDaysWeek[1].name,
  }
}

const NameDaysObject = builder.objectRef<NameDays>("NameDays").implement({
  fields: (t) => ({
    today: t.expose("today", { type: "String", nullable: false }),
    tomorrow: t.expose("tomorrow", { type: "String", nullable: false }),
  }),
})

const cachedGetNamedDays = cached(getNameDays, 10 * 60 * 1_000) // 10 minutes

export const NameDayObject = builder.objectRef<NameDay>("NameDay").implement({
  fields: (t) => ({
    id: t.exposeString("id"),
    nameDays: t.field({
      nullable: true,
      type: NameDaysObject,
      resolve: async () => {
        try {
          return await cachedGetNamedDays()
        } catch (e) {
          console.error(`Could not query weather data: ${e}`)
          return null
        }
      },
    }),
  }),
})
