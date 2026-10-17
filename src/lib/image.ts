/** Largest logo we accept from the file picker (decision 9). */
export const LOGO_MAX_UPLOAD = 5 * 1024 * 1024
/** Longest side after resizing. */
export const LOGO_MAX_SIDE = 512

export class ImageError extends Error {}

/**
 * Turns an uploaded image into a PNG no larger than 512 px on its longest
 * side. PNG because the PDF renderer can embed it (it can't embed SVG), and
 * because it keeps logo transparency.
 */
export async function resizeLogo(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new ImageError('Choose a PNG, JPG or SVG image.')
  if (file.size > LOGO_MAX_UPLOAD) throw new ImageError('That image is over 5 MB.')

  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    // SVGs without intrinsic size report 0; draw them at the max size.
    const w = img.naturalWidth || LOGO_MAX_SIDE
    const h = img.naturalHeight || LOGO_MAX_SIDE
    const scale = Math.min(1, LOGO_MAX_SIDE / Math.max(w, h))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * scale)
    canvas.height = Math.round(h * scale)
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new ImageError('Could not read that image.'))),
        'image/png',
      ),
    )
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new ImageError('Could not read that image.'))
    img.src = src
  })
}
