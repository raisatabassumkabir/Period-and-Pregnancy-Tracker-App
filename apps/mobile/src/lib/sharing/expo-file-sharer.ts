import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { FileSharer, ShareableFile } from './index';

const EXPORT_DIRECTORY = 'exports';

/** Share-sheet implementation: write to the app cache, hand the URI to the OS sheet. */
export function createExpoFileSharer(): FileSharer {
  return {
    isAvailable: () => Platform.OS === 'android' || Platform.OS === 'ios',

    share: async ({ filename, contents, contentType }: ShareableFile) => {
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        throw new Error('Sharing is not available on this device.');
      }
      const file = new File(Paths.cache, EXPORT_DIRECTORY, filename);
      file.parentDirectory.create({ idempotent: true, intermediates: true });
      file.write(contents);
      await Sharing.shareAsync(file.uri, {
        mimeType: contentType,
        dialogTitle: filename,
      });
    },
  };
}
