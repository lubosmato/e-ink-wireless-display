import { IncomingMessage } from "http"

export interface Context {}

export function createContext({ req }: { req: IncomingMessage }): Context {
  // const idToken = req.headers.authorization?.replace("Bearer ", "") ?? ""

  return {
    // getUser: () => getUser(idToken),
  }
}
