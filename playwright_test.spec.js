import { test, expect } from '@playwright/test';

test('Chatbot Interaction', async ({ page }) => {
  // Add the bypass header for the server-side Next.js middleware
  await page.setExtraHTTPHeaders({ 'x-playwright': 'true' });

  // Intercept the client-side API call and mock the response
  await page.route('**/api/auth/me', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 1,
          username: "playwright",
          role: "Super Admin",
          permissions: ["all"]
        }
      })
    });
  });

  await page.goto('http://localhost:4175/dashboard');
  await page.waitForLoadState('networkidle');

  // Now on the dashboard, find the chat button
  const chatButton = page.locator('button[aria-label="Toggle Cloe AI Chat"]');
  await expect(chatButton).toBeVisible({ timeout: 15000 });
  
  // Click the chat button to open the chat
  await chatButton.click();
  
  // Verify the chat modal is open
  const chatModal = page.locator('h3:has-text("Cloe AI Assistant")');
  await expect(chatModal).toBeVisible();

  // Type a message into the input
  const chatInput = page.locator('input[placeholder="Ask Cloe..."]');
  await expect(chatInput).toBeVisible();
  await chatInput.fill('hai cloe');
  
  // Click the send button
  const sendButton = page.locator('button[type="submit"]');
  await sendButton.click();

  // Wait for AI response to appear (3 messages total: welcome, user msg, AI reply)
  await expect(page.locator('.space-y-4 > div')).toHaveCount(3, { timeout: 10000 });

  // Take a final screenshot
  await page.screenshot({ path: '/home/perzival/opstask-pro/chatbot_screenshot.png' });
});