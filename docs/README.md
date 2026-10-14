# Toolbit documentation

Three documents, each with one job. Read the first if you are about to write
interface code; read the second if you are about to change what the product does.

| Document                               | Answers                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [design-system.md](./design-system.md) | How does Toolbit look and behave? Tokens, type, colour, components, accessibility, contributor rules.                    |
| [ux.md](./ux.md)                       | How is the product organised and why? Personas, jobs, journeys, information architecture, screens, keyboard map, states. |
| [../GLOSSARY.md](../GLOSSARY.md)       | What do the domain words mean? Tool, document, tab, session, snippet, history run.                                       |

## Where the truth lives

Documentation describes intent; the code is the authority on detail.

| Concern                          | File                                    |
| -------------------------------- | --------------------------------------- |
| Design token values              | `src/app/styles/tokens.css`             |
| Tailwind theme bridge            | `src/app/styles/tailwind.css`           |
| Base layer, fonts, motion policy | `src/app/styles/globals.css`            |
| Component and primitive classes  | `src/app/styles/system.css`             |
| Shell composition                | `src/app/shell/WorkspaceShell.tsx`      |
| Navigation model                 | `src/app/shell/navigation.ts`           |
| Routes                           | `src/app/App.tsx`, `src/app/router.tsx` |
| Tool catalogue                   | `src/content/tools.config.ts`           |
| Per-tool chrome spec             | `src/features/tools/specs.ts`           |

## Changing the interface

1. Design tokens are the only place a colour, size or duration is defined. If a
   screen needs a new one, add a semantic token — do not inline a value.
2. Reach for an existing `wb-*` primitive before adding CSS.
3. Check the result in light and dark, at 1440px, 1024px and 390px wide.
4. `npm run check && npm run lint && npm run test:run` must pass.
