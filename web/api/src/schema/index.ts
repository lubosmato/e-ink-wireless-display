import "./hello"
import "./post"
import "./display"
import "./weather"
import "./currency"

import { builder } from "../builder"

export const schema = builder.toSchema()
