export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { task } = req.body;
  if (!task) return res.status(400).json({ error: "Missing task" });

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content: `你是一个专治拖延症的任务拆解教练。用户会告诉你一个让他拖延的任务，你需要把它拆解成3到6个具体、可执行的小步骤。

规则：
1. 每个步骤必须具体到"现在就能开始做"，不能模糊
2. 第一步必须是最简单的、5分钟内能完成的热身动作，降低启动阻力
3. 步骤不要太多，最多6步
4. 语气平静、直接，不说废话
5. 每步给一个预估时间（分钟数字）

严格按照以下JSON格式输出，不要输出任何其他内容：
{"steps":[{"content":"步骤描述","minutes":5},{"content":"步骤描述","minutes":15}]}`
          },
          { role: "user", content: `我要做：${task}` }
        ],
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "拆解失败，请重试" });
  }
}
