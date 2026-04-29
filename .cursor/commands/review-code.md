# Review Code

## Overview
Perform a systematic code review of recently implemented changes. This command guides you through checking code quality, correctness, security, performance, and maintainability to ensure high-quality, production-ready code.

**This repo:** Unity 6 (2D URP) under `Assets/` and a Next.js app under `LLM Test Integration/`. Apply each checklist item only where it applies (C#, TypeScript, editor assets, etc.).

## How to Use
1. Specify which files or changes to review (e.g., recently modified files, specific components)
2. Work through each review area systematically
3. Document findings and suggest improvements
4. Prioritize issues by severity (critical, high, medium, low)

## Code Quality
- [ ] Clear, descriptive naming following project conventions
- [ ] Consistent formatting, no unused code
- [ ] DRY principle, Single Responsibility Principle
- [ ] Reasonable complexity, proper separation of concerns
- [ ] No over-engineering

## Logic & Correctness
- [ ] Edge cases handled (null, empty, extremes)
- [ ] Proper input validation and type safety
- [ ] Errors handled appropriately (try/catch in C# where needed; Result types or boundaries in React as appropriate)
- [ ] User-visible failures are understandable; no silent failures for critical paths
- [ ] Requirements or intended behavior are met
- [ ] Race conditions and timing issues considered (async React, Unity lifecycle)

## Security
- [ ] Untrusted input is validated or escaped where it becomes HTML, URLs, or commands
- [ ] Secrets and API keys are not committed; local env vars used as needed
- [ ] No sensitive data logged in plain text
- [ ] Any auth or session logic (if present) follows sensible patterns

## Performance
- [ ] **Unity:** Hot paths avoid per-frame allocations; expensive work not done unnecessarily in `Update`; physics/collision usage is appropriate
- [ ] **Web:** Avoid unnecessary re-renders; large lists and media handled sensibly; async work does not block the UI without feedback
- [ ] Event listeners and subscriptions are cleaned up where relevant
- [ ] Debouncing/throttling for high-frequency user input when appropriate

## Maintainability
- [ ] Code is readable and self-documenting
- [ ] Complex logic has short, targeted comments where helpful
- [ ] Tests or manual verification steps exist where risk matters
- [ ] Reusable patterns extracted; coupling is intentional

## Dependencies & Integration
- [ ] Dependencies are justified and versions are coherent (`Packages/manifest.json`, `LLM Test Integration/package.json`)
- [ ] Boundaries between Unity and the Next.js app (if any) remain clear
- [ ] Type safety in TypeScript avoids unjustified `any`

## Review Summary Template

After completing the review, provide a very short structured summary:

### ✅ Strengths
- [List positive aspects of the implementation]

### ⚠️ Issues Found
- **Critical**: [Issues that must be fixed before merge]
- **High**: [Issues that should be fixed soon]
- **Medium**: [Issues to address when convenient]
- **Low**: [Nice-to-have improvements]

### 💡 Recommendations
- [Specific suggestions for improvement]
- [Best practices to consider]

### 🎯 Verdict
- [ ] ✅ Approved - Ready to merge
- [ ] 🔄 Approved with minor changes
- [ ] ⏸️ Changes requested - needs revision
- [ ] ❌ Blocked - critical issues must be resolved

## Notes
- Focus on the most impactful issues first
- Be constructive and specific in feedback
- Consider the context (quick fix vs. major feature)
- Balance perfectionism with pragmatism
- Reference `AGENTS.md` and existing patterns in this repo
