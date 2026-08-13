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
    tier: badgeToTier(ver.verification_badge),
    verificationBadgeLabel: ver.verification_badge_label,
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
    connection: member.connection || null,
    profileCompleted: member.profile_completed,
    raw: member,
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
