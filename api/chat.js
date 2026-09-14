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

    // 1. Sabhi popular FREE models ki list
    const freeModels = [
      "google/gemini-1.5-flash:free",
      "google/gemini-1.5-pro:free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "qwen/qwen-2-7b-instruct:free",
      "mistralai/mistral-7b-instruct:free"
    ];

    let finalReply = null;
    let lastError = null;

    // 2. Loop chala kar ek-ek model check karenge
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

        // 3. Agar error NAHI hai, toh model ka reply le lo aur loop tod do
        if (!data.error && data.choices && data.choices.length > 0) {
          finalReply = data.choices[0].message.content;
          break; // Success mil gaya, ab aage ke models check karne ki zaroorat nahi
        } else {
          // Agar error aaya, toh usko save karo aur agla model try karo
          lastError = data.error?.message || "Unknown API error";
        }
      } catch (err) {
        // Network problem ke liye
        lastError = err.message;
      }
    }

    // 4. Agar saare models fail ho gaye, tabhi app ko error bhejo
    if (!finalReply) {
      return res.status(400).json({ 
        error: "All Free Models Failed", 
        message: lastError 
      });
    }

    // 5. Success response (Jo bhi model chala, uska reply)
    return res.status(200).json({ reply: finalReply });
    
  } catch (error) {
    return res.status(500).json({ error: "Server Code Error", details: error.message });
  }
}
