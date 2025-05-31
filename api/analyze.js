export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { title, content, studentGrade, reportTopic } = req.body;

    // 入力検証
    if (!title || !content || content.length < 100) {
      return res.status(400).json({ 
        error: 'タイトルとレポート内容（100文字以上）を入力してください' 
      });
    }

    // Gemini API呼び出し
    const prompt = `
あなたは社会科教育の専門家として、文部科学省の学習指導要領に基づいてレポートを分析し、学習者の実力レベルを判定してください。

【分析対象レポート】
タイトル: ${title}
内容: ${content}

【参考情報】
実際の学年: ${studentGrade || '不明'}
テーマ分野: ${reportTopic || '不明'}

【分析指示】
1. レベル判定基準：
   小学校3-4年レベル：基本的な事実の記述、身近な地域への関心
   小学校5-6年レベル：歴史的事象の理解、日本の国土・産業への理解、簡単な比較・関係づけ
   中学校1年レベル：地理的分野の基礎、世界と日本の地域的特色の理解
   中学校2年レベル：歴史的分野の理解、時代の特色と変化の把握
   中学校3年レベル：公民的分野の理解、現代社会の課題への関心、多角的思考
   高校1年レベル：地理総合・歴史総合の理解、グローバルな視点
   高校2-3年レベル：探究的学習、高度な考察力、論理的構成

2. 評価観点（各100点満点）：
   - 知識・技能：基礎知識、資料活用、情報収集
   - 思考・判断・表現：論理構成、考察力、表現力
   - 主体的な学習態度：関心・意欲、課題設定、探究心

【回答形式】
## 🎯 実力レベル判定
**判定結果: 〇〇年生相当レベル**

## 📊 詳細評価
- 知識・技能: XX/100点
- 思考・判断・表現: XX/100点  
- 主体的な学習態度: XX/100点
- **総合評価: XX/100点**

## ✨ 優秀な点
[具体的な良い点を3-4点]

## 📈 改善できる点
### 知識・技能面
[具体的な改善点と修正提案]

### 思考・判断・表現面
[具体的な改善点と修正提案]

### 学習態度面
[具体的な改善点と修正提案]

## 🚀 次のレベルへのステップアップ方法
### 短期目標（今すぐできること）
1. [具体的な改善アクション]
2. [具体的な改善アクション]  
3. [具体的な改善アクション]

### 中期目標（次の段階を目指すために）
1. [発展的な学習提案]
2. [発展的な学習提案]
3. [発展的な学習提案]

※判定は内容の質・深さ・表現力を総合的に評価し、学年に関係なく客観的に行ってください。
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      throw new Error('Gemini API error');
    }

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!analysis) {
      throw new Error('No analysis result');
    }

    res.json({
      success: true,
      analysis: analysis
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'AI分析エラー',
      message: 'しばらく時間をおいて再度お試しください'
    });
  }
}
