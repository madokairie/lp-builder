import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { ConceptSheet, PageType, PAGE_TYPE_META, ToneType, TONE_META } from '@/app/lib/types';

const client = new Anthropic();

const PAGE_STRUCTURES: Record<PageType, string> = {
  sales: `## セールスページ構成（この順番で必ず作成すること）

1. **ファーストビュー** — 講座名＋キャッチコピー＋サブタイトル＋申込ボタン＋「※定員になり次第〜」等の補足。ここでは価格を出さない
2. **共感導入** — ターゲットが心の中で感じている悩みを「〜〜」と引用形式で3つほど描写。「そんな想いを抱えている〇〇の方へ」と寄り添い、今やっていることを否定せず「その先の未来」として提示する
3. **理想の未来提示** — 「あなたの経験が〇〇になる」形式の見出し。箇条書き3〜5個で具体的な変化を提示（収入・働き方・役割の変化）。最後に3つのポイントを①②③で要約
4. **講座の紹介** — 講座の目的・ゴール・形式の説明。何を学び、何が手に入るのかを丁寧に。ポジショニングを明確にする
5. **カリキュラム紹介** — ユーザー入力の内容をそのまま忠実に使い、各ステップに小見出し＋説明文をつける。入力にないステップを追加しない
6. **こんな方におすすめ** — ✔形式のチェックリストで対象者を7〜8個。最後に背中を押す1〜2文。「こんな方には向きません」は入れない
7. **受講の決め手（特典・価格・限定性）** — ここで初めて価格を提示。通常価格→今回の価格の順で。特典を入力された内容そのまま忠実にリスト形式で紹介。限定性・締切も明記
8. **決済フォームエリア** — 価格表示＋申込ボタン＋注意事項
9. **よくある質問（FAQ）** — 入力があればそのまま使う。なければターゲットに合わせたQ&Aを5個程度
10. **お客様の声・実績紹介** — 入力された実績・お客様の声を忠実に使ってカード形式で紹介。入力がなければこのセクション自体を省略（絶対に架空の声を作らない）
11. **申込方法と行動喚起** — 感情に寄り添う見出し＋迷っている人への共感メッセージ＋CTAボタン＋締切リマインド`,

  optin: `## オプトインページ構成
1. **キャッチコピー** — 無料オファーの魅力を一文で。「〜な方へ」で始めると効果的
2. **サブヘッドライン** — 具体的に何がもらえるか
3. **こんな悩みありませんか？** — ターゲットの悩みを3〜5個チェックリスト形式で
4. **無料オファーの内容** — 何がもらえるか（PDF、動画、テンプレ等）を具体的に
5. **ベネフィット3〜5個** — これを手に入れると何が変わるか
6. **登録フォーム＋CTAボタン** — 名前・メールアドレス（最小限）。ボタンは「今すぐ無料で受け取る」等
7. **簡単な自己紹介** — 信頼性の担保（実績を含めて2〜3行）
8. **注意書き** — プライバシー保護、いつでも解除可能`,

  seminar: `## セミナー募集ページ構成
1. **キャッチコピー** — セミナーのテーマ・得られるもの。「〜が学べる◯◯セミナー」
2. **こんな悩みありませんか？** — ターゲットの問題を列挙
3. **このセミナーで得られること** — 3〜5個の学びポイント
4. **セミナー後のあなた（ビフォーアフター）** — 参加前→参加後の変化
5. **セミナー詳細** — 日時、場所（オンライン等）、所要時間
6. **講師紹介** — 実績・経歴・想い
7. **過去の参加者の声** — 入力された声のみ使用。なければセクション省略
8. **参加特典** — セミナー参加で受け取れるもの
9. **申込フォーム＋CTA** — 名前・メール・希望日程
10. **よくある質問** — FAQ 3〜5個
11. **最後のメッセージ** — 背中を押すひと言`,

  consultation: `## 個別相談申込ページ構成
1. **キャッチコピー** — 相談で得られる価値。「あなたの◯◯を一緒に整理します」
2. **こんなお悩みありませんか？** — ターゲットの問題を列挙
3. **相談で得られること** — 具体的なアウトプット（方向性、アクションプラン等）
4. **相談の流れ** — Step1〜3で安心感を
5. **相談後のあなた** — 参加前→参加後の変化
6. **担当者紹介** — 実績・専門性・想い
7. **相談者の声** — 入力された声のみ使用。なければセクション省略
8. **相談詳細** — 時間、方法（Zoom等）、費用（無料の場合も明記）
9. **申込フォーム** — 名前・メール・希望日時・簡単な現状
10. **限定性** — 月◯名限定等
11. **よくある質問** — FAQ 3〜5個`,

  vsl: `## VSLページ構成
1. **ヘッドライン** — 動画を再生したくなるキャッチコピー
2. **サブヘッドライン** — 具体的にどんな内容の動画か
3. **動画埋め込みエリア** — メインのセールス動画のプレースホルダー
4. **動画の下にサブコピー** — 動画を見終わった人向けのまとめと行動喚起
5. **CTA（申込ボタン）** — 動画の下に大きく配置
6. **ベネフィットまとめ** — 箇条書きで補足
7. **お客様の声** — 入力された声のみ使用。なければセクション省略
8. **CTA（2つ目）** — ページ下部にも配置`,

  entry_form: `## エントリーページ構成
1. **キャッチコピー** — エントリーの魅力。「本気で◯◯したい方へ」
2. **プログラムの概要** — 何に応募するのか、なぜ選考制なのか
3. **対象者** — どんな人に来てほしいか（こんな方を歓迎します）
4. **プログラムで得られるもの** — 参加するとどうなれるか
5. **選考プロセス** — エントリー後の流れ（Step1〜3）
6. **エントリーフォーム** — 名前・メール・志望動機・現在の状況
7. **よくある質問** — FAQ 3〜5個`,

  thankyou: `## サンクスページ構成
1. **お礼メッセージ** — 申込・登録への感謝。温かい言葉で
2. **次のステップ** — メール確認、日程調整等の具体的な案内
3. **追加アクション** — LINE登録、SNSフォロー等（やってほしいことを1つだけ）
4. **期待を高めるメッセージ** — これから届くもの、得られるもの、ワクワク感を`,
};

