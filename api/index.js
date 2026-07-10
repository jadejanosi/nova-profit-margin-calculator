// ============================================================
// NOVA STARTER TEMPLATE — CALCULATOR / PLANNER TOOL
// ============================================================
// This serverless function calls the Claude API and returns
// calculated figures, projections, or a structured plan
// based on numerical or specific inputs from the user.
//
// WHAT TO CHANGE:
// 1. The system prompt — especially the calculation logic
// 2. The JSON keys to match your output structure
// 3. The temperature (0.2-0.4 for consistent calculations)
// ============================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CUSTOMIZE: match to what your frontend sends
  const { userInputs } = req.body;

  if (!userInputs) {
    return res.status(400).json({ error: 'Inputs are required' });
  }

  // ============================================================
  // SYSTEM PROMPT — CUSTOMIZE THIS FOR YOUR TOOL
  // ============================================================
  const systemPrompt = `
[ROLE]
You are a [specific expert type] who specializes in helping 
[target audience] [calculate / plan / project] [what the 
tool does] accurately and realistically.

[TASK]
Based on the inputs the user provides, calculate [what you 
are calculating] and build a [plan / breakdown / projection] 
that is realistic given their specific situation.

[CONTEXT]
The user is a [describe your typical user]. They want 
[honest / accurate / realistic] outputs — not optimistic 
projections that set them up for disappointment. If their 
inputs suggest unrealistic expectations, flag it directly.

[CONSTRAINTS]
Use realistic benchmarks for [your niche]: [list key 
benchmark ranges you want Claude to use].
Do not use overly optimistic figures.
If the goal is unrealistic with the inputs provided, say 
so directly and give a revised realistic figure.
Keep total response under 500 words.
Never suggest [things you want to avoid recommending].

[FORMAT]
Return ONLY a valid JSON object with these exact keys.
No markdown. No explanation. No text outside the JSON.

{
  "summary": "[two sentences summarizing what the calculation shows]",
  "primary_figure": "[the main number or output they came for]",
  "primary_label": "[what that number represents]",
  "breakdown": [
    { "label": "[line item label]", "value": "[figure or description]" },
    { "label": "[line item label]", "value": "[figure or description]" },
    { "label": "[line item label]", "value": "[figure or description]" }
  ],
  "timeline": "[realistic timeframe for achieving the goal]",
  "key_assumption": "[the most important assumption this calculation relies on]",
  "reality_check": "[honest note — if anything about their inputs suggests unrealistic expectations, flag it here. If everything looks realistic, write 'Your inputs look realistic for this goal.']",
  "top_action": "[the single most important thing to do right now to achieve this outcome]"
}
`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: 'user', content: userInputs }],
        // CUSTOMIZE: low temperature for consistent calculations
        // Recommended: 0.2 to 0.4
        temperature: 0.3
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: data.error?.message || 'Claude API error'
      });
    }

    const raw = data.content[0].text.trim();
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    return res.status(200).json(result);

  } catch (err) {
    return res.status(500).json({
      error: 'Something went wrong. Please try again.'
    });
  }
}
