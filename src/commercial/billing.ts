import { CommercialPlanId, getCommercialPlan, isPaidCommercialPlan } from './plans';

export interface StripePriceMap {
  hosted_pro?: string;
  hosted_team?: string;
  self_host_pro?: string;
}

export interface CheckoutRequest {
  tenantId: string;
  planId: CommercialPlanId;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}

export interface TenantBillingPatch {
  tenantId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status?: 'trialing' | 'active' | 'past_due' | 'canceled';
  planId?: CommercialPlanId;
}

export interface StripeLikeEvent {
  id: string;
  type: string;
  data?: { object?: Record<string, any> };
}

export function stripePriceForPlan(planId: CommercialPlanId, prices: StripePriceMap): string | null {
  if (!isPaidCommercialPlan(planId)) return null;
  if (planId === 'incident_retainer' || planId === 'enterprise_private') return null;
  switch (planId) {
    case 'hosted_pro':
      return prices.hosted_pro || null;
    case 'hosted_team':
      return prices.hosted_team || null;
    case 'self_host_pro':
      return prices.self_host_pro || null;
    default:
      return null;
  }
}

export function buildStripeCheckoutParams(input: CheckoutRequest, prices: StripePriceMap): URLSearchParams {
  const price = stripePriceForPlan(input.planId, prices);
  if (!price) throw new Error(`stripe price is not configured for ${input.planId}`);

  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('success_url', input.successUrl);
  params.set('cancel_url', input.cancelUrl);
  params.set('line_items[0][price]', price);
  params.set('line_items[0][quantity]', '1');
  params.set('client_reference_id', input.tenantId);
  params.set('metadata[tenant_id]', input.tenantId);
  params.set('metadata[plan_id]', input.planId);
  if (input.customerEmail) params.set('customer_email', input.customerEmail);
  return params;
}

export function planFromStripeMetadata(value: unknown): CommercialPlanId | undefined {
  const planId = String(value || '');
  const plan = getCommercialPlan(planId);
  return plan.id === 'free' && planId !== 'free' ? undefined : plan.id;
}

export function billingPatchFromStripeEvent(event: StripeLikeEvent): TenantBillingPatch | null {
  const object = event.data?.object || {};
  const metadata = (object.metadata || {}) as Record<string, unknown>;
  const tenantId = String(metadata.tenant_id || object.client_reference_id || '');
  const planId = planFromStripeMetadata(metadata.plan_id);

  if (event.type === 'checkout.session.completed') {
    return {
      tenantId,
      planId,
      stripeCustomerId: typeof object.customer === 'string' ? object.customer : undefined,
      stripeSubscriptionId: typeof object.subscription === 'string' ? object.subscription : undefined,
      status: 'active'
    };
  }

  if (event.type === 'customer.subscription.updated') {
    const subscriptionStatus = String(object.status || '');
    return {
      tenantId,
      stripeSubscriptionId: typeof object.id === 'string' ? object.id : undefined,
      status: subscriptionStatus === 'past_due'
        ? 'past_due'
        : subscriptionStatus === 'canceled' || subscriptionStatus === 'unpaid'
          ? 'canceled'
          : subscriptionStatus === 'trialing'
            ? 'trialing'
            : 'active'
    };
  }

  if (event.type === 'customer.subscription.deleted') {
    return {
      tenantId,
      stripeSubscriptionId: typeof object.id === 'string' ? object.id : undefined,
      status: 'canceled'
    };
  }

  return null;
}

function parseStripeSignatureHeader(header: string): { timestamp: string; signatures: string[] } {
  const parts = header.split(',').map(v => v.trim()).filter(Boolean);
  const timestamp = parts.find(p => p.startsWith('t='))?.slice(2) || '';
  const signatures = parts.filter(p => p.startsWith('v1=')).map(p => p.slice(3));
  return { timestamp, signatures };
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeStripeWebhookSignature(rawBody: string, timestamp: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${rawBody}`));
  return bytesToHex(new Uint8Array(sig));
}

export async function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  opts: { nowMs?: number; toleranceSeconds?: number } = {}
): Promise<boolean> {
  if (!rawBody || !signatureHeader || !secret) return false;
  const { timestamp, signatures } = parseStripeSignatureHeader(signatureHeader);
  if (!timestamp || signatures.length === 0) return false;

  const tsMs = Number(timestamp) * 1000;
  if (!Number.isFinite(tsMs)) return false;
  const tolerance = opts.toleranceSeconds ?? 300;
  const now = opts.nowMs ?? Date.now();
  if (Math.abs(now - tsMs) > tolerance * 1000) return false;

  const expected = await computeStripeWebhookSignature(rawBody, timestamp, secret);
  return signatures.some(signature => timingSafeEqual(signature, expected));
}
