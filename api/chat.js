export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Sirf POST requests allowed hain' });

  try {
    const userMessage = req.body?.message;
    
    // Check 1: Agar app se message JSON me nahi aaya
    if (!userMessage) {
      return res.status(400).json({ error: "App se 'message' field nahi mili. JSON check karo." });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: userMessage }]
      })
    });

    const data = await response.json();

    // Check 2: Agar OpenRouter ne koi error feka (jaise limit cross ya API key galat)
    if (data.error) {
      return res.status(400).json({ 
        error: "OpenRouter Error", 
        message: data.error.message 
      });
    }

    // Success response
    return res.status(200).json({ reply: data.choices[0].message.content });
    
  } catch (error) {
    return res.status(500).json({ error: "Server Code Error", details: error.message });
  }
}
