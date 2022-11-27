import adapter from "@sveltejs/adapter-auto"
import preprocess from "svelte-preprocess"
import { dirname } from "path"
import { fileURLToPath } from "url"

const filePath = dirname(fileURLToPath(import.meta.url))
const sassPath = `${filePath}/src/styles/`

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess({
    sass: {
      prependData: `@import '${sassPath}/global.sass'`,
    },
    scss: {
      prependData: `@import '${sassPath}/global.sass';`,
    },
  }),

  kit: {
    adapter: adapter(),
  },
}

export default config
