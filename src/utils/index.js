import { Platform, StatusBar } from 'react-native';
import { showMessage as flashMessage } from 'react-native-flash-message';
import { COLORS, FONTS } from '../globalStyle/Theme';

const TOAST_SHADOW = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
  },
  android: {
    elevation: 8,
  },
  default: {},
});

/**
 * Top floating toast — slides in below the status bar.
 *
 * @param {string} [message] - Primary line (or body when `title` is set)
 * @param {string} [title] - Headline
 * @param {string} [description] - Secondary line
 * @param {'default'|'success'|'danger'|'warning'|'card'} [type]
 * @param {string} [bgColor] - Override background
 * @param {string} [color] - Override text color
 * @param {'top'|'bottom'|'center'} [position] - Defaults to `top`
 */
export function showMessage({
  message = '',
  title = '',
  description = '',
  type = 'default',
  bgColor = '',
  color = '',
  position = 'top',
  duration = 3200,
}) {
  const isCardToast = type === 'card';

  const displayMessage = title || message;
  const displayDescription = title
    ? description || (title !== message ? message : '')
    : description;

  const backgroundColor = isCardToast
    ? COLORS.surface
    : bgColor ||
      (type === 'success'
        ? COLORS.primary
        : type === 'danger'
          ? COLORS.destructive
          : type === 'warning'
            ? COLORS.actionOrange
            : COLORS.elevated);

  const textColor =
    color || (isCardToast ? COLORS.foreground : COLORS.white100);

  const flashType =
    isCardToast || type === 'default' || type === 'card'
      ? 'info'
      : type === 'warning'
        ? 'warning'
        : type;

  flashMessage({
    message: displayMessage,
    description: displayDescription || undefined,
    type: flashType,
    backgroundColor,
    color: textColor,
    icon: 'auto',
    floating: true,
    hideStatusBar: false,
    statusBarHeight:
      Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : undefined,
    position,
    duration,
    animated: true,
    animationDuration: 280,
    style: {
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      minHeight: 52,
      borderWidth: isCardToast ? 1 : 0,
      borderColor: isCardToast ? COLORS.border : 'transparent',
      ...TOAST_SHADOW,
    },
    titleStyle: {
      fontFamily: FONTS.spaceGroteskSemiBold600,
      fontSize: 15,
      lineHeight: 20,
      color: textColor,
      fontWeight: undefined,
    },
    textStyle: {
      fontFamily: FONTS.interRegular400,
      fontSize: 13,
      lineHeight: 18,
      color: isCardToast ? COLORS.body : textColor,
      opacity: isCardToast ? 1 : 0.92,
    },
  });
}

/** `{ title, description }` toast shorthand */
export function showToast({ title, description, type = 'card', duration = 3000 }) {
  showMessage({ title, description, type, duration });
}

/** Laravel-style `{ field: [msg] }` → `{ field: msg }` for Formik */
export const formatBackendErrors = errors => {
  const errObj = {};

  if (errors && typeof errors === 'object') {
    Object.entries(errors).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        errObj[key] = value[0];
      }
    });
  }

  return errObj;
};

export const objectToFormData = (
  obj,
  formData = new FormData(),
  parentKey = '',
) => {
  Object.entries(obj).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    const currentKey = parentKey ? `${parentKey}[${key}]` : key;

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        const arrayKey = `${currentKey}[${index}]`;

        if (typeof item === 'object' && item?.uri) {
          formData.append(arrayKey, {
            uri: item.uri,
            type: item.type,
            name: item.fileName || item.name || 'file',
          });
        } else {
          formData.append(arrayKey, item);
        }
      });
    } else if (typeof value === 'object' && value?.uri) {
      formData.append(currentKey, {
        uri: value.uri,
        type: value.type,
        name: value.fileName || value.name || 'file',
      });
    } else if (typeof value === 'boolean') {
      formData.append(currentKey, value ? '1' : '0');
    } else {
      formData.append(currentKey, value);
    }
  });

  return formData;
};

/** Keep only digits, max 10 (US local number). Strips leading country `1`. */
export const digitsOnly = value => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length >= 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }
  return digits.slice(0, 10);
};

/** US local mask: 555-123-4567 (ClayMaster pattern). */
export const maskPhoneNumber = input => {
  if (!input) return '';
  const digits = digitsOnly(input);

  if (digits.length === 0) return '';
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) {
    return digits.replace(/(\d{3})(\d+)/, '$1-$2');
  }
  return digits.replace(/(\d{3})(\d{3})(\d+)/, '$1-$2-$3');
};

/** Live field display with country code: +1 555-123-4567 */
export const maskUsPhoneWithCode = input => {
  const local = maskPhoneNumber(input);
  return local ? `+1 ${local}` : '+1 ';
};
