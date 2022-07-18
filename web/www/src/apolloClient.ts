import { ApolloClient, InMemoryCache } from "@apollo/client/core/index"

const apolloClient = new ApolloClient({
  uri: import.meta.env.VITE_API_URL,
  cache: new InMemoryCache(),
})

export default apolloClient
