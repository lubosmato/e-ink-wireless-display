import { browser } from "$app/environment"
import { ApolloClient, InMemoryCache } from "@apollo/client/core/index"
import { createUploadLink } from "apollo-upload-client"

const apiUrl = browser ? import.meta.env.VITE_API_URL : process.env.VITE_API_URL

const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: createUploadLink({
    uri: apiUrl,
  }),
})

export default apolloClient
