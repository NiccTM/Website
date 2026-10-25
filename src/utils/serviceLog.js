/* Groups the Hobbies repair photos into service-log entries.

   Consecutive images with the same note are one job and one entry (three
   laptops given the same job share a note that says so). An image with no
   note -- the CD player, whose write-up is its own page -- always stands
   alone. Shared by HardwareDiagnostics, which draws the log, and the Hobbies
   logbook plate, which counts it, so the count is the number of entries a
   visitor actually sees. Kept out of HardwareDiagnostics because that
   component is a lazy chunk and the plate renders in the route itself. */
export function serviceEntries(images) {
  const out = []
  for (const img of images) {
    const last = out[out.length - 1]
    if (last && img.note && last.note === img.note) last.images.push(img)
    else out.push({ note: img.note, images: [img] })
  }
  return out
}