export async function POST(req: NextRequest) {
  try {
    const {
      concept, pageType, tone, rawMaterial,
      ctaText, faq, photoInstructions, excludeSections,
      brandVoice, referenceLp, otherPages,
    } = await req.json() as {
      concept: ConceptSheet;
      pageType: PageType;
      tone: ToneType;
      rawMaterial?: string;
      ctaText?: string;
      faq?: string;
      photoInstructions?: string;
      excludeSections?: string[];
      brandVoice?: string;
      referenceLp?: string;
      otherPages?: { pageType: string; text: string }[];
    };

    const pageMeta = PAGE_TYPE_META[pageType];
    const toneMeta = TONE_META[tone];
    const structure = PAGE_STRUCTURES[pageType];

    // Build concept text from all non-empty fields
    const conceptParts = [
      // Common
      concept.targetAudience && `【ターゲット】\n${concept.targetAudience}`,
      concept.painPoints && `【悩み・痛み】\n${concept.painPoints}`,
      concept.desiredFuture && `【理想の未来・得られる成果】\n${concept.desiredFuture}`,
      concept.differentiator && `【差別化ポイント】\n${concept.differentiator}`,
      concept.socialProof && `【実績・お客様の声】※この内容をそのまま忠実に使うこと。改変・要約禁止\n${concept.socialProof}`,
      // Optin
      concept.freeOfferName && `【無料オファー名】\n${concept.freeOfferName}`,
      concept.freeOfferContent && `【無料オファー内容】\n${concept.freeOfferContent}`,
      concept.registrationMethod && `【登録先】\n${concept.registrationMethod}`,
      // Seminar
      concept.seminarTitle && `【セミナータイトル】\n${concept.seminarTitle}`,
      concept.seminarDetails && `【セミナー詳細】\n${concept.seminarDetails}`,
      concept.speakerProfile && `【講師プロフィール】\n${concept.speakerProfile}`,
      // Consultation
      concept.consultationType && `【相談形式・内容】\n${concept.consultationType}`,
      concept.consultationFlow && `【相談の流れ】\n${concept.consultationFlow}`,
      // Sales / Lecture
      concept.offerName && `【講座名（商品名）】\n${concept.offerName}`,
      concept.offerDescription && `【講座の目的とゴール】\n${concept.offerDescription}`,
      concept.curriculum && `【カリキュラム】※この内容をそのまま忠実に使うこと。ステップの追加・削除禁止\n${concept.curriculum}`,
      concept.format && `【受講形式】\n${concept.format}`,
      concept.regularPrice && `【通常価格】※この金額をそのまま使うこと\n${concept.regularPrice}`,
      concept.price && `【今回の価格】※この金額をそのまま使うこと\n${concept.price}`,
      concept.bonuses && `【特典】※この内容をそのまま忠実にリスト化すること。追加・省略禁止\n${concept.bonuses}`,
      concept.guarantee && `【保証】\n${concept.guarantee}`,
      concept.deadline && `【募集期限・限定性】\n${concept.deadline}`,
    ].filter(Boolean).join('\n\n');

    const hasRawMaterial = rawMaterial && rawMaterial.trim().length > 0;
    const hasBrandVoice = brandVoice && brandVoice.trim().length > 0;
    const hasReferenceLp = referenceLp && referenceLp.trim().length > 0;
    const hasCtaText = ctaText && ctaText.trim().length > 0;
    const hasFaq = faq && faq.trim().length > 0;
    const hasPhotoInstructions = photoInstructions && photoInstructions.trim().length > 0;
    const hasOtherPages = otherPages && otherPages.length > 0;
    const excludedSections = excludeSections && excludeSections.length > 0 ? excludeSections : [];

    const prompt = `以下の情報に基づいて、「${pageMeta.label}」のLPを作成してください。
${hasRawMaterial ? `
## ★ 素材テキスト（最優先で使用すること）
以下はユーザーが用意した原稿・メモ・構成案です。この内容を最も重要な情報源として扱い、見出し・本文・構成・具体的な文言をできる限りそのまま活かしてLP化してください。
素材にある情報は変更・省略・要約せず、忠実にHTMLに組み込むこと。

"""
${rawMaterial.trim()}
"""
` : ''}
## コンセプトシートの情報${hasRawMaterial ? '（素材テキストを補完する参考情報）' : ''}
${conceptParts || '（詳細情報なし）'}
${hasCtaText ? `
## CTAボタンの文言（この文言をすべてのCTAボタンに使用すること）
「${ctaText.trim()}」
` : ''}${hasFaq ? `
## FAQ（以下のQ&Aをそのまま忠実に使用すること。追加・改変禁止）
${faq.trim()}
` : ''}${hasPhotoInstructions ? `
## 写真・画像の配置指示
以下の場所にCSSプレースホルダー（背景色＋テキスト「Photo」等）を配置すること:
${photoInstructions.trim()}
` : ''}${excludedSections.length > 0 ? `
## 除外セクション（以下のセクションは生成しないこと）
${excludedSections.join(', ')}
` : ''}${hasOtherPages ? `
## 同プロジェクトの他ページ（一貫性を保つための参考情報。トーン・表現を揃えること）
${otherPages.map(p => `--- ${PAGE_TYPE_META[p.pageType as PageType]?.label || p.pageType} ---\n${p.text}`).join('\n\n')}
` : ''}
## ページタイプ
${pageMeta.label}: ${pageMeta.description}

## 文体・トーン
${toneMeta.label}: ${toneMeta.description}
${hasBrandVoice ? `
## ブランドボイス（この文体・口調に合わせて書くこと）
以下はユーザーの過去の文章サンプルです。語り口・言い回し・リズムをできる限り再現すること:
"""
${brandVoice.trim().substring(0, 3000)}
"""
` : ''}${hasReferenceLp ? `
## 参考LP（レイアウト・トーン・構成感の参考にすること）
"""
${referenceLp.trim().substring(0, 5000)}
"""
` : ''}
## ページ構成（この順番で作成。除外指定されたセクションは飛ばす）
${structure}

---

## 出力ルール

### 出力1: HTML版
完全なHTMLファイルとして出力してください。以下の要件を満たすこと:

**基本構造:**
- \`<!DOCTYPE html>\` から始まる完全なHTML
- \`<style>\` タグでCSSを記述（外部ファイル参照なし、ただしCDNアイコンは可）
- レスポンシブ対応（max-width: 720px、margin: 0 auto）
- Google Fontsの \`Noto Sans JP\` を読み込んで使用
- Lucide Icons CDN を読み込んで使用: \`<script src="https://unpkg.com/lucide@latest"></script>\` + 初期化 \`<script>lucide.createIcons();</script>\`

**配色・タイポグラフィ:**
- 配色: メイン背景 #FFFFFF、セクション背景交互に #F8F7F4、アクセント #C8956C、テキスト #333333、サブテキスト #666666、見出し #1A1A1A
- CTAボタン: 背景 #C8956C、テキスト白、角丸 8px、padding 18px 48px、font-size 18px、ホバーで #B5845E
- ファーストビューは背景 #F8F7F4 で広め（padding: 80px 24px）、キャッチコピーは大きく
- セクション間は padding: 60px 24px
- 見出しは大きく太く（font-size: 28px、font-weight: 700）
- 本文は font-size: 16px、line-height: 1.9

**ビジュアル要素（重要 — 文字ばかりにしない）:**
- 各セクションの見出し横またはアイコンとして Lucide Icons を使う（例: \`<i data-lucide="target"></i>\` ターゲット、\`<i data-lucide="sparkles"></i>\` 特典、\`<i data-lucide="graduation-cap"></i>\` カリキュラム、\`<i data-lucide="message-circle"></i>\` FAQ、\`<i data-lucide="award"></i>\` 実績）
- カリキュラムはタイムライン風デザイン（左に番号バッジ＋縦線で接続、右にタイトル＋説明文）
- 特典リストは2カラムグリッド or アイコン付きカードで表示（各特典に \`<i data-lucide="gift"></i>\` 等のアイコン）
- 「こんな方におすすめ」はチェックマーク付きカード or 背景付きリスト
- メリット・ベネフィットは番号付きカードグリッド（2列 or 3列）、各カードに関連アイコン
- お客様の声は写真プレースホルダー（CSSで丸い背景色の頭文字アバター）＋カード形式
- ビフォーアフターは左右比較 or 矢印付きレイアウト（CSSの矢印 or SVG）
- 価格セクションは目立つ価格カード（旧価格に取り消し線、新価格を大きく）
- セクション間に装飾的な区切り（CSSの波線やアクセントカラーの細いライン）
- FAQ は開閉アコーディオン風（CSSの\`details/summary\`タグ推奨）
- 数字を強調するときは大きなフォントサイズ＋アクセントカラー

**禁止:**
- 外部画像URL（img src）は使わない。写真が必要な箇所はCSSプレースホルダーで代替
- 申込ボタンのリンク先は「#」でOK
- 全文日本語

HTMLは \`===HTML_START===\` と \`===HTML_END===\` で囲んでください。

### 出力2: テキスト版
HTMLとは別に、コピーライティングのテキストのみを出力してください:
- 各パートを【見出し】で区切る
- 見出し、本文、箇条書き、ボタン文言を含む
- WordPress等に貼り付けて使える形式
- セクション区切りは「---」で

テキストは \`===TEXT_START===\` と \`===TEXT_END===\` で囲んでください。`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16384,
      system: `あなたはプロダクトローンチ専門のLP（ランディングページ）コピーライターです。
日本のオンラインビジネス・コーチング・講座ビジネス市場に精通しています。

## 最重要ルール：情報の忠実性

【絶対禁止事項】
- ユーザーが入力していない情報を勝手に追加・捏造しないこと
- 架空のお客様の声を作らないこと（「田中さん（仮名）」等は絶対NG）
- 入力された価格と異なる金額を書かないこと
- 入力された特典リストを勝手に減らしたり別のものに変えないこと
- 入力されたカリキュラムのステップ数や内容を変えないこと
- 存在しない返金保証を追加しないこと
- 「〇〇名が成約」等の架空の数字を入れないこと

【データの扱い方】
- 入力された情報は「素材」ではなく「事実」。忠実に使うこと
- 価格・特典・カリキュラム・お客様の声は入力内容をそのまま反映
- 情報が不足しているセクションは、セクション自体を省略するか「※後日追加」と表記
- 言い回しの調整やコピーライティング的な演出は歓迎。ただし事実を変えない

## 執筆トーン

- 温かく寄り添い、読者の今の頑張りを肯定する口調
- 「今やっていることを否定しない」。その先の選択肢として提案する
- 恐怖訴求・煽りは使わない（「このまま放置すると…」「AIに仕事を奪われる」等は禁止）
- 「時給◯円」等のネガティブな数字で煽らない
- 押し売りではなく、読者が自分で「必要だ」と感じられる構成にする
- 信頼と共感ベースで書く。上から目線にならない`,
      messages: [{ role: 'user', content: prompt }],
    });

    const fullText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse HTML
    const htmlMatch = fullText.match(/===HTML_START===([\s\S]*?)===HTML_END===/);
    const html = htmlMatch ? htmlMatch[1].trim() : '';

    // Parse Text
    const textMatch = fullText.match(/===TEXT_START===([\s\S]*?)===TEXT_END===/);
    const text = textMatch ? textMatch[1].trim() : '';

    if (!html && !text) {
      return NextResponse.json({ error: 'LP生成に失敗しました。再試行してください。' }, { status: 500 });
    }

    return NextResponse.json({ html, text });
  } catch (error) {
    console.error('Generate API error:', error);
    const message = error instanceof Error && error.message.includes('API key')
      ? 'APIキーが設定されていません。.env.localにANTHROPIC_API_KEYを設定してください。'
      : 'LP生成に失敗しました。しばらく待ってから再試行してください。';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
