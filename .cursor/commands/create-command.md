# Create Command

## Purpose
This command helps you create new custom commands for Cursor. It will guide you through the process of creating a well-structured, reusable command that can be triggered with a `/` prefix.

## Process

### Step 1: Gather Information
Ask the user the following questions:

1. **Command name**: What should the command be called? (will be used after `/`)
   - Should be lowercase with hyphens (e.g., `review-code`, `write-tests`)
   - Should be descriptive and memorable

2. **Command purpose**: What should this command do?
   - Get a clear description of the command's goal
   - Understand the context and use case

3. **Command structure**: What type of command is this?
   - Checklist-based (for step-by-step processes)
   - Task-oriented (for specific actions like reviews or audits)
   - Template-based (for generating code or documentation)
   - Workflow-based (for multi-step processes)

4. **Key steps or sections**: What are the main components?
   - Ask for the main sections or steps the command should include
   - Get any specific requirements or constraints

### Step 2: Create the Command File

Based on the information gathered, create a new `.md` file in `.cursor/commands/` with:

1. **Clear title**: Use a descriptive H1 heading
2. **Overview section**: Brief description of what the command does
3. **Structured content**: Organized sections based on the command type:
   - For checklists: Use checkboxes `- [ ]` for actionable items
   - For reviews/audits: Include categories with specific items to check
   - For workflows: Number the steps clearly
   - For templates: Provide clear structure with placeholders

4. **Best practices**:
   - Use clear, concise language
   - Include examples where helpful
   - Add context for why certain steps matter
   - Make it actionable and specific
   - Consider edge cases or common issues

### Step 3: Save and Confirm

1. Save the file as `.cursor/commands/{command-name}.md`
2. Confirm the command has been created
3. Explain how to use it: Type `/{command-name}` in the chat input box
4. Suggest testing it immediately

## Command Template Structure

Here's a general template to follow:

```markdown
# [Command Name]

## Overview
[Brief description of what this command does and when to use it]

## [Main Section 1]
[Content for first section - could be steps, checklist items, or guidance]

## [Main Section 2]
[Content for second section]

## Checklist (if applicable)
- [ ] [First actionable item]
- [ ] [Second actionable item]
- [ ] [Third actionable item]

## Notes (optional)
- [Any additional context, warnings, or tips]
```

## Examples of Good Commands

- **Focused**: Does one thing well
- **Actionable**: Clear steps the AI can follow
- **Reusable**: Can be used in multiple contexts
- **Well-structured**: Easy to scan and understand
- **Context-aware**: Reflects this repo (Unity under `Assets/`, Next.js under `LLM Test Integration/`)

## After Creation

Remind the user that:
- The command will be available immediately when typing `/`
- They can edit the `.md` file anytime to update the command
- Parameters can be passed after the command name (e.g., `/new-command with additional context`)
- Team commands can be created in the Cursor Dashboard for sharing across the team
