import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Pressable,
  TextInput,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
//------------------
import { Typography } from '../../atomComponents';
import { Button, ScreenOverlayLoader } from '../../components';
import Overline from './Overline';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { useCustomMutation } from '../../query/useCustomMutation';
import { createConnection } from '../../api/connectionService';
import { invalidateConnectionQueries } from '../../helpers/connectionHelpers';
import { showMessage } from '../../utils';

/**
 * Module E — send connection request with optional message.
 * `target` needs `{ id, name, headline? }`.
 */
const ConnectRequestModal = ({ visible, target, onClose, onSuccess }) => {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');
  const [keyboardPad, setKeyboardPad] = useState(0);

  useEffect(() => {
    if (!visible) {
      setKeyboardPad(0);
      return undefined;
    }

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = e => {
      const height = e?.endCoordinates?.height || 0;
      // Modal often ignores adjustResize on Android — lift sheet by keyboard height.
      setKeyboardPad(Platform.OS === 'android' ? height : 0);
    };
    const onHide = () => setKeyboardPad(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const { mutateAsync, isPending } = useCustomMutation({
    mutationFn: createConnection,
    onSuccess: async response => {
      showMessage({
        type: 'success',
        message: response?.message || 'Connection request sent.',
      });
      await invalidateConnectionQueries(target?.id);
      setNote('');
      onSuccess?.(response);
      onClose?.();
    },
  });

  const send = async () => {
    if (!target?.id) return;
    Keyboard.dismiss();
    try {
      await mutateAsync({
        user_id: target.id,
        message: note.trim() || undefined,
      });
    } catch (err) {
      showMessage({
        type: 'danger',
        message:
          err?.response?.data?.message ||
          'Could not send connection request.',
      });
    }
  };

  const close = () => {
    Keyboard.dismiss();
    setNote('');
    onClose?.();
  };

  return (
    <Modal
      visible={!!visible && !!target}
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}>
        <Pressable style={styles.backdrop} onPress={close}>
          <Pressable
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(insets.bottom, 16) + 8,
                marginBottom: keyboardPad,
              },
            ]}
            onPress={e => e.stopPropagation()}>
            <View style={styles.handle} />
            <Overline>Send request</Overline>
            <Typography
              fixed
              size={18}
              fFamily="spaceGroteskBold700"
              color={COLORS.foreground}
              mT={4}>
              Connect with {target?.name?.split(' ')[0] || 'member'}
            </Typography>
            {!!target?.headline && (
              <Typography fixed size={13} color={COLORS.body} mT={4}>
                {target.headline}
              </Typography>
            )}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Introduce yourself or share why you'd like to connect"
                placeholderTextColor={COLORS.mute}
                multiline
                maxLength={500}
                style={styles.note}
                textAlignVertical="top"
              />
              <Typography fixed size={11} color={COLORS.mute} mT={4}>
                {note.length}/500
              </Typography>
            </ScrollView>
            <View style={styles.ctaRow}>
              <View style={styles.ctaCol}>
                <Button
                  type="ghost"
                  label="Cancel"
                  onPress={close}
                  textColor={COLORS.mute}
                  disabled={isPending}
                />
              </View>
              <View style={styles.ctaCol}>
                <Button
                  label="Send request"
                  onPress={send}
                  loader={isPending}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
      <ScreenOverlayLoader visible={isPending} />
    </Modal>
  );
};

export default ConnectRequestModal;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.elevated,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  handle: {
    width: 48,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  note: {
    marginTop: 16,
    minHeight: 112,
    maxHeight: 160,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    color: COLORS.foreground,
    fontSize: 14,
  },
  ctaRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  ctaCol: { flex: 1 },
});
