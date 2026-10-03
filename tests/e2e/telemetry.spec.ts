import { test, expect } from '@playwright/test';
import { gunzipSync } from 'node:zlib';
test('configured analytics strips a browser canary and opt-out stops requests', async ({
  page,
}) => {
  test.skip(
    !process.env.TOOLBIT_VERIFY_ANALYTICS,
    'Run against a preview configured with PostHog.',
  );
  const canary = 'CANARY_BROWSER_SECRET_20261001';
  const bodies: unknown[] = [];
  const failures: string[] = [];
  const accepted: number[] = [];
  page.on('response', (response) => {
    if (
      new URL(response.url()).hostname === 'us.i.posthog.com' &&
      new URL(response.url()).pathname === '/capture/'
    )
      accepted.push(response.status());
  });
  page.on('request', (request) => {
    if (new URL(request.url()).hostname !== 'us.i.posthog.com' || request.method() !== 'POST')
      return;
    try {
      const buffer = request.postDataBuffer();
      if (!buffer) return;
      let text = buffer.toString();
      if (buffer[0] === 31 && buffer[1] === 139) text = gunzipSync(buffer).toString();
      if (!text.startsWith('{') && !text.startsWith('[')) {
        const params = new URLSearchParams(text),
          data = params.get('data');
        if (!data) throw new Error('Unknown event transport');
        const decoded = Buffer.from(data, 'base64');
        text =
          params.get('compression') === 'gzip-js'
            ? gunzipSync(decoded).toString()
            : decoded.toString();
      }
      bodies.push(JSON.parse(text));
    } catch {
      failures.push('Unable to inspect event transport');
    }
  });
  await page.goto(`/json-formatter?token=${canary}#${canary}`);
  await page
    .getByRole('textbox', { name: 'Input code', exact: true })
    .fill(JSON.stringify({ secret: canary }));
  await expect.poll(() => bodies.length, { timeout: 20000 }).toBeGreaterThan(0);
  await expect.poll(() => accepted.includes(200), { timeout: 10000 }).toBe(true);
  expect(failures).toEqual([]);
  expect(JSON.stringify(bodies)).not.toContain(canary);
  const events = bodies.flatMap((body) => {
    const record = body as { batch?: unknown[] };
    return Array.isArray(body) ? body : record.batch || [body];
  }) as { event: string; properties?: Record<string, unknown> }[];
  expect(events.some((event) => event.event === 'transform_succeeded')).toBe(true);
  for (const event of events) {
    expect(event.properties?.$process_person_profile).toBe(false);
    expect(
      Object.keys(event.properties || {}).every((k) =>
        [
          '$process_person_profile',
          'distinct_id',
          'release_id',
          'tool_id',
          'route',
          'duration_bucket',
          'byte_bucket',
          'error_code',
          'component',
          'operation_id',
          'step_count',
          'schema_version',
          'source',
        ].includes(k),
      ),
    ).toBe(true);
  }
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await page.goto('/settings');
  await page.evaluate(() => {
    localStorage.setItem(
      'toolbit-preferences',
      JSON.stringify({ state: { analytics: false, history: true, retentionDays: 30 } }),
    );
  });
  await page.reload();
  const count = bodies.length;
  await page.getByRole('textbox', { name: 'Input code', exact: true }).fill('{"after":true}');
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await page.waitForTimeout(12000);
  expect(bodies.length).toBe(count);
  expect(
    await page.evaluate(() => localStorage.getItem('toolbit:analytics-anonymous-id')),
  ).toBeNull();
});

test('blocked analytics does not interrupt transformation', async ({ page }) => {
  await page.route(
    (url) => url.hostname === 'us.i.posthog.com',
    (route) => route.abort(),
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/json-formatter');
  await page
    .getByRole('textbox', { name: 'Input code', exact: true })
    .fill('{"offline_analytics":true}');
  await page.getByRole('button', { name: 'Format', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Result code', exact: true })).toContainText(
    '"offline_analytics": true',
  );
  expect(errors).toEqual([]);
});
