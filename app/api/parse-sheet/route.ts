import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json() as { text: string };

    if (!text?.trim()) {
      return NextResponse.json({ error: 'テキストを入力してください' }, { status: 400 });
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `あなたはローンチ設計シートの内容を解析し、LPコンセプトシートのフィールドに振り分けるアシスタントです。
入力はプレーンテキスト、HTML、Markdown、表形式など様々なフォーマットで来ます。HTMLの場合はタグを除去して内容を抽出してください。
入力されたテキストから情報を抽出し、JSON形式で返してください。
該当する情報がない場合は空文字にしてください。
必ず有効なJSONのみを返してください（説明文は不要）。`,
      messages: [{
        role: 'user',
        content: `以下のローンチ設計シート・コンセプトシートの内容を解析し、各フィールドに振り分けてください。

入力テキスト:
"""
${text}
"""

以下のJSON形式で返してください:
{
  "targetAudience": "ターゲット（誰に向けて）",
  "painPoints": "悩み・痛み",
  "desiredFuture": "理想の未来・得られる成果",
  "differentiator": "差別化ポイント・強み",
  "socialProof": "実績・お客様の声",
  "freeOfferName": "無料オファー名（あれば）",
  "freeOfferContent": "無料オファーの内容（あれば）",
  "registrationMethod": "登録先（LINE/メルマガ等）",
  "seminarTitle": "セミナータイトル（あれば）",
  "seminarDetails": "セミナー詳細（あれば）",
  "speakerProfile": "講師プロフィール（あれば）",
  "consultationType": "相談形式（あれば）",
  "consultationFlow": "相談の流れ（あれば）",
  "offerName": "講座名・商品名",
  "offerDescription": "講座の目的とゴール",
  "curriculum": "カリキュラム・ステップ内容",
  "format": "受講形式",
  "regularPrice": "通常価格",
  "price": "今回の価格",
  "bonuses": "特典",
  "guarantee": "保証",
  "deadline": "募集期限・限定性"
}`,
      }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON from response (might be wrapped in markdown code block)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: '解析に失敗しました' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ fields: parsed });
  } catch (error) {
    console.error('Parse sheet error:', error);
    return NextResponse.json({ error: '解析に失敗しました' }, { status: 500 });
  }
}
