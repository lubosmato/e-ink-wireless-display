import captureWebsite from "capture-website"

const testCapture = async () => {
  console.log("Capturing website screenshot...")
  console.time("capture")
  await captureWebsite.file(
    'https://lubosmato.github.io/sudoku/', 
    'screenshot.png', 
    {
      width: 1200, 
      height: 825, 
      overwrite: true,
      scaleFactor: 1,
      darkMode: false,
    }
  )
  console.timeEnd("capture")
  console.log("Done!")
  process.exit(0)
}

testCapture()
