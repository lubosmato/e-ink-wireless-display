import { schema } from "./schema"
import { Context, createContext } from "./context"

import { createYoga } from "graphql-yoga"
import { createServer } from "node:http"
import { writeFileSync } from "node:fs"
import { printSchema } from "graphql"

if (process.env.ENV_SHORT === "local") {
  writeFileSync("./src/generated/schema.graphql", printSchema(schema))
}

const yoga = createYoga<Context>({
  cors: {
    credentials: true,
    origin: [process.env.WWW_URL ?? "", "https://studio.apollographql.com"],
  },
  context: createContext,
  schema,
  graphqlEndpoint: "/",
})

export const server = createServer(yoga)
