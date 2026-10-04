import { test, expect } from '@playwright/test';

test.describe('Página de apuração', () => {
  test('carrega Presidente + Brasil por padrão', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Apuração das Eleições 2026');
    await expect(page.locator('button[aria-selected="true"]')).toContainText('Presidente');
  });

  test('mostra ranking de Governador SP', async ({ page }) => {
    await page.goto('/?cargo=governador&uf=SP');
    await page.getByRole('button', { name: 'Tabela' }).click();
    await expect(page.locator('.tabela-top5 tbody tr')).toHaveCount(5);
  });

  test('mostra tabela acessível', async ({ page }) => {
    await page.goto('/?cargo=senador&uf=SP');
    await page.getByRole('button', { name: 'Tabela' }).click();
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('table caption')).toContainText('Top 5 candidatos por votos');
  });

  test('exibe nomes reais de candidatos', async ({ page }) => {
    await page.goto('/?cargo=governador&uf=SP');
    await page.getByRole('button', { name: 'Tabela' }).click();
    const nomes = await page.locator('.tabela-top5 .nome').allTextContents();
    expect(nomes.some(n => /CAND /i.test(n))).toBe(false);
    expect(nomes.length).toBeGreaterThan(0);
  });

  test('respeita prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });
});
