import { queryClient } from '../api/api';
import { navigate, navigateToChat } from '../navigation/NavigationService';
import { invalidateConnectionQueries } from './connectionHelpers';
import { formatChatTime } from './chatHelpers';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'];

export function unwrapNotifications(data) {
  if (!data) return [];
  if (Array.isArray(data.notifications)) return data.notifications;
  if (Array.isArray(data.data?.notifications)) return data.data.notifications;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

export function mapNotification(raw) {
  if (!raw) return null;
  const data = raw.data && typeof raw.data === 'object' ? raw.data : {};
  return {
    id: raw.id,
    type: raw.type || data.type || null,
    title: raw.title || '',
    body: raw.body || '',
    data,
    isRead: !!raw.is_read,
    readAt: raw.read_at,
    createdAt: raw.created_at,
    timeLabel: formatChatTime(raw.created_at, { compact: true }),
    raw,
  };
}

export function notificationGroupLabel(iso) {
  if (!iso) return 'Earlier';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Earlier';

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startWeek = new Date(startToday);
  startWeek.setDate(startToday.getDate() - 6);

  if (d >= startToday) return 'Today';
  if (d >= startWeek) return 'This Week';
  return 'Earlier';
}

export function groupNotifications(list) {
  const order = ['Today', 'This Week', 'Earlier'];
  const buckets = {
    Today: [],
    'This Week': [],
    Earlier: [],
  };
  list.forEach(item => {
    const label = notificationGroupLabel(item.createdAt);
    buckets[label].push(item);
  });
  return order
    .map(label => ({ label, items: buckets[label] }))
    .filter(g => g.items.length > 0);
}

export async function invalidateNotificationQueries() {
  await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
}

/**
 * Route from inbox item or FCM `data` payload.
 * Always fetch/open screens from IDs — never trust payload body as truth.
 */
export function openNotificationDestination(payload = {}) {
  const type = payload.type || payload.data?.type;
  const data =
    payload.data && typeof payload.data === 'object' ? payload.data : payload;

  if (type === 'chat_message') {
    navigateToChat({
      conversationId: data.conversation_id
        ? Number(data.conversation_id) || data.conversation_id
        : undefined,
      userId: data.sender_id
        ? Number(data.sender_id) || data.sender_id
        : undefined,
    });
    return;
  }

  if (type === 'connection_request') {
    invalidateConnectionQueries(data.sender_id).catch(() => {});
    navigate('RequestsScreen');
    return;
  }

  if (type === 'connection_accept' || type === 'connection_accepted') {
    invalidateConnectionQueries(data.user_id || data.sender_id).catch(() => {});
    const memberId = data.user_id || data.sender_id;
    if (memberId) {
      navigate('ProfileScreen', { id: Number(memberId) || memberId });
    } else {
      navigate('RequestsScreen');
    }
    return;
  }

  if (type === 'verification_approved' || type === 'verification_rejected') {
    navigate('ProfileSetupScreen');
    return;
  }

  navigate('NotificationsScreen');
}
