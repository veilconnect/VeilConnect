import {
  billingPatchFromStripeEvent,
  buildStripeCheckoutParams,
  computeStripeWebhookSignature,
  verifyStripeWebhookSignature
} from '../src/commercial/billing';

describe('commercial billing helpers', () => {
  it('builds Stripe Checkout subscription parameters without storing sensitive data', () => {
    const params = buildStripeCheckoutParams({
      tenantId: 'tenant_123',
      planId: 'hosted_pro',
      successUrl: 'https://veilconnect.org/success',
      cancelUrl: 'https://veilconnect.org/cancel',
      customerEmail: 'buyer@example.com'
    }, {
      hosted_pro: 'price_hosted_pro'
    });

    expect(params.get('mode')).toBe('subscription');
    expect(params.get('line_items[0][price]')).toBe('price_hosted_pro');
    expect(params.get('metadata[tenant_id]')).toBe('tenant_123');
    expect(params.get('metadata[plan_id]')).toBe('hosted_pro');
    expect(params.get('customer_email')).toBe('buyer@example.com');
  });

  it('maps Stripe checkout and subscription events to tenant billing patches', () => {
    expect(billingPatchFromStripeEvent({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          customer: 'cus_123',
          subscription: 'sub_123',
          metadata: { tenant_id: 'tenant_123', plan_id: 'hosted_team' }
        }
      }
    })).toEqual({
      tenantId: 'tenant_123',
      planId: 'hosted_team',
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: 'sub_123',
      status: 'active'
    });

    expect(billingPatchFromStripeEvent({
      id: 'evt_2',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_123', metadata: { tenant_id: 'tenant_123' } } }
    })).toEqual({
      tenantId: 'tenant_123',
      stripeSubscriptionId: 'sub_123',
      status: 'canceled'
    });
  });

  it('verifies Stripe webhook signatures with timestamp tolerance', async () => {
    const rawBody = '{"id":"evt_123"}';
    const secret = 'whsec_test';
    const timestamp = '1760000000';
    const signature = await computeStripeWebhookSignature(rawBody, timestamp, secret);
    const header = `t=${timestamp},v1=${signature}`;

    await expect(verifyStripeWebhookSignature(rawBody, header, secret, {
      nowMs: Number(timestamp) * 1000 + 1000
    })).resolves.toBe(true);
    await expect(verifyStripeWebhookSignature(rawBody, header, 'wrong', {
      nowMs: Number(timestamp) * 1000 + 1000
    })).resolves.toBe(false);
    await expect(verifyStripeWebhookSignature(rawBody, header, secret, {
      nowMs: Number(timestamp) * 1000 + 301000
    })).resolves.toBe(false);
  });
});
