import { onboardBoardroom } from '../assets/images';

const badgeToTier = badge => {
  if (!badge) return 'Standard';
  if (badge === 'elite_verified' || badge === 'industry_leader') return 'Elite';
  if (badge === 'verified_professional' || badge === 'executive_member') {
    return 'Verified';
  }
  return 'Standard';
};

/** Map list/card member → UI card shape used by Home/Discover. */
export function mapMemberCard(member) {
  if (!member) return null;
  const photo = member.profile_photo_url;
  return {
    id: member.id,
    name: member.full_name || 'Member',
    headline: member.professional_title || member.professional_role_label || '',
    company: member.company_name || '',
    location: member.location || '',
    industry: member.industry_label || member.industry || '',
    yearsExperience: member.years_of_experience,
    avatar: photo ? { uri: photo } : null,
    tier: badgeToTier(member.verification_badge),
    verificationBadge: member.verification_badge,
    verificationBadgeLabel: member.verification_badge_label,
    interests: (member.interests || []).map(i =>
      typeof i === 'string' ? i : i.label || i.value,
    ),
    networkingGoals: (member.networking_goals || []).map(g =>
      typeof g === 'string' ? g : g.label || g.value,
    ),
    connection: member.connection || null,
    raw: member,
  };
}

/** Map GET /members/{id} detail → FullProfileView / ProfileScreen shape. */
export function mapMemberDetail(member) {
  if (!member) return null;
  const basic = member.basic_info || {};
  const pro = member.professional_info || {};
  const org = member.organization || {};
  const ver = member.verification || {};
  const bio = member.bio_interests || {};
  const photo = basic.profile_photo_url;

  return {
    id: member.id,
    name: member.full_name || 'Member',
    email: member.email,
    headline: pro.professional_title || '',
    shortIntro: '',
    bio: bio.bio || '',
    company: org.company_name || '',
    location: basic.location || '',
    industry: pro.industry_label || pro.industry || '',
    yearsExperience: pro.years_of_experience,
    roleLabel: pro.professional_role_label || '',
    website: org.website || '',
    linkedin: ver.linkedin_or_portfolio_url || '',
    phone: basic.phone_number,
    avatar: photo ? { uri: photo } : null,
    cover: onboardBoardroom,
    tier: badgeToTier(ver.verification_badge || member.verification_badge),
    verificationBadgeLabel:
      ver.verification_badge_label || member.verification_badge_label,
    interests: (bio.interests || []).map(i =>
      typeof i === 'string' ? i : i.label || i.value,
    ),
    networkingGoals: (member.networking_goals || []).map(g =>
      typeof g === 'string' ? g : g.label || g.value,
    ),
    education: (member.educations || []).map(e => ({
      school: e.institution,
      degree: e.degree,
      field: e.field_of_study,
      period: e.is_current
        ? `${e.start_date || ''} — Present`
        : [e.start_date, e.end_date].filter(Boolean).join(' — '),
    })),
    documents: (ver.documents || []).map(d => ({
      id: d.id,
      category: d.type,
      label: d.type_label || d.type,
      name: d.original_filename,
      url: d.file_url,
    })),
    connection: member.connection || null,
    profileCompleted: member.profile_completed,
    raw: member,
  };
}

/**
 * Map GET /profile (own profile) + auth user → FullProfileView shape.
 * Profile payload nests sections like members detail, but name/email/badge
 * often live on the auth user or profile root.
 */
export function mapOwnProfile(profile, user) {
  if (!profile && !user) return null;

  const basic = profile?.basic_info || {};
  const pro = profile?.professional_info || {};
  const org = profile?.organization || {};
  const ver = profile?.verification || {};
  const bio = profile?.bio_interests || {};
  const photo = basic.profile_photo_url || user?.profile_photo_url;

  const badge =
    profile?.verification_badge ||
    ver.verification_badge ||
    user?.verification_badge;
  const badgeLabel =
    profile?.verification_badge_label ||
    ver.verification_badge_label ||
    user?.verification_badge_label;

  return {
    id: user?.id,
    name: basic.full_name || user?.full_name || 'You',
    email: user?.email,
    headline: pro.professional_title || '',
    shortIntro: '',
    bio: bio.bio || '',
    company: org.company_name || '',
    currentPosition: pro.professional_title || pro.professional_role_label || '',
    location: basic.location || '',
    industry: pro.industry_label || pro.industry || '',
    yearsExperience: pro.years_of_experience,
    roleLabel: pro.professional_role_label || '',
    website: org.website || '',
    linkedin: ver.linkedin_or_portfolio_url || '',
    phone: basic.phone_number,
    avatar: photo ? { uri: photo } : null,
    cover: onboardBoardroom,
    tier: badgeToTier(badge),
    verificationBadgeLabel: badgeLabel,
    experience: [],
    certifications: [],
    skills: [],
    interests: (bio.interests || []).map(i =>
      typeof i === 'string' ? i : i.label || i.value,
    ),
    networkingGoals: (profile?.networking_goals || []).map(g =>
      typeof g === 'string' ? g : g.label || g.value,
    ),
    education: (profile?.educations || []).map(e => ({
      school: e.institution,
      degree: e.degree,
      field: e.field_of_study,
      period: e.is_current
        ? `${e.start_date || ''} — Present`
        : [e.start_date, e.end_date].filter(Boolean).join(' — '),
    })),
    documents: (ver.documents || []).map(d => ({
      id: d.id,
      category: d.type,
      label: d.type_label || d.type,
      name: d.original_filename,
      url: d.file_url,
    })),
    profileCompleted: profile?.profile_completed ?? user?.profile_completed,
    raw: profile || user,
  };
}

export function connectionCtaLabel(connection) {
  if (!connection) return 'Connect';
  if (connection.status === 'accepted') return 'Connected';
  if (connection.status === 'pending') {
    return connection.direction === 'incoming' ? 'Respond' : 'Pending';
  }
  return 'Connect';
}
