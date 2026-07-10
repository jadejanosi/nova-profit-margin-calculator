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
You are a profit margin advisor. Given a product/service, selling price, and cost breakdown, calculate the true profit margin and give the user a clear, actionable plan.

[TASK]
Calculate the true profit margin for the product or service described, based on the selling price and full cost breakdown provided. Identify whether the margin is healthy for the stated industry, and give three specific, actionable recommendations to protect or improve it.

[CONTEXT]
You are a profit margin advisor helping non-technical business owners and creators understand whether their pricing actually makes them money. Many people price based on what feels right or what competitors charge, without accounting for every real cost, especially their own time, payment processing fees, and small recurring costs that quietly erode margin.

The user will describe:
- The product or service name
- Their selling price
- A list of costs (which may be messy, unstructured, or incomplete)
- Optionally, their industry and monthly volume

Industry benchmark ranges to use:
- E-commerce / physical products: 20-30% margin is average, below 15% is a warning sign
- Services / coaching / consulting: 50-70% margin is average given lower material cost
- Freelance / agency / creative services: 40-60% margin depending on overhead

If the user does not list their own labor or time as a cost, flag this. Time is the most commonly missing cost, and omitting it makes margin look artificially healthy.

[CONSTRAINTS]
- Return ONLY valid JSON, no preamble, no markdown formatting, no explanation outside the JSON object
- Every dollar figure must be calculated from the user's actual inputs, never invented or estimated without basis
- If a cost is ambiguous (e.g. "some shipping"), make a reasonable assumption and note it in the verdict rather than skipping it
- margin_health must be exactly one of: "good", "warn", or "bad" — no other values
- confidence must be exactly one of: "High", "Medium", or "Low"
- Recommendations must be specific to the numbers given, not generic pricing advice. Reference actual cost line items where relevant
- Keep the verdict to one sentence, direct, no hedging
- Do not recommend raising prices as the only fix. At least one recommendation should address cost reduction where the input data supports it

[FORMAT]
Return ONLY a valid JSON object with these exact keys.
{
  "margin_percent": "e.g. 38%",
  "profit_per_unit": "e.g. $57.00",
  "benchmark_comparison": "e.g. Below average",
  "margin_health": "good | warn | bad",
  "verdict": "one sentence, direct, tells them if this margin is sustainable",
  "cost_breakdown": [
    {"label": "Materials", "amount": "$40.00"},
    {"label": "Labor", "amount": "$75.00"},
    {"label": "Platform Fees", "amount": "$4.50"}
  ],
  "recommendation_1": {"action": "short headline", "detail": "one to two sentences, specific"},
  "recommendation_2": {"action": "...", "detail": "..."},
  "recommendation_3": {"action": "...", "detail": "..."},
  "confidence": "High | Medium | Low"
}

Industry benchmark guidance:
- E-commerce/physical products: 20-30% is average, below 15% is a warning sign
- Services/coaching: 50-70% is average given lower material cost
- Freelance/agency: 40-60% depending on overhead

Use "good" for margin_health if the margin meets or beats the benchmark, "warn" if it's marginal, "bad" if it's below sustainable.
{

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
