import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load the login page for unauthenticated users', async ({ page }) => {
    await page.goto('/dashboard')
    // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트됨
    await expect(page).toHaveURL(/.*login/)
    await expect(page).toHaveTitle(/성서유니온|회원관리/i)
  })

  test('should display login form', async ({ page }) => {
    await page.goto('/login')
    // 로그인 버튼 확인
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible()
  })

  test('should load join page', async ({ page }) => {
    await page.goto('/join')
    await expect(page).toHaveTitle(/성서유니온|회원관리/i)
  })
})
