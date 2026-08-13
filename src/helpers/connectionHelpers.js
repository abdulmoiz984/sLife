import { queryClient } from '../api/api';

const badgeToTier = badge => {
  if (!badge) return 'Standard';
  if (badge === 'elite_verified' || badge === 'industry_leader') return 'Elite';
  if (badge === 'verified_professional' || badge === 'executive_member') {
    return 'Verified';
  }
  return 'Standard';
};

/** Map connection.other_user (or nested user) for list rows. */
export function mapConnectionUser(user) {
  if (!user) return null;
  const photo = user.profile_photo_url;
  return {
    id: user.id,
    name: user.full_name || 'Member',
    headline: user.professional_title || user.industry_label || '',
    company: user.company_name || '',
    avatar: photo ? { uri: photo } : null,
    tier: badgeToTier(user.verification_badge),
    raw: user,
  };
}

export function mapConnectionRow(connection) {
  if (!connection) return null;
  const other = mapConnectionUser(connection.other_user);
  return {
    id: connection.id,
    status: connection.status,
    statusLabel: connection.status_label,
    message: connection.message,
    direction: connection.direction,
    isRequester: connection.is_requester,
    createdAt: connection.created_at,
    other,
    raw: connection,
  };
}

/** Invalidate member + connection queries after mutations. */
export async function invalidateConnectionQueries(memberId) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['connections'] }),
    queryClient.invalidateQueries({ queryKey: ['members'] }),
    queryClient.invalidateQueries({ queryKey: ['memberMatches'] }),
    memberId
      ? queryClient.invalidateQueries({ queryKey: ['member', memberId] })
      : Promise.resolve(),
  ]);
}
