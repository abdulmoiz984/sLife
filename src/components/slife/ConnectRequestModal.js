import React, { useState } from 'react';
import {
  Modal,
  View,
  Pressable,
  TextInput,
  StyleSheet,
} from 'react-native';
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
  const [note, setNote] = useState('');

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
    setNote('');
    onClose?.();
  };

  return (
    <Modal
      visible={!!visible && !!target}
      transparent
      animationType="fade"
      onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
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
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Introduce yourself or share why you'd like to connect"
            placeholderTextColor={COLORS.mute}
            multiline
            maxLength={500}
            style={styles.note}
          />
          <Typography fixed size={11} color={COLORS.mute} mT={4}>
            {note.length}/500
          </Typography>
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
      <ScreenOverlayLoader visible={isPending} />
    </Modal>
  );
};

export default ConnectRequestModal;

const styles = StyleSheet.create({
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
    padding: 20,
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
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    color: COLORS.foreground,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  ctaRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  ctaCol: { flex: 1 },
});
