// The frontend (inherited from Strapi v5) reads `id`, `documentId` and `strapiId`.
// We expose all three off the numeric primary key so call sites keep working unchanged.
export function serializePsychologist(p) {
  if (!p) return null
  const idStr = String(p.id)
  return { ...p, id: p.id, documentId: idStr, strapiId: idStr }
}
