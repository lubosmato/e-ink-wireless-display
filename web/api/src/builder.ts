import SchemaBuilder from "@pothos/core"
import PrismaPlugin from "@pothos/plugin-prisma"
import { DateTimeResolver } from "graphql-scalars"
import type PrismaTypes from "./generated/prisma-pothos"
import { prisma } from "./prisma"

export const builder = new SchemaBuilder<{
  Scalars: {
    Date: {
      Input: Date
      Output: Date
    }
  }
  PrismaTypes: PrismaTypes
}>({
  plugins: [PrismaPlugin],
  prisma: {
    client: prisma,
    exposeDescriptions: true,
    filterConnectionTotalCount: true,
  },
})

builder.addScalarType("Date", DateTimeResolver, {})
