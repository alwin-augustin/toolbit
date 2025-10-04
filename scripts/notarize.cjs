/**
 * Notarization Script for macOS
 *
 * This script handles app notarization for macOS distribution.
 * Notarization is required for apps distributed outside the Mac App Store.
 *
 * To enable notarization:
 * 1. Get an Apple Developer account
 * 2. Create an app-specific password: https://support.apple.com/en-us/HT204397
 * 3. Set environment variables:
 *    - APPLE_ID: Your Apple ID email
 *    - APPLE_ID_PASSWORD: App-specific password
 *    - APPLE_TEAM_ID: Your Apple Developer Team ID
 * 4. Install @electron/notarize: npm install --save-dev @electron/notarize
 */

const { notarize } = require('@electron/notarize');
const path = require('path');

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context;

  // Only notarize for macOS
  if (electronPlatformName !== 'darwin') {
    return;
  }

  // Check if required environment variables are set
  const appleId = process.env.APPLE_ID;
  const appleIdPassword = process.env.APPLE_ID_PASSWORD;
  const teamId = process.env.APPLE_TEAM_ID;

  if (!appleId || !appleIdPassword || !teamId) {
    console.warn(
      '⚠️  Skipping notarization: APPLE_ID, APPLE_ID_PASSWORD, or APPLE_TEAM_ID not set'
    );
    console.warn(
      '   To enable notarization, set these environment variables or disable this step.'
    );
    return;
  }

  const appName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log('🔐 Notarizing app...');
  console.log(`   App path: ${appPath}`);

  try {
    await notarize({
      appBundleId: 'com.toolbit.app',
      appPath,
      appleId,
      appleIdPassword,
      teamId,
    });

    console.log('✅ Notarization complete');
  } catch (error) {
    console.error('❌ Notarization failed:', error);
    throw error;
  }
};
