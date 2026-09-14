export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Sirf POST requests allowed hain' });

  try {
    const userMessage = req.body?.message;
    
    if (!userMessage) {
      return res.status(400).json({ error: "App se 'message' field nahi mili. JSON check karo." });
    }

    // Updated active free models list
    const freeModels = [
      "google/gemini-1.5-flash:free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "deepseek/deepseek-r1-distill-llama-70b:free"
    ];

    let finalReply = null;
    let lastError = null;

    for (const currentModel of freeModels) {
      try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: currentModel,
            messages: [{ role: "user", content: userMessage }]
          })
        });

        const data = await response.json();

        if (!data.error && data.choices && data.choices.length > 0) {
          finalReply = data.choices[0].message.content;
          break;
        } else {
          lastError = data.error?.message || "Unknown API error";
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!finalReply) {
      return res.status(400).json({ 
        error: "All Free Models Failed", 
        message: lastError 
      });
    }

    return res.status(200).json({ reply: finalReply });
    
  } catch (error) {
    return res.status(500).json({ error: "Server Code Error", details: error.message });
  }
}
