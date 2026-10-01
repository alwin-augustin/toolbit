import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir:'./tests/e2e',timeout:30000,fullyParallel:false,
    use:{baseURL:process.env.TOOLBIT_PREVIEW_URL || 'http://localhost:4173',trace:'retain-on-failure',screenshot:'only-on-failure'},
    webServer:process.env.TOOLBIT_PREVIEW_URL ? undefined : {command:'npm run preview -- --host localhost --port 4173',url:'http://localhost:4173',reuseExistingServer:!process.env.CI},
});
