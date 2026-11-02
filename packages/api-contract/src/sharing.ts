/**
 * Partner sharing. She creates an invite, sends the code or link to her
 * partner, the partner redeems it, and from then on the partner can read a
 * narrow status: date anchors only, never symptoms, mood or notes.
 * Prose: ../CONTRACT.md § Partner sharing.
 */
import type { ProfileMode } from './health';

/** `POST /api/partner-invites/` body. */
export interface PartnerInviteCreate {
  /** The name her partner will see, e.g. "Raisa". Optional. */
  display_name?: string;
}

/**
 * Her invite: `GET /api/partner-invites/` (her open one, 0 or 1, unpaginated),
 * `GET /api/partner-invites/{id}/`, and the 201 from `POST`. Readable by her only.
 * `POST` is 409 while she is already linked.
 */
export interface PartnerInvite {
  id: string;
  /** e.g. `HW-7K3M-Q9XA`; empty once redeemed. Case, spaces and dashes don't matter. */
  code: string;
  /** `https://<host>/p/<code>`: opens the app (App Link) or a page with an "Open in app" button. */
  url: string;
  display_name: string;
  /** RFC 3339 UTC. Invites last 7 days. */
  expires_at: string;
  redeemed_at: string | null;
}

/** The create response is a plain `PartnerInvite`; kept for existing imports. */
export type PartnerInviteCreated = PartnerInvite;

/**
 * `POST /api/partner-links/` body (partner side).
 * 201 link · 404 unknown or expired code (indistinguishable) · 409 either side
 * already linked · 422 own code · 429 too many tries (10/hour).
 */
export interface PartnerLinkRedeem {
  code: string;
  /** The name she will see for her partner. Optional. */
  display_name?: string;
}

export type PartnerRole = 'owner' | 'partner';

/** `GET /api/partner-links/` (array, 0 or 1) and the 201 above. */
export interface PartnerLink {
  id: string;
  /** `owner` = she shares; `partner` = they read. */
  role: PartnerRole;
  other_name: string;
  share_fertile_window: boolean;
  share_pregnancy: boolean;
  created_at: string;
}

/** `PATCH /api/partner-links/{id}/`: owner only (403 for the partner). */
export interface PartnerLinkUpdate {
  share_fertile_window?: boolean;
  share_pregnancy?: boolean;
}

/** Pregnancy hidden by her share settings. */
export type SharedMode = ProfileMode | 'private';

/**
 * `GET /api/shared-statuses/` → `SharedStatus[]` (0 or 1). Calendar dates are
 * `YYYY-MM-DD` in her local day; the partner app derives today's phase.
 */
export interface SharedStatus {
  owner_name: string;
  mode: SharedMode;
  cycle_length: number;
  period_length: number;
  last_period_start: string | null;
  next_period_date: string | null;
  /** `null` when she doesn't share her fertile window. */
  ovulation_date: string | null;
  /** `null` when she doesn't share her pregnancy. */
  pregnancy_due_date: string | null;
  updated_at: string;
}
