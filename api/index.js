export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userInput } = req.body;

  if (!userInput) {
    return res.status(400).json({ error: 'Missing userInput' });
  }

  const systemPrompt = `TASK
Calculate the true profit margin for the product or service described, based on the selling price and full cost breakdown provided. Identify whether the margin is healthy for the stated industry, and give three specific, actionable recommendations to protect or improve it.

CONTEXT
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

CONSTRAINTS
- Return ONLY valid JSON, no preamble, no markdown formatting, no explanation outside the JSON object
- Every dollar figure must be calculated from the user's actual inputs, never invented or estimated without basis
- If a cost is ambiguous (e.g. "some shipping"), make a reasonable assumption and note it in the verdict rather than skipping it
- margin_health must be exactly one of: "good", "warn", or "bad" — no other values
- confidence must be exactly one of: "High", "Medium", or "Low"
- Recommendations must be specific to the numbers given, not generic pricing advice. Reference actual cost line items where relevant
- Keep the verdict to one sentence, direct, no hedging
- Do not recommend raising prices as the only fix. At least one recommendation should address cost reduction where the input data supports it

OUTPUT FORMAT
Return ONLY valid JSON in this exact format, with no text before or after it:
{
  "margin_percent": "e.g. 38%",
  "profit_per_unit": "e.g. $57.00",
  "benchmark_comparison": "e.g. Below average",
  "margin_health": "good",
  "verdict": "one sentence, direct, tells them if this margin is sustainable",
  "cost_breakdown": [
    {"label": "Materials", "amount": "$40.00"},
    {"label": "Labor", "amount": "$75.00"},
    {"label": "Platform Fees", "amount": "$4.50"}
  ],
  "recommendation_1": {"action": "short headline", "detail": "one to two sentences, specific"},
  "recommendation_2": {"action": "short headline", "detail": "one to two sentences, specific"},
  "recommendation_3": {"action": "short headline", "detail": "one to two sentences, specific"},
  "confidence": "High"
}`;

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
        max_tokens: 1500,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userInput }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return res.status(500).json({ error: 'Failed to calculate margin. Please try again.' });
    }

    const data = await response.json();
    const rawText = data.content?.[0]?.text || '';

    let cleanText = rawText.trim();
    cleanText = cleanText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');

    let result;
    try {
      result = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr, 'Raw text:', rawText);
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
