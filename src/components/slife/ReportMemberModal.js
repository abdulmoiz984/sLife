import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
 * On details focus: enlarge the sheet and lift it above the keyboard
 * (instead of trapping the field in a tiny scroll region).
 */
const ReportMemberModal = ({ visible, target, onClose, onSuccess }) => {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [detailsFocused, setDetailsFocused] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
      setDetailsFocused(false);
      setKeyboardHeight(0);
      return undefined;
    }

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = e => {
      setKeyboardHeight(e?.endCoordinates?.height || 0);
    };
    const onHide = () => {
      setKeyboardHeight(0);
      setDetailsFocused(false);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
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
    Keyboard.dismiss();
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

  const close = () => {
    Keyboard.dismiss();
    onClose?.();
  };

  const expanded = detailsFocused || keyboardHeight > 0;
  // Lift sheet with keyboard on both platforms (Modal often ignores adjustResize).
  const sheetLift = keyboardHeight > 0 ? Math.max(keyboardHeight - insets.bottom, 0) : 0;

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
              expanded && styles.sheetExpanded,
              {
                paddingBottom: Math.max(insets.bottom, 16) + 8,
                marginBottom: Platform.OS === 'android' ? sheetLift : 0,
              },
            ]}
            onPress={e => e.stopPropagation()}>
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

            {!expanded && (
              <Typography
                fixed
                size={13}
                color={COLORS.body}
                mT={6}
                LineHeight={18}>
                Reports are reviewed by the S-Life team. False reports may
                affect your membership.
              </Typography>
            )}

            <ScrollView
              style={[styles.scroll, expanded && styles.scrollExpanded]}
              contentContainerStyle={styles.scrollBody}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}>
              {!expanded && (
                <>
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
                </>
              )}

              <Typography
                fixed
                size={11}
                fFamily="interSemiBold600"
                color={COLORS.mute}
                textTransform="uppercase"
                mT={expanded ? 0 : 8}
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
                style={[styles.note, expanded && styles.noteExpanded]}
                textAlignVertical="top"
                onFocus={() => setDetailsFocused(true)}
                onBlur={() => {
                  if (!keyboardHeight) setDetailsFocused(false);
                }}
                autoFocus={false}
              />
              <Typography fixed size={11} color={COLORS.mute} mT={4}>
                {details.length}/2000
              </Typography>

              {expanded && !!reason && (
                <Typography fixed size={12} color={COLORS.body} mT={12}>
                  Reason: {reasons.find(r => r.value === reason)?.label || reason}
                </Typography>
              )}
            </ScrollView>

            <View style={styles.ctaRow}>
              {expanded ? (
                <View style={styles.ctaCol}>
                  <Button
                    type="ghost"
                    label="Back"
                    onPress={() => {
                      Keyboard.dismiss();
                      setDetailsFocused(false);
                    }}
                    textColor={COLORS.mute}
                    disabled={isPending}
                  />
                </View>
              ) : (
                <View style={styles.ctaCol}>
                  <Button
                    type="ghost"
                    label="Cancel"
                    onPress={close}
                    textColor={COLORS.mute}
                    disabled={isPending}
                  />
                </View>
              )}
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
      </KeyboardAvoidingView>
      <ScreenOverlayLoader visible={isPending} />
    </Modal>
  );
};

export default ReportMemberModal;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '72%',
    backgroundColor: COLORS.elevated,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sheetExpanded: {
    maxHeight: '92%',
    minHeight: '58%',
  },
  handle: {
    width: 48,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  scroll: { maxHeight: 280, marginTop: 16 },
  scrollExpanded: { maxHeight: 420, flexGrow: 1 },
  scrollBody: { paddingBottom: 8, flexGrow: 1 },
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
  },
  noteExpanded: {
    minHeight: 180,
    flexGrow: 1,
  },
  ctaRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  ctaCol: { flex: 1 },
});
