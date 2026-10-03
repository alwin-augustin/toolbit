# 12: Bundle splitting and offline freshness

**What to build:** First load ships only what the current route needs, Tool code loads on demand, and offline users always learn about and can adopt fresh builds without getting stuck.

**Blocked by:** 10 (unified Tool registry).

**Status:** ready-for-agent

- [ ] Tool screens and syntax languages load per route with explicit chunking so landing and legal pages avoid editor and formatter weight
- [ ] Build enforces a size budget covering representative Tools at small and large inputs plus worker transfer paths
- [ ] Service worker precaches hashed route chunks, excludes only documented assets, and checks for updates beyond initial load
- [ ] Update prompts require explicit user action, registration failure never breaks Tools, and preview builds do not emit misleading worker output
- [ ] Install shortcuts launch canonical Tool paths without redirect hops, and hosting headers, caching, and redirects match the actual deploy target
- [ ] Security headers narrow network and script sources to what the app actually uses
- [ ] Tests and build verification prove split points, offline fallback, and freshness behavior
