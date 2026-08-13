export function getProfileCompletion(person) {
  if (!person) return 0;

  // Prefer API-backed fields for the logged-in Profile tab.
  const checks = [
    !!person.avatar,
    !!person.name,
    !!person.headline,
    !!person.bio,
    !!person.company,
    !!person.industry,
    person.yearsExperience != null,
    person.education?.length > 0,
    (person.interests?.length ?? 0) > 0,
    (person.networkingGoals?.length ?? 0) > 0,
    !!(person.website || person.linkedin),
    !!person.location,
    !!person.phone,
    (person.documents?.length ?? 0) > 0,
  ];

  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
