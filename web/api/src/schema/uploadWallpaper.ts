import path from "path"
import Jimp from "jimp"
import { unlink, writeFile } from "fs/promises"
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
        await writeFile(
          path.join(process.cwd(), "storage/", args.image.name), // TODO security risk
          new DataView(await args.image.arrayBuffer()),
        )

        const inputImage = await Jimp.read(uploadedImagePath)
        await inputImage.quality(100).writeAsync(currentImagePath)

        return true
      } catch (e) {
        return false
      } finally {
        await unlink(uploadedImagePath)
      }
    },
  }),
}))
