# Browser stack and maintenance

The modernization retains React and static Cloudflare hosting. Local transforms, offline use and browser persistence benefit from a client application; there is no demonstrated need for a server framework or hosting migration.

Vite 8, Tailwind 4, native TypeScript 7, ESLint 10 and Vitest 5 replace their older generations. The TypeScript 6 compatibility API remains for lint/dependency tooling. CSS-first Tailwind replaces its configuration file and PostCSS plumbing. Typed TSX design primitives replace paired JSX/declaration files. Unreachable components and prototypes are archived outside Git.

The old issue #34 requested full removal of Tailwind/shadcn. This cleanup instead retains actively used, current Tailwind and accessible Radix primitives supporting routed utilities and the marketing page. Removing these would require a separate complete styling migration without improving the local-processing architecture. Historical requirements for automatic payload persistence and a permanent “no network” label are superseded by the privacy and persistence decisions: saves are explicit and network behavior is described truthfully.

A framework rewrite, dropping a working accessibility primitive or adopting experimental dependencies is not required to keep this stack current. Reconsider a server framework only when a concrete feature needs server rendering or server computation.
