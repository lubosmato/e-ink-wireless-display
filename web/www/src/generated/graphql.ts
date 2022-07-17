import client from "../apolloClient"
import type {
  ApolloQueryResult,
  ObservableQuery,
  WatchQueryOptions,
  QueryOptions,
} from "@apollo/client"
import { readable } from "svelte/store"
import type { Readable } from "svelte/store"
import gql from "graphql-tag"
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K]
}
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>
}
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>
}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string
  String: string
  Boolean: boolean
  Int: number
  Float: number
}

export type Query = {
  __typename?: "Query"
  hello?: Maybe<Scalars["String"]>
}

export type HelloQueryVariables = Exact<{ [key: string]: never }>

export type HelloQuery = { __typename?: "Query"; hello?: string | null }

export const HelloDoc = gql`
  query Hello {
    hello
  }
`
export const Hello = (
  options: Omit<WatchQueryOptions<HelloQueryVariables>, "query">,
): Readable<
  ApolloQueryResult<HelloQuery> & {
    query: ObservableQuery<HelloQuery, HelloQueryVariables>
  }
> => {
  const q = client.watchQuery({
    query: HelloDoc,
    ...options,
  })
  var result = readable<
    ApolloQueryResult<HelloQuery> & {
      query: ObservableQuery<HelloQuery, HelloQueryVariables>
    }
  >(
    {
      data: {} as any,
      loading: true,
      error: undefined,
      networkStatus: 1,
      query: q,
    },
    (set) => {
      q.subscribe((v: any) => {
        set({ ...v, query: q })
      })
    },
  )
  return result
}

export const AsyncHello = (
  options: Omit<QueryOptions<HelloQueryVariables>, "query">,
) => {
  return client.query<HelloQuery>({ query: HelloDoc, ...options })
}
