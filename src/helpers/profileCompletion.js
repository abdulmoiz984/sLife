export function getProfileCompletion(person) {
  const checks = [
    !!person.avatar,
    !!person.cover,
    !!person.name,
    !!person.headline,
    !!person.bio,
    !!person.shortIntro,
    !!person.videoIntro,
    !!person.currentPosition,
    !!person.company,
    !!person.industry,
    person.yearsExperience != null,
    person.experience?.length > 0,
    person.education?.length > 0,
    person.certifications?.length > 0,
    person.skills?.length > 0,
    (person.specializations?.length ?? 0) > 0,
    (person.interests?.length ?? 0) > 0,
    (person.networkingGoals?.length ?? 0) > 0,
    (person.languages?.length ?? 0) > 0,
    (person.portfolioLinks?.length ?? 0) > 0 || (person.projects?.length ?? 0) > 0,
    (person.documents?.length ?? 0) > 0,
    !!(person.website || person.linkedin || person.instagram || person.facebook || person.youtube),
    !!person.availability,
    (person.lookingFor?.length ?? 0) > 0,
    !!person.location,
    !!person.timezone,
  ];

  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}
