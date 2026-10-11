import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'tests/e2e',timeout:60000,expect:{timeout:10000},fullyParallel:false,workers:1,
  retries:process.env.CI?1:0,
  reporter:[['list'],['json',{outputFile:'output/playwright/e2e-results.json'}]],
  use:{baseURL:process.env.LESSONROUTES_BASE_URL,trace:'off',screenshot:'only-on-failure'},
  projects:[{name:'chromium',use:{...devices['Desktop Chrome']}},{name:'firefox',use:{...devices['Desktop Firefox']}},{name:'webkit',use:{...devices['Desktop Safari']}}],
});
