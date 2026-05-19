export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GEMINI_API_KEY on the server.' });
  }

  try {
    const { message = '', image = null, todayStats = {} } = req.body || {};

    if (!message && !image) {
      return res.status(400).json({ error: 'Missing message or image.' });
    }

    const instruction = `אתה משה, מאמן תזונה וכושר בעברית. ענה קצר, פרקטי, תומך ולא שיפוטי.
אם המשתמש מתאר אוכל או שולח תמונת אוכל, הערך קלוריות ומאקרו בצורה סבירה.
החזר תמיד JSON תקין בלבד ללא Markdown ובדיוק בפורמט:
{"msg":"תשובה למשתמש", "calories":0, "protein":0, "carbs":0, "fats":0, "isFood":false}
אם אין אוכל, השאר מספרים 0 ו-isFood false.
נתוני היום עד עכשיו: ${JSON.stringify(todayStats)}.`;

    const parts = [{ text: instruction + '\n\nהודעת המשתמש: ' + String(message) }];
    if (image) {
      parts.push({ inlineData: { mimeType: 'image/jpeg', data: image } });
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.25
          }
        })
      }
    );

    const geminiData = await geminiResponse.json();

    if (!geminiResponse.ok || geminiData.error) {
      return res.status(geminiResponse.status || 500).json({
        error: geminiData.error?.message || 'Gemini API error'
      });
    }

    const raw = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = parseAiJson(raw);

    return res.status(200).json(normalizeAiResult(parsed));
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

function parseAiJson(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    const match = String(raw).match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    return { msg: raw || 'לא הצלחתי להבין את התשובה.', calories: 0, protein: 0, carbs: 0, fats: 0, isFood: false };
  }
}

function normalizeAiResult(result) {
  return {
    msg: String(result.msg || 'בוצע.'),
    calories: Number(result.calories || 0),
    protein: Number(result.protein || 0),
    carbs: Number(result.carbs || 0),
    fats: Number(result.fats || 0),
    isFood: Boolean(result.isFood || Number(result.calories || 0) > 0)
  };
}
