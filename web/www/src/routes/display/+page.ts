import { AsyncDisplay } from "../../generated/graphql"
import type { Load } from "@sveltejs/kit"

export const load: Load = async () => {
  const displayQuery = await AsyncDisplay({})
  return {
    displayQuery,
  }
}

export const ssr = false
