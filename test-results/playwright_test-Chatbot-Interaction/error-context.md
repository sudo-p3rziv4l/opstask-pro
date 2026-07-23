# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: playwright_test.spec.js >> Chatbot Interaction
- Location: playwright_test.spec.js:3:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('div:has-text("Cloe AI Assistant")')
Expected: visible
Error: strict mode violation: locator('div:has-text("Cloe AI Assistant")') resolved to 3 elements:
    1) <div class="min-h-screen bg-[#F8FAFC]">…</div> aka getByText('OpsTaskDashboardBoardTimelineNew RequestLeaderboardProjectsPLplaywrightSuper')
    2) <div class="fixed bottom-20 left-4 z-50 w-80 h-96 bg-card border rounded-lg shadow-xl flex flex-col">…</div> aka getByText('Cloe AI AssistantHello! I am')
    3) <div class="flex justify-between items-center p-2 border-b bg-card-header rounded-t-lg">…</div> aka locator('div').filter({ hasText: /^Cloe AI Assistant$/ })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('div:has-text("Cloe AI Assistant")')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e3]:
      - button "Collapse sidebar" [ref=e4]:
        - img [ref=e5]
      - heading "OpsTask" [level=1] [ref=e8]:
        - img [ref=e9]
        - text: OpsTask
      - generic [ref=e13]:
        - link "Dashboard" [ref=e14] [cursor=pointer]:
          - /url: /dashboard
          - generic [ref=e15]:
            - img [ref=e16]
            - generic [ref=e18]: Dashboard
        - link "Board" [ref=e19] [cursor=pointer]:
          - /url: /board
          - generic [ref=e20]:
            - img [ref=e21]
            - generic [ref=e26]: Board
        - link "Timeline" [ref=e27] [cursor=pointer]:
          - /url: /timeline
          - generic [ref=e28]:
            - img [ref=e29]
            - generic [ref=e31]: Timeline
        - link "New Request" [ref=e32] [cursor=pointer]:
          - /url: /requests
          - generic [ref=e33]:
            - img [ref=e34]
            - generic [ref=e36]: New Request
        - link "Leaderboard" [ref=e37] [cursor=pointer]:
          - /url: /leaderboard
          - generic [ref=e38]:
            - img [ref=e39]
            - generic [ref=e45]: Leaderboard
        - link "Projects" [ref=e46] [cursor=pointer]:
          - /url: /projects
          - generic [ref=e47]:
            - img [ref=e48]
            - generic [ref=e51]: Projects
    - banner [ref=e52]:
      - generic [ref=e53]:
        - generic [ref=e55]:
          - img [ref=e56]
          - textbox "Search..." [ref=e59]
        - generic [ref=e60]:
          - button [ref=e61]:
            - img [ref=e62]
          - button "PL playwright Super Admin" [ref=e66]:
            - generic [ref=e67]: PL
            - generic [ref=e68]:
              - generic [ref=e69]: playwright
              - generic [ref=e70]: Super Admin
            - img [ref=e71]
    - main [ref=e74]:
      - generic [ref=e75]:
        - generic [ref=e76]:
          - heading "Dashboard" [level=1] [ref=e77]
          - paragraph [ref=e78]: Overview of task statuses and daily activity.
        - generic [ref=e79]:
          - generic [ref=e80]:
            - heading "Task Status Composition" [level=2] [ref=e81]
            - application [ref=e85]
          - generic [ref=e95]:
            - heading "Daily Tasks Activity" [level=2] [ref=e96]
            - generic [ref=e99]:
              - list [ref=e101]:
                - listitem [ref=e102]:
                  - img "Completed legend icon" [ref=e103]
                  - text: Completed
                - listitem [ref=e105]:
                  - img "Created legend icon" [ref=e106]
                  - text: Created
              - application [ref=e108]:
                - generic [ref=e136]:
                  - generic [ref=e137]:
                    - generic [ref=e139]: Mon
                    - generic [ref=e141]: Tue
                    - generic [ref=e143]: Wed
                    - generic [ref=e145]: Thu
                    - generic [ref=e147]: Fri
                    - generic [ref=e149]: Sat
                    - generic [ref=e151]: Sun
                  - generic [ref=e152]:
                    - generic [ref=e154]: "0"
                    - generic [ref=e156]: "2"
                    - generic [ref=e158]: "4"
                    - generic [ref=e160]: "6"
                    - generic [ref=e162]: "8"
    - button "Toggle Cloe AI Chat" [active] [ref=e164]:
      - img [ref=e165]
    - generic [ref=e167]:
      - generic [ref=e168]:
        - heading "Cloe AI Assistant" [level=3] [ref=e169]
        - button [ref=e170]:
          - img [ref=e171]
      - generic [ref=e177]: Hello! I am Cloe AI. How can I help you?
      - generic [ref=e179]:
        - textbox "Ask Cloe..." [ref=e180]
        - button [ref=e181]:
          - img [ref=e182]
  - alert [ref=e185]
  - generic [ref=e186]: "0"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('Chatbot Interaction', async ({ page }) => {
  4  |   // Add the bypass header for the server-side Next.js middleware
  5  |   await page.setExtraHTTPHeaders({ 'x-playwright': 'true' });
  6  | 
  7  |   // Intercept the client-side API call and mock the response
  8  |   await page.route('**/api/auth/me', route => {
  9  |     route.fulfill({
  10 |       status: 200,
  11 |       contentType: 'application/json',
  12 |       body: JSON.stringify({
  13 |         user: {
  14 |           id: 1,
  15 |           username: "playwright",
  16 |           role: "Super Admin",
  17 |           permissions: ["all"]
  18 |         }
  19 |       })
  20 |     });
  21 |   });
  22 | 
  23 |   await page.goto('http://localhost:4175/dashboard');
  24 |   await page.waitForLoadState('networkidle');
  25 | 
  26 |   // Now on the dashboard, find the chat button
  27 |   const chatButton = page.locator('button[aria-label="Toggle Cloe AI Chat"]');
  28 |   await expect(chatButton).toBeVisible({ timeout: 15000 });
  29 |   
  30 |   // Click the chat button to open the chat
  31 |   await chatButton.click();
  32 |   
  33 |   // Verify the chat modal is open
  34 |   const chatModal = page.locator('div:has-text("Cloe AI Assistant")');
> 35 |   await expect(chatModal).toBeVisible();
     |                           ^ Error: expect(locator).toBeVisible() failed
  36 | 
  37 |   // Type a message into the input
  38 |   const chatInput = page.locator('input[placeholder="Ask Cloe..."]');
  39 |   await expect(chatInput).toBeVisible();
  40 |   await chatInput.fill('hai cloe');
  41 |   
  42 |   // Click the send button
  43 |   const sendButton = page.locator('button[type="submit"]');
  44 |   await sendButton.click();
  45 | 
  46 |   // Wait for AI response to appear (3 messages total: welcome, user msg, AI reply)
  47 |   await expect(page.locator('.space-y-4 > div')).toHaveCount(3, { timeout: 10000 });
  48 | 
  49 |   // Take a final screenshot
  50 |   await page.screenshot({ path: '/home/perzival/opstask-pro/chatbot_screenshot.png' });
  51 | });
```