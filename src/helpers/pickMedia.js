import { launchImageLibrary } from 'react-native-image-picker';
import { showMessage } from '../utils';

const IMAGE_OPTIONS = {
  mediaType: 'photo',
  includeBase64: false,
  maxHeight: 2000,
  maxWidth: 3000,
  selectionLimit: 1,
  // ClayMaster / ZoomGo — full-screen gallery on iOS
  presentationStyle: 'fullScreen',
};

const isValidImage = asset => {
  if (!asset?.uri) return false;

  const mime = String(asset.type ?? '').toLowerCase();
  if (mime.startsWith('image/')) {
    return (
      mime.includes('jpeg') || mime.includes('jpg') || mime.includes('png')
    );
  }

  const name = String(asset.fileName ?? asset.uri).toLowerCase();
  const ext = name.split('.').pop()?.split('?')[0];
  return ['jpg', 'jpeg', 'png'].includes(ext);
};

/**
 * Pick a single image from the library for multipart uploads.
 * Matches ClayMaster: fullScreen presentation + jpg/png validation.
 * Returns `{ uri, type, fileName }` or null if cancelled.
 */
export async function pickUploadAsset({
  mediaType = 'photo',
  selectionLimit = 1,
} = {}) {
  const result = await launchImageLibrary({
    ...IMAGE_OPTIONS,
    mediaType,
    selectionLimit,
  });

  if (result.didCancel) return null;

  if (result.errorCode) {
    showMessage({
      type: 'danger',
      message: `Image picker error: ${result.errorCode}`,
    });
    return null;
  }

  const asset = result.assets?.[0];
  if (!asset?.uri) return null;

  if (mediaType === 'photo' && !isValidImage(asset)) {
    showMessage({
      type: 'warning',
      message: 'Invalid image type. Please select a jpg, jpeg, or png file.',
    });
    return null;
  }

  return {
    uri: asset.uri,
    type: asset.type || 'image/jpeg',
    fileName: asset.fileName || asset.uri.split('/').pop() || 'upload.jpg',
  };
}

/**
 * Pick a PDF via the system document picker (iOS + Android).
 * Uses fullScreen presentation on iOS (same as photo gallery).
 * Returns `{ uri, type, fileName }` or null if cancelled.
 */
export async function pickPdfDocument() {
  const {
    pick,
    keepLocalCopy,
    types,
    isErrorWithCode,
    errorCodes,
  } = require('@react-native-documents/picker');

  try {
    const [file] = await pick({
      type: [types.pdf],
      allowMultiSelection: false,
      mode: 'import',
      presentationStyle: 'fullScreen',
    });

    if (!file?.uri) return null;

    const [copy] = await keepLocalCopy({
      files: [
        {
          uri: file.uri,
          fileName: file.name || 'document.pdf',
        },
      ],
      destination: 'cachesDirectory',
    });

    if (copy?.status !== 'success' || !copy.localUri) {
      return null;
    }

    return {
      uri: copy.localUri,
      type: file.type || 'application/pdf',
      fileName: file.name || 'document.pdf',
    };
  } catch (err) {
    if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
      return null;
    }
    throw err;
  }
}
