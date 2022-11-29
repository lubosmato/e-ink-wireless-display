import SchemaBuilder from "@pothos/core"
import PrismaPlugin from "@pothos/plugin-prisma"
import { GraphQLScalarType } from "graphql"
import { DateTimeResolver } from "graphql-scalars"
import type PrismaTypes from "./generated/prisma-pothos"
import { prisma } from "./prisma"

export const builder = new SchemaBuilder<{
  Scalars: {
    Date: {
      Input: Date
      Output: Date
    }
    File: { Input: File; Output: File }
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

builder.mutationType({})

builder.addScalarType("Date", DateTimeResolver, {})
builder.addScalarType(
  "File",
  new GraphQLScalarType<File, File>({
    name: "File",
    description: "The `File` scalar type represents a file upload.",
    serialize: (a) => a as File,
    parseValue: (a) => a as File,
  }),
  {},
)
