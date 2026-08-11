# Getting Started with the YM Soccer Constitution

Welcome to the YM Soccer League Application project! This guide will help you understand how to work within our constitutional framework.

---

## 📋 What is the Constitution?

The **Project Constitution** (`.specify/memory/constitution.md`) is our project's foundation. It defines six non-negotiable principles that guide every line of code, every design decision, and every feature we build.

Think of it as our "source of truth" for quality standards.

---

## 🎯 The Six Principles (In Plain English)

### 1. 🧩 Code Simplicity
**What it means:** Write code like you're explaining it to a friend who's learning to code.  
**In practice:**
- Short functions (around 30 lines max)
- Clear variable names like `teamName` instead of `tn`
- Break complex stuff into smaller pieces
- If you need to think hard to understand it, simplify it

### 2. ♿ Accessibility First
**What it means:** Everyone can use the app, regardless of ability.  
**In practice:**
- Can you navigate with just a keyboard? (Try it!)
- Do buttons make sense to a screen reader?
- Can colorblind users still understand the content?
- Is text readable (not too small, good contrast)?

### 3. 📝 Documentation Excellence
**What it means:** Comments that explain *why*, not just *what*.  
**In practice:**
```typescript
// ❌ BAD: Stating the obvious
// Loop through teams
teams.forEach(team => ...)

// ✅ GOOD: Explaining the why
// Filter to active teams only - inactive teams are hidden from public view
// to avoid confusion during mid-season roster changes
teams.filter(t => t.isActive).forEach(team => ...)
```

### 4. 🧭 User-Centric Navigation
**What it means:** Users can find anything within 2 clicks, no hunting.  
**In practice:**
- Home → Teams → Team Roster (that's 2 clicks ✅)
- Home → Player Search → Player Profile (that's 2 clicks ✅)
- Home → About → History → Archive → Old Stats (that's 4 clicks ❌)

### 5. 👁️ Visual Clarity
**What it means:** Clean, uncluttered design that's easy to scan.  
**In practice:**
- Plenty of breathing room (whitespace)
- Text big enough to read on phones (16px minimum)
- Consistent colors (not a rainbow explosion)
- Clear headings and sections

### 6. ⚡ Performance & Responsiveness
**What it means:** Fast on phones, tablets, desktops - everywhere.  
**In practice:**
- Optimize images (use Next.js `Image` component)
- Load fast even on slow 3G (under 3 seconds)
- No horizontal scrolling on phones
- Test on real devices, not just your laptop

---

## 🚀 Your First Feature

Let's say you want to build a "Team Roster" page. Here's the workflow:

### Step 1: Plan with the Constitution in Mind

Open `.specify/templates/plan-template.md` and fill it out:

```markdown
## Constitutional Alignment

- [x] Code Simplicity: Break roster parsing into helper functions
- [x] Accessibility: Add aria-labels to player cards, ensure keyboard nav
- [x] Documentation: Comment CSV parsing logic and data structures
- [x] Navigation: Add "Roster" link to main nav (1 click from home)
- [x] Visual Clarity: Use card layout with Tailwind spacing
- [x] Performance: Lazy load player photos, optimize team logos
```

### Step 2: Build with Principles in Mind

```typescript
/**
 * TeamRoster - Displays all players for a specific team
 * 
 * Used on /teams/[teamId] page to show the current season roster.
 * Parses roster data from CSV and displays in an accessible card grid.
 */
interface TeamRosterProps {
  teamId: string; // Team identifier (e.g., "eagles", "panthers")
}

export function TeamRoster({ teamId }: TeamRosterProps) {
  // Parse roster data from CSV
  // We use CSV parsing here instead of a database because the league
  // updates rosters via spreadsheet - this approach matches their workflow
  const players = parseRosterData(teamId);
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {players.map(player => (
        <PlayerCard 
          key={player.id} 
          player={player}
          aria-label={`${player.name}, number ${player.number}`}
        />
      ))}
    </div>
  );
}
```

### Step 3: Test Against All Principles

Use `.specify/QUICKREF.md` checklist:

```
✅ Code Simplicity
  ✓ TeamRoster component < 30 lines
  ✓ parseRosterData extracted as helper
  ✓ Clear prop names

✅ Accessibility
  ✓ Keyboard navigation tested (Tab through players)
  ✓ aria-label on PlayerCard
  ✓ Tested with VoiceOver (macOS screen reader)

✅ Documentation
  ✓ Component purpose comment added
  ✓ CSV parsing rationale explained

✅ Navigation
  ✓ Reachable from Home → Teams → [Team] (2 clicks)
  ✓ Consistent with existing nav patterns

✅ Visual Clarity
  ✓ Card grid with responsive breakpoints
  ✓ Tailwind spacing (gap-4)
  ✓ Text minimum 16px

✅ Performance
  ✓ Player photos use <Image> component
  ✓ Tested on iPhone SE (375px width)
  ✓ Loads in 2.1s on throttled 3G
```

---

## 🔍 Code Review Process

When reviewing someone else's code (or your own):

1. **Open the PR and ask:** "Does this align with our six principles?"

2. **Check each principle:**
   - Read the code - is it simple and clear?
   - Try keyboard navigation - does it work?
   - Look for comments - do they explain "why"?
   - Click around - is navigation intuitive?
   - View on mobile - does it look good?
   - Check DevTools - are images optimized?

3. **If something's off, reference the principle:**
   > "This violates Principle 1 (Code Simplicity) - this function is 80 lines and hard to follow. Can we break it into smaller helpers?"

4. **Approve only if all principles are met.** No exceptions.

---

## 📚 Quick Reference

| Need | File |
|------|------|
| Understand the principles | `.specify/memory/constitution.md` |
| Quick checklist | `.specify/QUICKREF.md` |
| Plan a feature | `.specify/templates/plan-template.md` |
| Write a spec | `.specify/templates/spec-template.md` |
| Break down tasks | `.specify/templates/tasks-template.md` |
| Summary/overview | `.specify/CONSTITUTION_SUMMARY.md` |

---

## ❓ Common Questions

### "Isn't this overkill for a small project?"

The constitution keeps quality high even as the project grows and contributors change. It's easier to follow principles from day one than to refactor later.

### "What if I disagree with a principle?"

Great! Open a discussion issue. The constitution can be amended if there's good reason. But amendments must be deliberate and documented.

### "What if I forget a principle?"

That's what code review is for. Reviewers will catch it and point you to the relevant principle. No shame in learning!

### "Do I really need to check ALL six principles every time?"

Yes. They're all important, and with practice it becomes second nature. Use the QUICKREF.md checklist until it's muscle memory.

---

## 🎓 Learning Path

**Week 1:** Read the constitution, understand each principle  
**Week 2:** Build a small feature using the templates  
**Week 3:** Review someone else's code against the principles  
**Week 4:** You're a constitutional expert! 🎉

---

## 💡 Pro Tips

1. **Print the QUICKREF.md checklist** and keep it near your monitor
2. **Set up browser bookmarks** for WCAG contrast checker and accessibility testing tools
3. **Install a screen reader** (VoiceOver on Mac, NVDA on Windows) and learn basic controls
4. **Keep comments brief but meaningful** - focus on the "why"
5. **When in doubt, simplify** - simpler is almost always better

---

## 🤝 We're in This Together

The constitution isn't about being perfect or gatekeeping. It's about creating a consistent, high-quality experience for the soccer league community we're serving.

Every player card, every roster view, every schedule page we build makes it easier for families to engage with their local league. That's worth doing right.

**Now go build something awesome! ⚽**

---

*Questions? Check the constitution or ask a maintainer. We're here to help!*

