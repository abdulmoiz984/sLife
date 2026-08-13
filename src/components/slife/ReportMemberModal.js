import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
//------------------
import { Typography } from '../../atomComponents';
import { Button, ScreenOverlayLoader } from '../../components';
import Chip from './Chip';
import Overline from './Overline';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { useCustomQuery } from '../../query/useCustomQuery';
import { useCustomMutation } from '../../query/useCustomMutation';
import { createReport, getReportReasons } from '../../api/reportService';
import { showMessage } from '../../utils';

/**
 * Module F — report a member with reason from GET /reports/reasons.
 * `target` needs `{ id, name }`.
 */
const ReportMemberModal = ({ visible, target, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');

  const { data, isLoading } = useCustomQuery({
    queryKey: ['reportReasons'],
    queryFn: getReportReasons,
    enabled: !!visible,
  });

  const reasons = data?.reasons || [];

  useEffect(() => {
    if (!visible) {
      setReason('');
      setDetails('');
    }
  }, [visible]);

  const { mutateAsync, isPending } = useCustomMutation({
    mutationFn: createReport,
    onSuccess: response => {
      showMessage({
        type: 'success',
        message: response?.message || 'Report submitted.',
      });
      onSuccess?.(response);
      onClose?.();
    },
  });

  const submit = async () => {
    if (!target?.id) return;
    if (!reason) {
      showMessage({ type: 'danger', message: 'Please select a reason.' });
      return;
    }
    try {
      await mutateAsync({
        user_id: target.id,
        reason,
        details: details.trim() || undefined,
      });
    } catch (err) {
      showMessage({
        type: 'danger',
        message: err?.response?.data?.message || 'Could not submit report.',
      });
    }
  };

  return (
    <Modal
      visible={!!visible && !!target}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
          <View style={styles.handle} />
          <Overline>Safety</Overline>
          <Typography
            fixed
            size={18}
            fFamily="spaceGroteskBold700"
            color={COLORS.foreground}
            mT={4}>
            Report {target?.name?.split(' ')[0] || 'member'}
          </Typography>
          <Typography fixed size={13} color={COLORS.body} mT={6} LineHeight={18}>
            Reports are reviewed by the S-Life team. False reports may affect
            your membership.
          </Typography>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Typography
              fixed
              size={11}
              fFamily="interSemiBold600"
              color={COLORS.mute}
              textTransform="uppercase"
              mB={8}
              style={styles.track}>
              Reason
            </Typography>
            {isLoading ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <View style={styles.chips}>
                {reasons.map(item => (
                  <Chip
                    key={item.value}
                    label={item.label}
                    active={reason === item.value}
                    onPress={() => setReason(item.value)}
                  />
                ))}
              </View>
            )}

            <Typography
              fixed
              size={11}
              fFamily="interSemiBold600"
              color={COLORS.mute}
              textTransform="uppercase"
              mT={8}
              mB={8}
              style={styles.track}>
              Details (optional)
            </Typography>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Add context that helps our review team"
              placeholderTextColor={COLORS.mute}
              multiline
              maxLength={2000}
              style={styles.note}
            />
            <Typography fixed size={11} color={COLORS.mute} mT={4}>
              {details.length}/2000
            </Typography>
          </ScrollView>

          <View style={styles.ctaRow}>
            <View style={styles.ctaCol}>
              <Button
                type="ghost"
                label="Cancel"
                onPress={onClose}
                textColor={COLORS.mute}
                disabled={isPending}
              />
            </View>
            <View style={styles.ctaCol}>
              <Button
                type="destructive"
                label="Submit report"
                onPress={submit}
                loader={isPending}
                disabled={!reason}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
      <ScreenOverlayLoader visible={isPending} />
    </Modal>
  );
};

export default ReportMemberModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
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
  scroll: { maxHeight: 360, marginTop: 16 },
  scrollBody: { paddingBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  track: { letterSpacing: 0.88 },
  note: {
    minHeight: 96,
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
