# DevToolbox Design Guidelines

## Design Approach: Utility-First Design System

**Rationale**: DevToolbox is a utility-focused application serving developers who prioritize efficiency, clarity, and consistent functionality over visual decoration. Following a clean, minimal design system approach optimized for productivity tools.

**Reference Inspiration**: Linear, VS Code, and modern developer tools that emphasize function over form while maintaining visual polish.

## Core Design Principles

1. **Clarity Over Decoration**: Every visual element serves a functional purpose
2. **Consistent Patterns**: Standardized layouts and interactions across all 19 tools
3. **Developer-Centric**: Dark mode primary, excellent typography for code/data
4. **Efficient Navigation**: Quick access to any tool without cognitive overhead

## Color Palette

**Dark Mode (Primary)**
- Background: 220 13% 9% (rich dark background)
- Surface: 220 13% 13% (elevated surfaces, cards)
- Border: 220 13% 20% (subtle borders and dividers)
- Text Primary: 220 13% 95% (high contrast text)
- Text Secondary: 220 9% 70% (secondary information)
- Accent: 217 100% 68% (blue for interactive elements)
- Success: 142 76% 47% (green for positive actions)
- Warning: 38 92% 50% (amber for warnings)
- Error: 0 84% 60% (red for errors)

**Light Mode (Secondary)**
- Background: 0 0% 100% (pure white)
- Surface: 220 13% 98% (slightly warm white)
- Border: 220 13% 87% (light borders)
- Text Primary: 220 13% 15% (dark text)
- Text Secondary: 220 9% 40% (secondary text)

## Typography

**Font Stack**: Inter (Google Fonts) for UI, JetBrains Mono for code/data
- **Headings**: Inter 600 (Semibold)
- **Body**: Inter 400 (Regular)
- **Code/Data**: JetBrains Mono 400 (Monospace for precise alignment)
- **Scale**: text-sm (14px), text-base (16px), text-lg (18px), text-xl (20px)

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 for consistency
- **Micro spacing**: p-2, m-2 (8px) for tight elements
- **Standard spacing**: p-4, m-4 (16px) for general content
- **Section spacing**: p-6, m-6 (24px) for tool sections
- **Major spacing**: p-8, m-8 (32px) for main layout areas

**Grid Structure**:
- Fixed sidebar: w-64 (256px) for tool navigation
- Main content: flex-1 with max-width constraints for readability
- Tool panels: Consistent padding of p-6

## Component Library

**Navigation Sidebar**:
- Dark background with hover states
- Clear tool categorization with visual separators
- Active state with accent color highlight
- Collapsible on mobile

**Tool Panels**:
- Input/Output layout: Two-column on desktop, stacked on mobile
- Consistent header with tool name and description
- Action buttons (Convert, Format, Copy) grouped logically
- Clear visual separation between input and output areas

**Input/Output Areas**:
- Textarea with monospace font for code/data
- Consistent border styling and focus states
- Placeholder text with helpful examples
- Copy-to-clipboard button positioned consistently

**Buttons**:
- Primary: Accent color for main actions
- Secondary: Border style for secondary actions
- Icon buttons: For copy actions and tool controls
- Consistent sizing and hover states

**Status Indicators**:
- Success/error states for validation tools
- Loading states for processing operations
- Clear visual feedback for user actions

## Interaction Patterns

**Purposeful Micro-animations**: Use fast, subtle transitions (e.g., 150ms ease-out) for state changes like hover, focus, and visibility. This provides smooth feedback without being distracting. Avoid decorative or slow animations.
**Immediate Feedback**: Real-time processing where possible. User actions should result in an immediate and clear system response.
**Keyboard Shortcuts**: Support common developer shortcuts (Ctrl+A, Ctrl+C)
**Responsive Design**: Mobile-friendly with stacked layouts

## Tool-Specific Considerations

**Code/Data Display**: Syntax highlighting for JSON, YAML, HTML
**Diff Tool**: Side-by-side layout with clear highlighting
**Color Tools**: Include visual color previews alongside hex/rgb values
**Regex Tester**: Live highlighting of matches in test string
**JSON Schema**: Clear error messaging with line numbers

This design system prioritizes developer productivity with a clean, consistent interface that stays out of the way while providing powerful functionality.