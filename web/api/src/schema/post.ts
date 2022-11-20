import { builder } from "../builder"
import { prisma } from "../prisma"

builder.prismaObject("Post", {
  fields: (t) => ({
    id: t.exposeID("id"),
    content: t.exposeString("content"),
    user: t.relation("user"),
  }),
})

builder.prismaObject("User", {
  fields: (t) => ({
    id: t.exposeID("id"),
    title: t.exposeString("displayName"),
  }),
})

builder.queryField("posts", (t) =>
  t.prismaField({
    type: ["Post"],
    resolve() {
      return prisma.post.findMany()
    },
  }),
)
