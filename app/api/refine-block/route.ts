import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { blockHtml, blockLabel, instruction, pageType, fullHtml } = await req.json() as {
      blockHtml: string;
      blockLabel: string;
      instruction: string;
      pageType: string;
      fullHtml: string;
    };

    if (!instruction) {
      return NextResponse.json({ error: '修正内容を入力してください' }, { status: 400 });
    }

    if (!blockHtml) {
      return NextResponse.json({ error: 'ブロックHTMLが必要です' }, { status: 400 });
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: `あなたはLP（ランディングページ）のセクション修正を行う専門家です。
ユーザーから特定セクションのHTMLと修正指示が与えられます。
以下のルールに従ってください：
- 指示された箇所のみ変更し、それ以外のHTML構造・クラス名・スタイリングはそのまま維持してください
- 修正後のセクションHTMLのみを返してください（説明や前置きは不要）
- HTMLタグの構造を壊さないでください
- \`===HTML_START===\` と \`===HTML_END===\` で囲んで返してください`,
      messages: [
        {
          role: 'user',
          content: `以下は${pageType}のLPの「${blockLabel}」セクションです。このセクションを修正してください。

===修正対象セクションHTML===
${blockHtml}
===ここまで===

===ページ全体HTML（参考・コンテキスト用、修正しないでください）===
${fullHtml}
===ここまで===

===修正指示===
${instruction}
===ここまで===

修正後のセクションHTMLのみを \`===HTML_START===\` と \`===HTML_END===\` で囲んで返してください。`,
        },
      ],
    });

    const fullText = response.content[0].type === 'text' ? response.content[0].text : '';

    const htmlMatch = fullText.match(/===HTML_START===([\s\S]*?)===HTML_END===/);
    const html = htmlMatch ? htmlMatch[1].trim() : '';

    if (html) {
      return NextResponse.json({ html });
    }

    return NextResponse.json({ error: 'HTMLの生成に失敗しました' }, { status: 500 });
  } catch (error) {
    console.error('Refine block API error:', error);
    return NextResponse.json({ error: 'セクションの修正に失敗しました' }, { status: 500 });
  }
}
