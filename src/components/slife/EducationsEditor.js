import React, { useState } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
//------------------
import { Typography } from '../../atomComponents';
import Button from '../customButtons/Button';
import TextField from '../customFields/TextField';
import DateField from '../customFields/DateField';
import ScreenOverlayLoader from '../ScreenOverlayLoader';
import Icon from './Icon';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { useCustomQuery } from '../../query/useCustomQuery';
import { useCustomMutation } from '../../query/useCustomMutation';
import {
  getEducations,
  createEducation,
  updateEducation,
  deleteEducation,
} from '../../api/educationService';
import { formatBackendErrors, showMessage } from '../../utils';

const EMPTY_FORM = {
  institution: '',
  degree: '',
  field_of_study: '',
  start_date: '',
  end_date: '',
  is_current: false,
  description: '',
};

const formatRange = item => {
  const start = item.start_date || '';
  if (item.is_current) return start ? `${start} — Present` : 'Present';
  if (start && item.end_date) return `${start} — ${item.end_date}`;
  return start || item.end_date || '';
};

/**
 * Module C — list / add / edit / delete educations (ClayMaster query+mutation pattern).
 */
const EducationsEditor = ({ compact = false, onDescriptionFocus }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const set = key => value => setForm(prev => ({ ...prev, [key]: value }));

  const { data, isLoading, isFetching, refetch } = useCustomQuery({
    queryKey: ['educations'],
    queryFn: getEducations,
  });

  const educations = data?.educations || [];

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['educations'] });
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  const { mutateAsync: addEducation, isPending: adding } = useCustomMutation({
    mutationFn: createEducation,
    onSuccess: async response => {
      showMessage({
        type: 'success',
        message: response?.message || 'Education added.',
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      await invalidate();
    },
  });

  const { mutateAsync: saveEducation, isPending: updating } = useCustomMutation({
    mutationFn: updateEducation,
    onSuccess: async response => {
      showMessage({
        type: 'success',
        message: response?.message || 'Education updated.',
      });
      setForm(EMPTY_FORM);
      setEditingId(null);
      setShowForm(false);
      await invalidate();
    },
  });

  const { mutateAsync: removeEducation, isPending: removing } =
    useCustomMutation({
      mutationFn: deleteEducation,
      onSuccess: async response => {
        showMessage({
          type: 'success',
          message: response?.message || 'Education removed.',
        });
        await invalidate();
      },
    });

  const startEdit = item => {
    setEditingId(item.id);
    setForm({
      institution: item.institution || '',
      degree: item.degree || '',
      field_of_study: item.field_of_study || '',
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      is_current: !!item.is_current,
      description: item.description || '',
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const submitForm = async () => {
    if (!form.institution.trim()) {
      showMessage({ type: 'danger', message: 'Institution is required.' });
      return;
    }

    const payload = {
      institution: form.institution.trim(),
      degree: form.degree.trim() || undefined,
      field_of_study: form.field_of_study.trim() || undefined,
      start_date: form.start_date.trim() || undefined,
      end_date: form.is_current ? undefined : form.end_date.trim() || undefined,
      is_current: !!form.is_current,
      description: form.description.trim() || undefined,
    };

    try {
      if (editingId) {
        await saveEducation({ id: editingId, ...payload });
      } else {
        await addEducation(payload);
      }
    } catch (err) {
      const parsed = formatBackendErrors(err?.response?.data?.errors);
      const first = Object.values(parsed)[0];
      showMessage({
        type: 'danger',
        message:
          first ||
          err?.response?.data?.message ||
          'Could not save education.',
      });
    }
  };

  const onDelete = async id => {
    try {
      await removeEducation(id);
    } catch (err) {
      showMessage({
        type: 'danger',
        message: err?.response?.data?.message || 'Could not remove education.',
      });
    }
  };

  const busy = adding || updating || removing;

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Typography
          fixed
          size={11}
          fFamily="interSemiBold600"
          color={COLORS.mute}
          textTransform="uppercase"
          style={styles.track}>
          Education
        </Typography>
        <Pressable
          onPress={() => {
            if (showForm) cancelForm();
            else {
              setEditingId(null);
              setForm(EMPTY_FORM);
              setShowForm(true);
            }
          }}
          hitSlop={8}>
          <Typography
            fixed
            size={12}
            fFamily="interSemiBold600"
            color={COLORS.primary}
            textTransform="uppercase"
            style={styles.track}>
            {showForm ? 'Cancel' : 'Add'}
          </Typography>
        </Pressable>
      </View>

      {!compact && (
        <Typography fixed size={13} color={COLORS.body} mB={16} LineHeight={20}>
          Add schools and programs anytime. This is optional during onboarding.
        </Typography>
      )}

      {isLoading ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : educations.length === 0 && !showForm ? (
        <View style={styles.empty}>
          <Typography fixed size={13} color={COLORS.mute} textAlign="center">
            No education entries yet.
          </Typography>
          <Button
            label="Add education"
            type="outline"
            mt={12}
            onPress={() => setShowForm(true)}
          />
        </View>
      ) : (
        educations.map(item => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.cardCopy}>
                <Typography
                  fixed
                  size={15}
                  fFamily="spaceGroteskSemiBold600"
                  color={COLORS.foreground}>
                  {item.institution}
                </Typography>
                {(item.degree || item.field_of_study) && (
                  <Typography fixed size={13} color={COLORS.body} mT={4}>
                    {[item.degree, item.field_of_study]
                      .filter(Boolean)
                      .join(' · ')}
                  </Typography>
                )}
                {!!formatRange(item) && (
                  <Typography fixed size={12} color={COLORS.mute} mT={4}>
                    {formatRange(item)}
                  </Typography>
                )}
              </View>
              <View style={styles.actions}>
                <Pressable onPress={() => startEdit(item)} hitSlop={8}>
                  <Typography
                    fixed
                    size={11}
                    fFamily="interSemiBold600"
                    color={COLORS.primary}
                    textTransform="uppercase">
                    Edit
                  </Typography>
                </Pressable>
                <Pressable
                  onPress={() => onDelete(item.id)}
                  hitSlop={8}
                  disabled={busy}>
                  <Typography
                    fixed
                    size={11}
                    fFamily="interSemiBold600"
                    color={COLORS.destructive}
                    textTransform="uppercase">
                    Remove
                  </Typography>
                </Pressable>
              </View>
            </View>
          </View>
        ))
      )}

      {showForm && (
        <View style={styles.form}>
          <TextField
            label="Institution"
            placeholder="e.g. MIT"
            value={form.institution}
            onChangeText={set('institution')}
            autoCapitalize="words"
            isRequired
          />
          <TextField
            label="Degree"
            placeholder="e.g. MBA"
            value={form.degree}
            onChangeText={set('degree')}
          />
          <TextField
            label="Field of study"
            placeholder="e.g. Entrepreneurship"
            value={form.field_of_study}
            onChangeText={set('field_of_study')}
          />
          <DateField
            label="Start date"
            placeholder="Select start date"
            value={form.start_date}
            onChange={next => {
              setForm(prev => {
                const nextEnd =
                  prev.end_date &&
                  next &&
                  prev.end_date < next
                    ? ''
                    : prev.end_date;
                return {
                  ...prev,
                  start_date: next,
                  end_date: nextEnd,
                };
              });
            }}
            maximumDate={new Date()}
          />
          {!form.is_current && (
            <DateField
              label="End date"
              placeholder="Select end date"
              value={form.end_date}
              onChange={set('end_date')}
              minimumDate={
                form.start_date
                  ? (() => {
                      const [y, m, d] = form.start_date.split('-').map(Number);
                      return new Date(y, m - 1, d, 12, 0, 0, 0);
                    })()
                  : undefined
              }
              maximumDate={new Date()}
            />
          )}
          <Pressable
            onPress={() =>
              setForm(prev => ({ ...prev, is_current: !prev.is_current }))
            }
            style={styles.checkRow}>
            <View style={[styles.box, form.is_current && styles.boxOn]}>
              {form.is_current && (
                <Icon.Check
                  size={14}
                  color={COLORS.primaryForeground}
                  strokeWidth={3}
                />
              )}
            </View>
            <Typography fixed size={13} color={COLORS.body}>
              Currently studying here
            </Typography>
          </Pressable>
          <TextField
            label="Description"
            placeholder="Optional notes"
            value={form.description}
            onChangeText={set('description')}
            multiline
            onFocus={() => onDescriptionFocus?.()}
          />
          <Button
            label={editingId ? 'Update education' : 'Save education'}
            onPress={submitForm}
            loader={busy}
          />
        </View>
      )}

      {isFetching && !isLoading && (
        <ActivityIndicator color={COLORS.mute} style={styles.refresh} />
      )}

      {!showForm && educations.length > 0 && (
        <Pressable onPress={() => refetch()} style={styles.refreshLink}>
          <Typography
            fixed
            size={11}
            fFamily="interSemiBold600"
            color={COLORS.mute}
            textTransform="uppercase"
            textAlign="center"
            style={styles.track}>
            Refresh
          </Typography>
        </Pressable>
      )}
      <ScreenOverlayLoader visible={busy} />
    </View>
  );
};

export default EducationsEditor;

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  track: { letterSpacing: 0.88 },
  loader: { marginVertical: 24 },
  empty: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  cardCopy: { flex: 1, minWidth: 0 },
  actions: {
    gap: 12,
    alignItems: 'flex-end',
  },
  form: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  box: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  refresh: { marginTop: 8 },
  refreshLink: { paddingVertical: 8 },
});
