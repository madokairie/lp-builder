import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic();

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { currentHtml, currentText, messages, pageType } = await req.json() as {
      currentHtml: string;
      currentText: string;
      messages: Message[];
      pageType: string;
    };

    const lastUserMessage = messages[messages.length - 1]?.content;
    if (!lastUserMessage) {
      return NextResponse.json({ error: 'メッセージを入力してください' }, { status: 400 });
    }

    // Build conversation history for context
    const conversationHistory: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `以下は現在の${pageType}のLPです。このあとユーザーから修正リクエストが来るので対応してください。

===現在のHTML===
${currentHtml}

===現在のテキスト===
${currentText}
===ここまで===

修正リクエストに応じて、修正後のHTML全文とテキスト全文を返してください。
- HTMLは \`===HTML_START===\` と \`===HTML_END===\` で囲む
- テキストは \`===TEXT_START===\` と \`===TEXT_END===\` で囲む
- 修正を頼まれた箇所だけ変更し、他は維持してください
- 修正箇所の説明は不要です。修正後の全文のみ返してください`,
      },
      {
        role: 'assistant',
        content: 'はい、LPの内容を確認しました。修正リクエストをお聞かせください。',
      },
    ];

    // Add conversation history (skip the initial setup messages)
    for (const msg of messages) {
      conversationHistory.push({
        role: msg.role,
        content: msg.content,
      });
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16384,
      system: `あなたはLP（ランディングページ）の修正を行うコピーライターです。
ユーザーのリクエストに応じてLPの内容を修正します。
修正を頼まれた箇所だけを変更し、それ以外の構成やデザインは維持してください。
必ずHTML全文とテキスト全文の両方を返してください。`,
      messages: conversationHistory,
    });

    const fullText = response.content[0].type === 'text' ? response.content[0].text : '';

    const htmlMatch = fullText.match(/===HTML_START===([\s\S]*?)===HTML_END===/);
    const textMatch = fullText.match(/===TEXT_START===([\s\S]*?)===TEXT_END===/);

    const html = htmlMatch ? htmlMatch[1].trim() : '';
    const text = textMatch ? textMatch[1].trim() : '';

    // If we got updated content, return it. Otherwise return just the message.
    if (html || text) {
      return NextResponse.json({
        html,
        text,
        message: '修正しました',
        hasUpdate: true,
      });
    }

    // AI might have responded conversationally (asking for clarification etc)
    return NextResponse.json({
      html: '',
      text: '',
      message: fullText,
      hasUpdate: false,
    });
  } catch (error) {
    console.error('Refine API error:', error);
    return NextResponse.json({ error: '修正に失敗しました' }, { status: 500 });
  }
}
