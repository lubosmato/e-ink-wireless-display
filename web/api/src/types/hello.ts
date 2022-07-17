import { queryField } from "nexus"

export const Query = queryField("hello", {
  type: "String",
  resolve: () => "hello world",
})
