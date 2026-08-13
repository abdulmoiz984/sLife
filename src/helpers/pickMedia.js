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
