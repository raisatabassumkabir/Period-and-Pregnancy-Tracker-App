import { localGuide } from './local-guide';
import type { AssistantClient } from './types';

/**
 * Pluggable assistant facade, mirroring `src/lib/billing/index.ts`. Today the
 * only implementation is the offline `localGuide`; a future remote/LLM client
 * registers itself the same way `setBillingClient` does.
 */
let active: AssistantClient = localGuide;

export const registerAssistantClient = (client: AssistantClient) => {
  active = client;
};

export const getAssistantClient = (): AssistantClient => active;

export { localGuide };
export type {
  AssistantClient,
  AssistantContext,
  AssistantReply,
} from './types';
