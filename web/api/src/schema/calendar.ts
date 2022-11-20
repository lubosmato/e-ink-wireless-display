import { builder } from "../builder"

type Calendar = {
  name: string
}

const CalendarGql = builder.objectRef<Calendar>("Calendar").implement({
  description: "Long necks, cool patterns, taller than you.",
  fields: (t) => ({
    name: t.exposeString("name"),
  }),
})

builder.queryFields((t) => ({
  calendar: t.field({
    type: CalendarGql,
    resolve: () => ({
      name: "Test",
    }),
  }),
}))
