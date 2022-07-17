import { PrismaClient } from "@prisma/client"

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.ENV_SHORT !== "local") {
  prisma = new PrismaClient()
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
}

export default prisma

export interface Context {
  prisma: PrismaClient
}

export function createContext(): Context {
  return { prisma }
}
