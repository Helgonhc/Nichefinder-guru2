import { test, expect } from '@playwright/test';

test.describe('Navegação Sidebar', () => {
    test('página inicial carrega algum conteúdo', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        const body = page.locator('body');
        await expect(body).toBeVisible();
        const text = await body.textContent();
        expect(text!.length).toBeGreaterThan(100);
    });

    test('navegação para /radar funciona', async ({ page }) => {
        await page.goto('/radar');
        await page.waitForLoadState('networkidle');
        // /radar é rota protegida — pode redirecionar para /login se não autenticado
        const currentUrl = page.url();
        const isValid = currentUrl.includes('/radar') || currentUrl.includes('/login');
        expect(isValid).toBe(true);
        const body = page.locator('body');
        const text = await body.textContent();
        expect(text!.length).toBeGreaterThan(100);
    });

    test('navegação para /tutorial funciona', async ({ page }) => {
        await page.goto('/tutorial');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL('/tutorial');
        // Verifica que o H1 existe
        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible({ timeout: 8000 });
    });

    test('navegação para /settings funciona', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL('/settings');
        const body = page.locator('body');
        await expect(body).toBeVisible();
    });
});

test.describe('SEO e Meta Tags', () => {
    test('página tem title correto', async ({ page }) => {
        await page.goto('/');
        const title = await page.title();
        expect(title).toContain('LeadRadar');
    });

    test('página tem meta description', async ({ page }) => {
        await page.goto('/');
        const meta = await page.locator('meta[name="description"]').getAttribute('content');
        expect(meta).toBeTruthy();
        expect(meta!.length).toBeGreaterThan(50);
    });

    test('página tem lang pt-BR', async ({ page }) => {
        await page.goto('/');
        const lang = await page.locator('html').getAttribute('lang');
        expect(lang).toBe('pt-BR');
    });

    test('robots.txt está acessível', async ({ page }) => {
        const response = await page.request.get('/robots.txt');
        expect(response.status()).toBe(200);
        const body = await response.text();
        expect(body).toContain('User-agent');
    });

    test('sitemap.xml está acessível', async ({ page }) => {
        const response = await page.request.get('/sitemap.xml');
        expect(response.status()).toBe(200);
        const body = await response.text();
        expect(body).toContain('urlset');
    });
});
