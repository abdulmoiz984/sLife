import {
  createNavigationContainerRef,
  CommonActions,
} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

/**
 * Open a chat thread. If ChatScreen is already open (another conversation),
 * replace params so the screen switches instead of ignoring the tap.
 */
export function navigateToChat(params = {}) {
  if (!navigationRef.isReady()) {
    return;
  }

  const conversationId = params.conversationId;
  const userId = params.userId;
  const key =
    conversationId != null
      ? `ChatScreen-c-${conversationId}`
      : userId != null
        ? `ChatScreen-u-${userId}`
        : `ChatScreen-${Date.now()}`;

  const current = navigationRef.getCurrentRoute();
  if (current?.name === 'ChatScreen') {
    const sameConversation =
      conversationId != null &&
      String(current.params?.conversationId) === String(conversationId);
    const sameUser =
      conversationId == null &&
      userId != null &&
      String(current.params?.userId ?? current.params?.id) === String(userId);
    if (sameConversation || sameUser) {
      return;
    }
  }

  navigationRef.navigate({
    name: 'ChatScreen',
    params: {
      conversationId: conversationId ?? undefined,
      userId: userId ?? undefined,
    },
    key,
    merge: false,
  });
}

export function reset(routeName) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: routeName }],
      }),
    );
  }
}
