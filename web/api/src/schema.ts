import { makeSchema } from "nexus"
import { nexusPrisma } from "nexus-plugin-prisma"
import path from "path"
import { cwd } from "process"

import * as types from "./types"

export const schema = makeSchema({
  shouldGenerateArtifacts: process.env.ENV_SHORT === "local",
  outputs: {
    schema: path.join(cwd(), "generated", "schema.graphql"),
    typegen: path.join(cwd(), "generated", "nexus.ts"),
  },
  prettierConfig: path.join(cwd(), ".prettierrc"),
  contextType: {
    export: "Context",
    module: path.join(cwd(), "src", "context.ts"),
  },
  plugins: [
    nexusPrisma({
      outputs: {
        typegen: path.join(cwd(), "generated/typegen-nexus-plugin-prisma.d.ts"),
      },
    }),
  ],
  types,
})
