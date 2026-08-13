import { launchImageLibrary } from 'react-native-image-picker';

/**
 * Pick a single image/document from the library for multipart uploads.
 * Returns `{ uri, type, fileName }` or null if cancelled.
 */
export async function pickUploadAsset({
  mediaType = 'mixed',
  selectionLimit = 1,
} = {}) {
  const result = await launchImageLibrary({
    mediaType,
    selectionLimit,
    includeBase64: false,
  });

  if (result.didCancel || result.errorCode || !result.assets?.length) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset?.uri) return null;

  return {
    uri: asset.uri,
    type: asset.type || 'application/octet-stream',
    fileName: asset.fileName || asset.uri.split('/').pop() || 'upload.jpg',
  };
}

/**
 * Pick a PDF via the system document picker (iOS + Android).
 * Copies into app storage so multipart upload can read the file reliably.
 * Returns `{ uri, type, fileName }` or null if cancelled.
 */
export async function pickPdfDocument() {
  // Lazy-load so app boot is not blocked if the native module is still linking.
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
