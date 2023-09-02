import { auth, calendar } from "@googleapis/calendar"
import { compareAsc, endOfDay, endOfWeek, startOfDay } from "date-fns"
import { existsSync } from "fs"
import { builder } from "../../builder"
import { CalendarEvent, EventOject, getDate } from "./types"

if (!process.env.CALENDAR_ID) throw new Error("Missing env var CALENDAR_ID")
if (!existsSync("./creds.json"))
  throw new Error("Missing creds.json Google auth credentials file")

const googleAuth = new auth.GoogleAuth({
  keyFile: "./creds.json",
  scopes: [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events.readonly",
  ],
})

const sortByStartDate = (events: CalendarEvent[]): CalendarEvent[] => {
  return [...events].sort((a, b) =>
    compareAsc(
      getDate(a.start) ?? new Date(0),
      getDate(b.start) ?? new Date(0),
    ),
  )
}

export type Calendar = {
  id: string
  // TODO add other fields or take them from prisma (in future)
}

export const CalendarObject = builder
  .objectRef<Calendar>("Calendar")
  .implement({
    fields: (t) => ({
      id: t.exposeString("id"),
      week: t.field({
        type: [EventOject],
        resolve: async () => {
          const client = await googleAuth.getClient()
          const myCalendar = calendar({ auth: client, version: "v3" })
          const events = await myCalendar.events.list({
            timeMin: startOfDay(new Date()).toISOString(),
            timeMax: endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString(),
            calendarId: process.env.CALENDAR_ID,
          })

          // TODO remove 'as unknown' - don't be lazy
          const items = (events.data.items ?? []) as unknown as CalendarEvent[]
          return sortByStartDate(items)
        },
      }),
    }),
  })
