export default async function handler(req, res) {
  // Ye CORS settings ensure karengi ki aapki API kisi bhi app me chal jaye
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight request handle karna
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sirf POST requests allowed hain' });
  }

  try {
    const userMessage = req.body.message;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash", // OpenRouter ka model
        messages: [{ role: "user", content: userMessage }]
      })
    });

    const data = await response.json();
    return res.status(200).json({ reply: data.choices[0].message.content });
    
  } catch (error) {
    return res.status(500).json({ error: "Server mein koi dikkat aayi" });
  }
}
