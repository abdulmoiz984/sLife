import React, { useMemo, useState } from 'react';
import {
  View,
  Pressable,
  Platform,
  Modal,
  StyleSheet,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
//------------------
import { Typography } from '../../atomComponents';
import InputLabel from '../customFields/InputLabel';
import { COLORS, RADIUS } from '../../globalStyle/Theme';

const toYmd = date => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Parse YYYY-MM-DD as local calendar date (avoids UTC shift crashes). */
const parseYmd = value => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfDay = date => {
  if (!date || Number.isNaN(date.getTime())) return null;
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
    0,
  );
};

/**
 * iOS UIDatePicker crashes if `value` is outside [minimumDate, maximumDate]
 * or if minimumDate > maximumDate. Always clamp before rendering.
 */
const clampDate = (date, min, max) => {
  let d = startOfDay(date) || startOfDay(new Date());
  const lo = startOfDay(min);
  const hi = startOfDay(max);

  if (lo && hi && lo.getTime() > hi.getTime()) {
    // Invalid range — prefer max (usually "today")
    return hi;
  }
  if (lo && d.getTime() < lo.getTime()) d = lo;
  if (hi && d.getTime() > hi.getTime()) d = hi;
  return d;
};

/**
 * Date field that stores `YYYY-MM-DD` (API-friendly) via native date picker.
 */
const DateField = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  isRequired,
  maximumDate,
  minimumDate,
  disabled,
}) => {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    const parsed = parseYmd(value);
    // Empty value: open near the allowed lower bound (start date), not "now",
    // so end-date pickers don't crash when min > previous default.
    const fallback = startOfDay(minimumDate) || startOfDay(new Date());
    return clampDate(parsed || fallback, minimumDate, maximumDate);
  }, [value, minimumDate, maximumDate]);

  const safeMin = useMemo(() => {
    const lo = startOfDay(minimumDate);
    const hi = startOfDay(maximumDate);
    if (lo && hi && lo.getTime() > hi.getTime()) return hi;
    return lo || undefined;
  }, [minimumDate, maximumDate]);

  const safeMax = useMemo(() => {
    const lo = startOfDay(minimumDate);
    const hi = startOfDay(maximumDate);
    if (lo && hi && lo.getTime() > hi.getTime()) return lo;
    return hi || undefined;
  }, [minimumDate, maximumDate]);

  const onAndroidChange = (event, date) => {
    setOpen(false);
    if (event?.type === 'dismissed' || !date) return;
    onChange?.(toYmd(clampDate(date, safeMin, safeMax)));
  };

  const onIosChange = (_event, date) => {
    if (date) onChange?.(toYmd(clampDate(date, safeMin, safeMax)));
  };

  return (
    <View style={styles.wrap}>
      {!!label && <InputLabel title={label} isRequired={isRequired} />}
      <Pressable
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[
          styles.field,
          error && styles.fieldError,
          disabled && styles.disabled,
        ]}>
        <Typography
          fixed
          size={15}
          color={value ? COLORS.foreground : COLORS.mute}>
          {value || placeholder}
        </Typography>
      </Pressable>
      {!!error && (
        <Typography fixed size={12} color={COLORS.destructive} mT={4}>
          {error}
        </Typography>
      )}

      {open && Platform.OS === 'android' && (
        <DateTimePicker
          value={selected}
          mode="date"
          display="default"
          onChange={onAndroidChange}
          maximumDate={safeMax}
          minimumDate={safeMin}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal
          visible={open}
          transparent
          animationType="slide"
          onRequestClose={() => setOpen(false)}>
          <View style={styles.backdrop}>
            <Pressable style={styles.backdropTap} onPress={() => setOpen(false)} />
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                  <Typography fixed size={15} color={COLORS.mute}>
                    Cancel
                  </Typography>
                </Pressable>
                <Typography
                  fixed
                  size={16}
                  fFamily="interSemiBold600"
                  color={COLORS.foreground}>
                  Select date
                </Typography>
                <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                  <Typography
                    fixed
                    size={15}
                    fFamily="interSemiBold600"
                    color={COLORS.primary}>
                    Done
                  </Typography>
                </Pressable>
              </View>
              <DateTimePicker
                value={selected}
                mode="date"
                display="spinner"
                themeVariant="dark"
                onChange={onIosChange}
                maximumDate={safeMax}
                minimumDate={safeMin}
                style={styles.iosPicker}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default DateField;

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  field: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  fieldError: {
    borderColor: COLORS.destructive,
  },
  disabled: {
    opacity: 0.5,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: COLORS.elevated,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iosPicker: {
    alignSelf: 'center',
  },
});
