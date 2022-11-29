import { createWriteStream } from "fs"
import path from "path"
import Jimp from "jimp"
import { Writable } from "stream"
import { unlink } from "fs/promises"
import { builder } from "../builder"

builder.mutationFields((t) => ({
  uploadWallpaper: t.boolean({
    args: {
      image: t.arg({ type: "File", required: true }),
    },
    async resolve(_, args) {
      // TODO replace this proof of concept with something reasonable
      const uploadedImagePath = path.join(
        process.cwd(),
        "storage/",
        args.image.name, // TODO security risk
      )
      const currentImagePath = path.join(process.cwd(), "storage/image.jpg")

      try {
        await args.image.stream().pipeTo(
          Writable.toWeb(
            createWriteStream(
              path.join(process.cwd(), "storage/", args.image.name), // TODO security risk
            ),
          ),
        )

        const inputImage = await Jimp.read(uploadedImagePath)
        await inputImage.quality(100).writeAsync(currentImagePath)

        return true
      } catch {
        return false
      } finally {
        await unlink(uploadedImagePath)
      }
    },
  }),
}))
