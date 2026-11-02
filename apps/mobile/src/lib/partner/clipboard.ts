import { Share } from 'react-native';

/**
 * Copy and paste for partner codes. `expo-clipboard` has a native half, so it
 * is loaded OPTIONALLY (same reason as `src/lib/reminders/notifications.ts`):
 * a build without it keeps working. Copy then falls back to the system share
 * sheet, which has its own "Copy" action on Android; paste reports nothing.
 */
interface ClipboardApi {
  setStringAsync: (text: string) => Promise<boolean>;
  getStringAsync: () => Promise<string>;
}

function loadClipboard(): ClipboardApi | null {
  try {
    // A require inside try/catch is an optional dependency for Metro.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-clipboard') as ClipboardApi;
  } catch {
    return null;
  }
}

const Clipboard = loadClipboard();

export type CopyOutcome = 'copied' | 'shared';

/** Copies `text`; without a clipboard module, opens the share sheet instead. */
export async function copyText(text: string): Promise<CopyOutcome> {
  if (Clipboard) {
    await Clipboard.setStringAsync(text);
    return 'copied';
  }
  await Share.share({ message: text });
  return 'shared';
}

export function canPaste(): boolean {
  return Clipboard !== null;
}

/** Whatever text is on the clipboard, or `null` when it can't be read. */
export async function readClipboardText(): Promise<string | null> {
  if (!Clipboard) return null;
  const text = await Clipboard.getStringAsync();
  return text || null;
}
