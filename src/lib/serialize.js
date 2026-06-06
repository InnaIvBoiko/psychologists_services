// The frontend (inherited from Strapi v5) reads `id`, `documentId` and `strapiId`.
// We expose all three off the numeric primary key so call sites keep working unchanged.
export function serializePsychologist(p) {
  if (!p) return null
  const idStr = String(p.id)
  // Never expose the owner's email (personal data) in public API responses.
  const { user_email, ...safe } = p
  return { ...safe, id: p.id, documentId: idStr, strapiId: idStr }
}

// Admin-only serializer: keeps `user_email` and `published` so the moderation UI can
// show the owner and the review status. Only ever returned from admin-guarded routes.
export function serializePsychologistAdmin(p) {
  if (!p) return null
  const idStr = String(p.id)
  return { ...p, id: p.id, documentId: idStr, strapiId: idStr }
}
