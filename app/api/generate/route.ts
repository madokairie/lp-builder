import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { ConceptSheet, PageType, PAGE_TYPE_META, ToneType, TONE_META } from '@/app/lib/types';

const client = new Anthropic();

const PAGE_STRUCTURES: Record<PageType, string> = {
  sales: `## セールスページ構成（この順番で必ず作成すること）

【重要ルール】
- 価格は8番目のパートまで絶対に出さないこと
- 優しく、でも頼れる専門家としての口調で書くこと
- 購入を迷っている人の背中を自然に押すように。押し売りにならないこと
- 各パートには【見出し】【本文】【必要であればボタン文言】を含めること

1. **ファーストビュー** — 講座名＋キャッチコピー＋サブタイトル＋申込ボタン＋「まずは詳細をご覧ください」等の補足。ここでは価格を出さない
2. **共感導入（問題提起）** — 過去の自分や受講生が感じていた悩みを具体的に描写し、読者に「私のことだ」と思わせる。その悩みを放置するとどうなるかのリスクも提示する
3. **理想の未来提示（ビフォーアフター）** — このノウハウを取り入れたことでの変化を見せる。受講前→受講後の対比で「こうなれる」というイメージを明確にする
4. **講座の紹介** — 講座の目的・ゴール・形式（動画/PDF等）の説明。何を学び、何が手に入るのかを丁寧に
5. **カリキュラム紹介** — ステップ別に内容を紹介。各ステップで何を学び、何ができるようになるかを具体的に
6. **得られるメリット** — 講座で学ぶことで叶えられる理想の未来を5〜7個。箇条書きで具体的に
7. **こんな方におすすめ / こんな方には向きません** — ターゲットを明確にし、対象でない人も正直に示すことで信頼感を醸成
8. **受講の決め手（特典・価格・限定性）** — ここで初めて価格を提示。通常価格→今回の価格の順で。特典を一つずつ丁寧に紹介。限定性・締切も明記
9. **受講者の声** — 実際の受講者のフィードバックをカード形式で。名前・職業・ビフォーアフター・感想のフォーマットで
10. **よくある質問（FAQ）** — 対象者・サポート体制・内容・返金に関する質問を5〜7個。不安を払拭する
11. **申込方法と行動喚起** — 申込の流れ（Step1〜3）を明記し、CTAボタンを配置。締切を再度リマインド
12. **講師のご挨拶** — 講師としての想い・背景を語り、迷っている人の背中を自然に押すメッセージ。追伸（PS）として最後のひと押し`,

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
7. **過去の参加者の声** — フィードバックをカード形式で
8. **参加特典** — セミナー参加で受け取れるもの
9. **申込フォーム＋CTA** — 名前・メール・希望日程
10. **よくある質問** — FAQ 3〜5個
11. **最後のメッセージ** — 背中を押すひと言`,

  consultation: `## 個別相談申込ページ構成
1. **キャッチコピー** — 相談で得られる価値。「あなたの◯◯を一緒に整理します」
2. **こんなお悩みありませんか？** — ターゲットの問題を列挙
3. **相談で得られること** — 具体的なアウトプット（方向性、アクションプラン等）
4. **相談の流れ** — Step1〜3で安心感を
5. **相談後のあなた（ビフォーアフター）** — 参加前→参加後の変化
6. **担当者紹介** — 実績・専門性・想い
7. **相談者の声** — 実際に相談した方のフィードバック
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
7. **お客様の声** — 補足的な社会的証明
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
    const { concept, pageType, tone } = await req.json() as {
      concept: ConceptSheet;
      pageType: PageType;
      tone: ToneType;
    };

    const pageMeta = PAGE_TYPE_META[pageType];
    const toneMeta = TONE_META[tone];
    const structure = PAGE_STRUCTURES[pageType];

    // Build concept text from all non-empty fields
    const conceptParts = [
      // Common
      concept.targetAudience && `ターゲット: ${concept.targetAudience}`,
      concept.painPoints && `悩み・痛み: ${concept.painPoints}`,
      concept.desiredFuture && `理想の未来・得られる成果: ${concept.desiredFuture}`,
      concept.differentiator && `差別化ポイント: ${concept.differentiator}`,
      concept.socialProof && `実績・お客様の声:\n${concept.socialProof}`,
      // Optin
      concept.freeOfferName && `無料オファー名: ${concept.freeOfferName}`,
      concept.freeOfferContent && `無料オファー内容: ${concept.freeOfferContent}`,
      concept.registrationMethod && `登録先: ${concept.registrationMethod}`,
      // Seminar
      concept.seminarTitle && `セミナータイトル: ${concept.seminarTitle}`,
      concept.seminarDetails && `セミナー詳細: ${concept.seminarDetails}`,
      concept.speakerProfile && `講師プロフィール: ${concept.speakerProfile}`,
      // Consultation
      concept.consultationType && `相談形式・内容: ${concept.consultationType}`,
      concept.consultationFlow && `相談の流れ: ${concept.consultationFlow}`,
      // Sales / Lecture
      concept.offerName && `講座名（商品名）: ${concept.offerName}`,
      concept.offerDescription && `講座の目的とゴール: ${concept.offerDescription}`,
      concept.curriculum && `カリキュラム:\n${concept.curriculum}`,
      concept.format && `受講形式: ${concept.format}`,
      concept.regularPrice && `通常価格: ${concept.regularPrice}`,
      concept.price && `今回の価格: ${concept.price}`,
      concept.bonuses && `特典:\n${concept.bonuses}`,
      concept.guarantee && `保証: ${concept.guarantee}`,
      concept.deadline && `募集期限・限定性: ${concept.deadline}`,
    ].filter(Boolean).join('\n\n');

    const prompt = `以下の講座情報に基づいて、「${pageMeta.label}」のLPを作成してください。

## 講座・コンセプト情報
${conceptParts || '（詳細情報なし — 一般的な講座販売テンプレートとして作成してください）'}

## ページタイプ
${pageMeta.label}: ${pageMeta.description}

## 文体・トーン
${toneMeta.label}: ${toneMeta.description}

## ページ構成（この順番で作成）
${structure}

---

## 出力ルール

### 出力1: HTML版
完全なHTMLファイルとして出力してください。以下の要件を満たすこと:
- \`<!DOCTYPE html>\` から始まる完全なHTML
- \`<style>\` タグでCSSを記述（外部ファイル参照なし）
- レスポンシブ対応（max-width: 720px、margin: 0 auto）
- Google Fontsの \`Noto Sans JP\` を読み込んで使用
- 配色: メイン背景 #FFFFFF、セクション背景交互に #F8F7F4、アクセント #C8956C、テキスト #333333、サブテキスト #666666、見出し #1A1A1A
- CTAボタン: 背景 #C8956C、テキスト白、角丸 8px、padding 18px 48px、font-size 18px、ホバーで #B5845E に。ボタン下に小さく「※◯日間限定」等
- ファーストビューは背景 #F8F7F4 で広め（padding: 80px 24px）、キャッチコピーは大きく
- セクション間は padding: 60px 24px
- 見出しは大きく太く（font-size: 28px、font-weight: 700）、セクション見出しの上にアクセントカラーの小さなラベル（例:「STEP 01」「CURRICULUM」等）
- 本文は font-size: 16px、line-height: 1.9
- お客様の声はカード形式（border-left: 4px solid #C8956C + 背景#F8F7F4）
- FAQ はアコーディオン風（Q: 太字、A: 通常）
- カリキュラムは番号付きステップで、各ステップにアイコンか番号バッジをつける
- チェックリスト（✓）やアイコン的な装飾を適宜使用
- フォームのplaceholderは実用的な文言
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
      system: `あなたは講座や商品を売るためのLP（ランディングページ）を、全体構成から文章の設計まで一括で作成できるプロのコピーライターです。

日本のオンラインビジネス・コーチング・講座ビジネス市場に精通しています。

【執筆の心構え】
- 講座作成が初めての人にも伝わるよう、丁寧で信頼感のある口調で書く
- 優しく、でも頼れる専門家として語る
- 購入を迷っている人の背中を自然に押す。押し売りには絶対にならない
- 数字や具体例を使い、抽象的な表現を避ける
- 読者が「私のことだ」と感じる共感パートを大切にする`,
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
