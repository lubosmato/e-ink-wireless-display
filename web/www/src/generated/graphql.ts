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

/** Long necks, cool patterns, taller than you. */
export type Calendar = {
  __typename?: "Calendar"
  name: Scalars["String"]
}

export type Post = {
  __typename?: "Post"
  content: Scalars["String"]
  id: Scalars["ID"]
  user: User
}

export type Query = {
  __typename?: "Query"
  calendar: Calendar
  hello: Scalars["String"]
  posts: Array<Post>
}

export type QueryHelloArgs = {
  name?: InputMaybe<Scalars["String"]>
}

export type User = {
  __typename?: "User"
  id: Scalars["ID"]
  title: Scalars["String"]
}

export type EventsQueryVariables = Exact<{ [key: string]: never }>

export type EventsQuery = {
  __typename?: "Query"
  calendar: { __typename?: "Calendar"; name: string }
}

export type HelloQueryVariables = Exact<{
  name?: InputMaybe<Scalars["String"]>
}>

export type HelloQuery = { __typename?: "Query"; hello: string }

export const EventsDoc = gql`
  query Events {
    calendar {
      name
    }
  }
`
export const HelloDoc = gql`
  query Hello($name: String) {
    hello(name: $name)
  }
`
export const Events = (
  options: Omit<WatchQueryOptions<EventsQueryVariables>, "query">,
): Readable<
  ApolloQueryResult<EventsQuery> & {
    query: ObservableQuery<EventsQuery, EventsQueryVariables>
  }
> => {
  const q = client.watchQuery({
    query: EventsDoc,
    ...options,
  })
  const result = readable<
    ApolloQueryResult<EventsQuery> & {
      query: ObservableQuery<EventsQuery, EventsQueryVariables>
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

export const AsyncEvents = (
  options: Omit<QueryOptions<EventsQueryVariables>, "query">,
) => {
  return client.query<EventsQuery>({ query: EventsDoc, ...options })
}

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
  const result = readable<
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
