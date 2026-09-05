export interface ShareableFile {
  filename: string;
  contents: string;
  contentType: string;
}

export interface FileSharer {
  isAvailable(): boolean;
  share(file: ShareableFile): Promise<void>;
}

const noop: FileSharer = {
  isAvailable: () => false,
  share: async () => {
    throw new Error(
      'File sharing is not configured. Install expo-file-system and ' +
        'expo-sharing, then register an implementation via setFileSharer().'
    );
  },
};

let active: FileSharer = noop;

export const setFileSharer = (impl: FileSharer) => {
  active = impl;
};

export const getFileSharer = (): FileSharer => active;
