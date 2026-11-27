/** Largest photo we accept before shrinking it in the browser */
export const maximumPhotoSize = 15 * 1024 * 1024

const outputSize = 512

/**
 * Crops a photo to a centered square, shrinks it to at most 512×512 and returns a JPEG.
 * Runs in the browser, so only a small file is uploaded. Throws if the image can't be read.
 */
export async function squareProfilePhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const size = Math.min(outputSize, side)

  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext("2d")
  if (!context) throw new Error("Canvas isn't available")

  // JPEG has no transparency, so transparent areas become white instead of black
  context.fillStyle = "#ffffff"
  context.fillRect(0, 0, size, size)
  context.imageSmoothingQuality = "high"
  context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't encode photo"))), "image/jpeg", 0.88)
  })
}
