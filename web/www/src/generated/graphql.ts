import client from "../apolloClient"
import type {
  ApolloQueryResult,
  ObservableQuery,
  WatchQueryOptions,
  QueryOptions,
  MutationOptions,
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
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar. */
  Date: string
  /** The `File` scalar type represents a file upload. */
  File: any
}

export enum AttendeeResponseStatus {
  Accepted = "accepted",
  Declined = "declined",
  NeedsAction = "needsAction",
  Tentative = "tentative",
}

export type Calendar = {
  __typename?: "Calendar"
  id: Scalars["String"]
  week: Array<Event>
}

export type Display = {
  __typename?: "Display"
  calendar: Calendar
  exchange: Exchange
  id: Scalars["String"]
  image: Scalars["String"]
  weather: Weather
}

export type Event = {
  __typename?: "Event"
  attendees: Array<EventAttendee>
  colorId?: Maybe<Scalars["String"]>
  created: Scalars["Date"]
  creator: Person
  description?: Maybe<Scalars["String"]>
  end?: Maybe<Scalars["Date"]>
  eventType: EventType
  htmlLink: Scalars["String"]
  id: Scalars["String"]
  location?: Maybe<Scalars["String"]>
  organizer: Person
  reminders: EventReminders
  start?: Maybe<Scalars["Date"]>
  status: EventStatus
  summary?: Maybe<Scalars["String"]>
  transparency: EventTransparency
  updated: Scalars["Date"]
  visibility: EventVisibility
}

export type EventAttendee = {
  __typename?: "EventAttendee"
  displayName?: Maybe<Scalars["String"]>
  email?: Maybe<Scalars["String"]>
  optional?: Maybe<Scalars["Boolean"]>
  organizer?: Maybe<Scalars["Boolean"]>
  responseStatus: AttendeeResponseStatus
  self: Scalars["Boolean"]
}

export type EventReminder = {
  __typename?: "EventReminder"
  method: Scalars["String"]
  minutes: Scalars["Float"]
}

export type EventReminders = {
  __typename?: "EventReminders"
  overrides: Array<EventReminder>
  useDefault: Scalars["Boolean"]
}

export enum EventStatus {
  Cancelled = "cancelled",
  Confirmed = "confirmed",
  Tentative = "tentative",
}

export enum EventTransparency {
  Opaque = "opaque",
  Transparent = "transparent",
}

export enum EventType {
  Default = "default",
  FocusTime = "focusTime",
  OutOfOffice = "outOfOffice",
}

export enum EventVisibility {
  Confidential = "confidential",
  Default = "default",
  Private = "private",
  Public = "public",
}

export type Exchange = {
  __typename?: "Exchange"
  /** currency code of currency being converted from. eg. USD */
  from: Scalars["String"]
  id: Scalars["String"]
  rate: Scalars["Float"]
  /** currency code of currency being converted to. eg. EUR */
  to: Scalars["String"]
}

export type Mutation = {
  __typename?: "Mutation"
  uploadWallpaper: Scalars["Boolean"]
}

export type MutationUploadWallpaperArgs = {
  image: Scalars["File"]
}

export type Person = {
  __typename?: "Person"
  displayName?: Maybe<Scalars["String"]>
  email?: Maybe<Scalars["String"]>
  id?: Maybe<Scalars["String"]>
  self: Scalars["Boolean"]
}

export type Post = {
  __typename?: "Post"
  content: Scalars["String"]
  id: Scalars["ID"]
  user: User
}

