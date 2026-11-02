import { Linking, Share } from 'react-native';

/**
 * Sending an invite or a kind message. WhatsApp first (most of our users
 * live there), falling back to the web link, which opens WhatsApp or the
 * browser. The system share sheet covers every other app.
 */
const WHATSAPP_APP_URL = 'whatsapp://send?text=';
const WHATSAPP_WEB_URL = 'https://wa.me/?text=';

export async function sendOnWhatsApp(text: string): Promise<void> {
  const encoded = encodeURIComponent(text);
  const appUrl = `${WHATSAPP_APP_URL}${encoded}`;
  const hasApp = await Linking.canOpenURL(appUrl).catch(() => false);
  await Linking.openURL(hasApp ? appUrl : `${WHATSAPP_WEB_URL}${encoded}`);
}

export async function shareText(text: string): Promise<void> {
  await Share.share({ message: text });
}

/** Partner codes look like HW-7K3M-Q9XA; anything else in a link is ignored. */
const CODE_PATTERN = /^HW-?[A-Z2-9]{4}-?[A-Z2-9]{4}$/i;

export function isPartnerCode(
  value: string | undefined | null
): value is string {
  return !!value && CODE_PATTERN.test(value.trim());
}

/** Same shape, found anywhere inside a longer text (a link or her whole message). */
const CODE_IN_TEXT = /HW[-\s]?([A-Z2-9]{4})[-\s]?([A-Z2-9]{4})(?![A-Z0-9])/i;

/**
 * The partner may paste her code, her link (`https://…/p/HW-7K3M-Q9XA`) or the
 * whole WhatsApp message. Returns the normalised code `HW-7K3M-Q9XA`, or null.
 */
export function extractPartnerCode(
  text: string | undefined | null
): string | null {
  const match = text?.match(CODE_IN_TEXT);
  if (!match) return null;
  return `HW-${match[1]}-${match[2]}`.toUpperCase();
}
