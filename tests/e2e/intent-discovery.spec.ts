import { test, expect } from '@playwright/test';

test('start clusters open a tool by task', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');

  const cluster = page.getByRole('button', { name: /Inspect & debug API data/ });
  await expect(cluster).toHaveAttribute('aria-expanded', 'false');
  await cluster.click();

  await page.getByRole('button', { name: 'JWT Decoder', exact: true }).click();
  await expect(page).toHaveURL(/jwt-decoder/);
  expect(errors).toEqual([]);
});

test('the palette resolves a described task and opens the top match', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');

  await page.getByRole('button', { name: 'Search tools or actions...', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search tools', exact: true }).fill('make json readable');

  // The top result is the tool that fits the task, and says why it is shown.
  const first = page.locator('[data-index="0"]');
  await expect(first).toContainText('JSON Formatter');
  await expect(first).toContainText('For “make json readable”');

  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/json-formatter/);
  expect(errors).toEqual([]);
});

test('the palette tolerates a typo and names what it recognised', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Search tools or actions...', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search tools', exact: true }).fill('jsom formatter');

  const first = page.locator('[data-index="0"]');
  await expect(first).toContainText('JSON Formatter');
  await expect(first).toContainText('Close to “JSON Formatter”');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('an empty palette offers the opt-in on-device model', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Search tools or actions...', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search tools', exact: true }).fill('zingzang zong');

  await page.getByRole('button', { name: 'Turn on smarter search' }).click();
  await expect(page).toHaveURL(/settings/);
  await expect(page.getByRole('checkbox', { name: /Smarter search/ })).not.toBeChecked();
});

test('a paste expands into the operation set and hands the payload forward', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');

  await page.getByRole('textbox', { name: 'Paste data to find a tool' }).fill('{"b":2,"a":1}');

  // Detection stays first; the graph adds the useful operations for the data.
  await expect(
    page.getByRole('button', { name: 'Open JSON Formatter', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Validate json against a schema' }).click();

  await expect(page).toHaveURL(/json-validator/);
  await expect(page.getByRole('textbox', { name: 'JSON data' })).toContainText('{"b":2,"a":1}');
  expect(errors).toEqual([]);
});

test('a result offers the next useful action carrying the payload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  // A tool with nothing run yet offers no next step.
  await page.goto('/base64-encoder');
  await expect(page.getByRole('region', { name: 'Next useful actions' })).toHaveCount(0);

  // The JSON formatter's default document holds a valid result, so it does.
  await page.goto('/json-formatter');
  const strip = page.getByRole('region', { name: 'Next useful actions' });
  await expect(strip).toBeVisible();
  await strip.getByRole('button', { name: 'Validate json against a schema' }).click();

  await expect(page).toHaveURL(/json-validator/);
  await expect(page.getByRole('textbox', { name: 'JSON data' })).toContainText('inv_1042');
  expect(errors).toEqual([]);
});