export type Query = {
  __typename?: "Query"
  display: Display
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

export type Weather = {
  __typename?: "Weather"
  id: Scalars["String"]
  prediction: WeatherData
}

export enum WeatherCode {
  /** Clear sky */
  ClearSky = "CLEAR_SKY",
  /** Depositing rime fog */
  DepositingRimeFog = "DEPOSITING_RIME_FOG",
  /** Drizzle: Dense */
  DrizzleDense = "DRIZZLE_DENSE",
  /** Drizzle: Light */
  DrizzleLight = "DRIZZLE_LIGHT",
  /** Drizzle: Moderate */
  DrizzleModerate = "DRIZZLE_MODERATE",
  /** Fog */
  Fog = "FOG",
  /** Freezing Drizzle: Dense */
  FreezingDrizzleDense = "FREEZING_DRIZZLE_DENSE",
  /** Freezing Drizzle: Light */
  FreezingDrizzleLight = "FREEZING_DRIZZLE_LIGHT",
  /** Freezing Rain: Heavy */
  FreezingRainHeavy = "FREEZING_RAIN_HEAVY",
  /** Freezing Rain: Light */
  FreezingRainLight = "FREEZING_RAIN_LIGHT",
  /** Mainly clear */
  MainlyClear = "MAINLY_CLEAR",
  /** Overcast */
  Overcast = "OVERCAST",
  /** Partly cloudy */
  PartlyCloudy = "PARTLY_CLOUDY",
  /** Rain: Heavy */
  RainHeavy = "RAIN_HEAVY",
  /** Rain: Moderate */
  RainModerate = "RAIN_MODERATE",
  /** Rain showers: Moderate */
  RainShowersModerate = "RAIN_SHOWERS_MODERATE",
  /** Rain showers: Slight */
  RainShowersSlight = "RAIN_SHOWERS_SLIGHT",
  /** Rain showers: Violent */
  RainShowersViolent = "RAIN_SHOWERS_VIOLENT",
  /** Rain: Slight */
  RainSlight = "RAIN_SLIGHT",
  /** Snow fall: Heavy */
  SnowFallHeavy = "SNOW_FALL_HEAVY",
  /** Snow fall: Moderate */
  SnowFallModerate = "SNOW_FALL_MODERATE",
  /** Snow fall: Slight */
  SnowFallSlight = "SNOW_FALL_SLIGHT",
  /** Snow grains */
  SnowGrains = "SNOW_GRAINS",
  /** Snow showers: Heavy */
  SnowShowersHeavy = "SNOW_SHOWERS_HEAVY",
  /** Snow showers: Slight */
  SnowShowersSlight = "SNOW_SHOWERS_SLIGHT",
  /** Thunderstorm: Heavy hail */
  ThunderstormHeavyHail = "THUNDERSTORM_HEAVY_HAIL",
  /** Thunderstorm: Slight hail */
  ThunderstormSlightHail = "THUNDERSTORM_SLIGHT_HAIL",
  /** Thunderstorm: Slight or moderate */
  ThunderstormSlightOrModerate = "THUNDERSTORM_SLIGHT_OR_MODERATE",
}

export type WeatherData = {
  __typename?: "WeatherData"
  code: WeatherCode
  hourly: Array<WeatherSample>
  presentPrecipitation: Scalars["Float"]
  sunriseAt: Scalars["Date"]
  sunsetAt: Scalars["Date"]
  temperature: Scalars["Float"]
}

export type WeatherSample = {
  __typename?: "WeatherSample"
  precipitation: Scalars["Float"]
  rain: Scalars["Float"]
  showers: Scalars["Float"]
  snowfall: Scalars["Float"]
  temperature: Scalars["Float"]
  time: Scalars["Date"]
  weatherCode: WeatherCode
}

export type EventFragment = {
  __typename?: "Event"
  id: string
  summary?: string | null
  start?: string | null
  end?: string | null
  description?: string | null
  status: EventStatus
  visibility: EventVisibility
  colorId?: string | null
  created: string
  location?: string | null
  updated: string
  attendees: Array<{
    __typename?: "EventAttendee"
    displayName?: string | null
    email?: string | null
    optional?: boolean | null
    organizer?: boolean | null
    responseStatus: AttendeeResponseStatus
    self: boolean
  }>
}

export type DisplayQueryVariables = Exact<{ [key: string]: never }>

export type DisplayQuery = {
  __typename?: "Query"
  display: {
    __typename?: "Display"
    id: string
    image: string
    calendar: {
      __typename?: "Calendar"
      id: string
      week: Array<{
        __typename?: "Event"
        id: string
        summary?: string | null
        start?: string | null
        end?: string | null
        description?: string | null
        status: EventStatus
        visibility: EventVisibility
        colorId?: string | null
        created: string
        location?: string | null
        updated: string
        attendees: Array<{
          __typename?: "EventAttendee"
          displayName?: string | null
          email?: string | null
          optional?: boolean | null
          organizer?: boolean | null
          responseStatus: AttendeeResponseStatus
          self: boolean
        }>
      }>
    }
    weather: {
      __typename?: "Weather"
      id: string
      prediction: {
        __typename?: "WeatherData"
        code: WeatherCode
        temperature: number
        presentPrecipitation: number
        sunriseAt: string
        sunsetAt: string
        hourly: Array<{
          __typename?: "WeatherSample"
          precipitation: number
          rain: number
          showers: number
          snowfall: number
          temperature: number
          time: string
          weatherCode: WeatherCode
        }>
      }
    }
    exchange: {
      __typename?: "Exchange"
      id: string
      from: string
      to: string
      rate: number
    }
  }
}

export type UploadWallpaperMutationVariables = Exact<{
  image: Scalars["File"]
}>

export type UploadWallpaperMutation = {
  __typename?: "Mutation"
  uploadWallpaper: boolean
}

export const EventFragmentDoc = gql`
  fragment Event on Event {
    id
    summary
    start
    end
    description
    status
    visibility
    attendees {
      displayName
      email
      optional
      organizer
      responseStatus
      self
    }
    colorId
    created
    location
    updated
  }
`
export const DisplayDoc = gql`
  query Display {
    display {
      id
      calendar {
        id
        week {
          ...Event
        }
      }
      weather {
        id
        prediction {
          code
          temperature
          presentPrecipitation
          sunriseAt
          sunsetAt
          hourly {
            precipitation
            rain
            showers
            snowfall
            temperature
            time
            weatherCode
          }
        }
      }
      exchange {
        id
        from
        to
        rate
      }
      image
    }
  }
  ${EventFragmentDoc}
`
export const UploadWallpaperDoc = gql`
  mutation UploadWallpaper($image: File!) {
    uploadWallpaper(image: $image)
  }
`
export const Display = (
  options: Omit<WatchQueryOptions<DisplayQueryVariables>, "query">,
): Readable<
  ApolloQueryResult<DisplayQuery> & {
    query: ObservableQuery<DisplayQuery, DisplayQueryVariables>
  }
> => {
  const q = client.watchQuery({
    query: DisplayDoc,
    ...options,
  })
  var result = readable<
    ApolloQueryResult<DisplayQuery> & {
      query: ObservableQuery<DisplayQuery, DisplayQueryVariables>
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

export const AsyncDisplay = (
  options: Omit<QueryOptions<DisplayQueryVariables>, "query">,
) => {
  return client.query<DisplayQuery>({ query: DisplayDoc, ...options })
}

export const UploadWallpaper = (
  options: Omit<
    MutationOptions<any, UploadWallpaperMutationVariables>,
    "mutation"
  >,
) => {
  const m = client.mutate<
    UploadWallpaperMutation,
    UploadWallpaperMutationVariables
  >({
    mutation: UploadWallpaperDoc,
    ...options,
  })
  return m
}
