# YM Soccer - Quick Developer Reference

## Constitutional Principles Checklist

Use this checklist for every component/feature you build:

### ✅ Code Simplicity
- [ ] Functions are ≤30 lines (extract helpers if longer)
- [ ] Maximum 3 levels of indentation
- [ ] Descriptive variable/function names
- [ ] TypeScript types explicit for public interfaces
- [ ] No clever/complex code patterns

### ✅ Accessibility First
- [ ] Semantic HTML (`<nav>`, `<main>`, `<button>`, etc.)
- [ ] `aria-label` on icon-only buttons
- [ ] Keyboard navigation tested
- [ ] 4.5:1 contrast ratio for text (3:1 for large text)
- [ ] Color not sole means of conveying info

### ✅ Documentation Excellence
- [ ] Component has purpose comment above it
- [ ] Non-obvious logic has inline comments
- [ ] JSDoc comments on public functions
- [ ] Magic numbers/config values documented

### ✅ User-Centric Navigation
- [ ] Feature reachable within 2 clicks from home
- [ ] Navigation consistent with existing patterns
- [ ] Active nav item visually indicated
- [ ] Loading states during transitions

### ✅ Visual Clarity
- [ ] Body text minimum 16px
- [ ] Consistent Tailwind spacing units
- [ ] Limited color palette (3-4 colors + neutrals)
- [ ] Generous whitespace
- [ ] Clear visual hierarchy

### ✅ Performance & Responsiveness
- [ ] Images use Next.js `Image` component
- [ ] Below-fold content lazy loaded
- [ ] Works on mobile/tablet/desktop
- [ ] Loads in <3s on 3G
- [ ] No horizontal scrolling on mobile

---

## Common Patterns

### Component Template

```typescript
/**
 * ComponentName - Brief description of what this component does
 * 
 * Used on [where it's used] to [purpose].
 * Key props: propName (what it controls)
 */
interface ComponentNameProps {
  // Prop definitions with comments
  propName: string; // Description of prop
  onAction?: () => void; // Optional callback
}

export function ComponentName({ propName, onAction }: ComponentNameProps) {
  // Component logic with comments explaining "why"
  
  return (
    <div className="p-4 space-y-2">
      {/* Clear semantic HTML structure */}
    </div>
  );
}
```

### Utility Function Template

```typescript
/**
 * Calculates [what it calculates]
 * 
 * @param input - Description of parameter
 * @returns Description of return value
 * 
 * Example: functionName('input') => 'output'
 */
export function functionName(input: string): string {
  // Keep function focused on single responsibility
  // Add comments explaining business logic
  
  return result;
}
```

---

## Testing Quick Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint check
npm run lint
```

---

## Accessibility Testing

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space activates buttons
- Escape closes modals/dropdowns
- Arrow keys navigate lists/menus

### Screen Reader Testing
- **macOS:** VoiceOver (Cmd+F5)
- **Windows:** NVDA (free download)
- Verify: All content announced, buttons labeled, form fields have labels

### Color Contrast Tools
- Browser DevTools (Lighthouse audit)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Target: 4.5:1 for normal text, 3:1 for large (18px+)

---

## Responsive Breakpoints

```typescript
// Tailwind breakpoints (mobile-first)
sm: 640px   // Small tablets
md: 768px   // Tablets
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
```

Test at:
- 375×667 (iPhone SE)
- 768×1024 (iPad)
- 1920×1080 (Desktop)

---

## Team Reference

**Teams in League:**
- Eagles
- Panthers  
- Lions
- Dolphins
- Knights
- Warriors

**Data Location:** `/league_data/rosters.csv`  
**Logos Location:** `/league_data/images/`

---

## Need Help?

1. Review [Project Constitution](./.specify/memory/constitution.md) for principles
2. Check [README](./README.md) for setup and guidelines
3. Use templates in `.specify/templates/` for feature planning
4. Ask maintainers for clarification on unclear requirements

