# NOVA Starter Template — Calculator / Planner Tool

Use this template when your tool takes numerical or specific inputs and returns calculated figures, projections, or a structured plan.

## Best for
- Revenue goal calculators
- Budget planners
- Launch timeline planners
- Ad spend calculators
- Macro or nutrition calculators
- Savings goal calculators
- Any tool where the user enters numbers and gets a calculated plan back

## What to customize

### 1. System prompt (api/index.js)
- ROLE: your calculation or planning expert identity
- TASK: what you are calculating and what benchmarks to use
- CONTEXT: who your user is and what level of honesty they need
- CONSTRAINTS: the realistic benchmark ranges for your niche — this is critical
- FORMAT: the JSON keys for your specific output structure

### 2. Input fields (public/index.html)
- Update field labels, hints, and placeholders
- Use type="number" for numerical inputs
- Use the input-prefix-wrap pattern for currency ($) or unit (%) prefixes
- Use select dropdowns for fixed options like time frames
- Add or remove fields as needed

### 3. Build the input string
Update the pendingInputs string in handleSubmit() to include all your fields and match what your system prompt expects.

### 4. Brand tokens (public/index.html)
Update the :root CSS variables from your Brand Token Cheatsheet.

### 5. Content
- Header: tag, title, subtitle, credibility signal
- Email gate copy
- Loading text
- Footer: brand name and URL

### 6. Email capture
Uncomment and implement the captureEmail() call in handleGate().
See Module 4 Lesson 4.5 for the full implementation.

## Deploy to Vercel
1. Push to GitHub
2. Import to Vercel
3. Add environment variable: ANTHROPIC_API_KEY
4. Deploy

## Temperature
Recommended: 0.2 to 0.4 for consistent, reliable calculations
