import { ApolloServer } from "apollo-server"

import { schema } from "./schema"
import { createContext } from "./context"

const server = new ApolloServer({
  schema,
  context: createContext,
  csrfPrevention: true, // see below for more about this
  cors: {
    credentials: true,
    origin: true,
  },
})

export default server
