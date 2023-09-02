import SchemaBuilder from "@pothos/core"
import { GraphQLScalarType } from "graphql"
import { DateTimeResolver } from "graphql-scalars"

export const builder = new SchemaBuilder<{
  Scalars: {
    Date: {
      Input: Date
      Output: Date
    }
    File: { Input: File; Output: File }
  }
}>({})

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
