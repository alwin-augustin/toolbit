module.exports = async function notarize() {
  // No-op notarization hook for local builds.
  // Configure APPLE_ID/APPLE_ID_PASS in CI if you want real notarization.
  return;
};
