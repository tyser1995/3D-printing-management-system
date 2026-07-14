import { chromium } from 'playwright'

const BASE = 'https://3-d-printing-management-system.vercel.app'
const EMAIL = 'devresty2595@gmail.com'
const PASSWORD = '!AdminKai3DBlessBusiness26*'

const browser = await chromium.launch()
const page = await browser.newPage()

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
await page.getByLabel('Email').fill(EMAIL)
await page.getByLabel('Password').fill(PASSWORD)

await Promise.all([
  page.waitForURL(/\/admin\/dashboard/, { timeout: 15000 }).catch(() => null),
  page.getByRole('button', { name: /sign in/i }).click(),
])

await page.waitForTimeout(1500)

console.log('FINAL_URL:', page.url())
await page.screenshot({
  path: 'C:/Users/LCSOBR~1/AppData/Local/Temp/claude/D--KAI3D-github-3D-printing-management-system/ca4028dc-fcc3-4eaa-81b2-cf89658cb415/scratchpad/dashboard.png',
  fullPage: true,
})

const bodyText = await page.locator('body').innerText()
console.log('HAS_DASHBOARD_TEXT:', /dashboard/i.test(bodyText))
console.log('HAS_ERROR_ALERT:', await page.locator('text=/invalid|error/i').count())

await browser.close()
