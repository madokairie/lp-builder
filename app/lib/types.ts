// ── Page Types ──

export type PageType =
  | 'sales'
  | 'optin'
  | 'seminar'
  | 'consultation'
  | 'vsl'
  | 'entry_form'
  | 'thankyou';

export const PAGE_TYPE_META: Record<PageType, { label: string; description: string; icon: string }> = {
  sales:        { label: 'セールスページ', description: '商品・サービスの販売ページ', icon: '💰' },
  optin:        { label: 'オプトインページ', description: 'メルマガ/LINE登録ページ', icon: '📩' },
  seminar:      { label: 'セミナー募集ページ', description: 'セミナー・ウェビナー申込ページ', icon: '🎤' },
  consultation: { label: '個別相談申込ページ', description: '個別相談・面談の申込ページ', icon: '🤝' },
  vsl:          { label: 'VSLページ', description: '動画セールスレター用ページ', icon: '🎬' },
  entry_form:   { label: 'エントリーページ', description: 'エントリーフォーム募集ページ', icon: '📝' },
  thankyou:     { label: 'サンクスページ', description: '申込完了・感謝ページ', icon: '🎉' },
};

// ── Tone ──

export type ToneType = 'friendly' | 'authority' | 'emotional' | 'logical' | 'luxury';

export const TONE_META: Record<ToneType, { label: string; description: string }> = {
  friendly:  { label: '親しみやすい', description: '距離が近く、共感を大事にするトーン' },
  authority: { label: '権威的', description: '専門家として信頼感を与えるトーン' },
  emotional: { label: '感情的', description: '感情に訴えかけ、行動を促すトーン' },
  logical:   { label: '論理的', description: 'データや根拠で説得するトーン' },
  luxury:    { label: '高級感', description: '洗練された上質なイメージのトーン' },
};

// ── Concept Sheet ──

export interface ConceptSheet {
  // 共通（全ページタイプ）
  targetAudience: string;
  painPoints: string;
  desiredFuture: string;
  differentiator: string;
  socialProof: string;

  // オプトイン用
  freeOfferName: string;        // 無料オファー名
  freeOfferContent: string;     // 無料オファーの内容
  registrationMethod: string;   // 登録先（メルマガ/LINE等）

  // セミナー用
  seminarTitle: string;         // セミナータイトル
  seminarDetails: string;       // セミナー詳細（日時・形式等）
  speakerProfile: string;       // 講師プロフィール

  // 相談用
  consultationType: string;     // 相談形式・内容
  consultationFlow: string;     // 相談の流れ

  // セールス・講座用
  offerName: string;
  offerDescription: string;
  curriculum: string;
  format: string;
  regularPrice: string;
  price: string;
  bonuses: string;
  guarantee: string;
  deadline: string;
}

// ── Project Model ──

export interface LPProject {
  id: string;
  name: string;
  concept: ConceptSheet;
  tone: ToneType;
  brandVoice: string;         // ブランドボイス・文体サンプル
  referenceLp: string;        // 参考LP（HTML or テキスト）
  pages: LPPage[];
  createdAt: string;
  updatedAt: string;
}

export interface LPPage {
  id: string;
  pageType: PageType;
  rawMaterial: string;        // 素材テキスト（原稿・メモをそのまま貼る）
  ctaText: string;            // CTAボタンの文言
  faq: string;                // FAQ（Q&Aペア）
  photoInstructions: string;  // 写真配置の指示
  excludeSections: string[];  // 除外するセクション
  generatedHtml: string;
  generatedText: string;
  generatedAt?: string;
  generationHistory?: { html: string; text: string; generatedAt: string }[];
}

// ページタイプ別のセクション定義（ON/OFF用）
export const PAGE_SECTIONS: Record<PageType, { id: string; label: string }[]> = {
  sales: [
    { id: 'hero', label: 'ファーストビュー' },
    { id: 'empathy', label: '共感導入' },
    { id: 'future', label: '理想の未来提示' },
    { id: 'course', label: '講座の紹介' },
    { id: 'curriculum', label: 'カリキュラム紹介' },
    { id: 'target', label: 'こんな方におすすめ' },
    { id: 'offer', label: '受講の決め手（特典・価格）' },
    { id: 'payment', label: '決済フォームエリア' },
    { id: 'faq', label: 'よくある質問' },
    { id: 'testimonials', label: 'お客様の声・実績' },
    { id: 'cta', label: '申込方法と行動喚起' },
  ],
  optin: [
    { id: 'hero', label: 'キャッチコピー' },
    { id: 'pain', label: 'こんな悩みありませんか？' },
    { id: 'offer', label: '無料オファーの内容' },
    { id: 'benefits', label: 'ベネフィット' },
    { id: 'form', label: '登録フォーム＋CTA' },
    { id: 'profile', label: '自己紹介' },
  ],
  seminar: [
    { id: 'hero', label: 'キャッチコピー' },
    { id: 'pain', label: 'こんな悩みありませんか？' },
    { id: 'benefits', label: 'セミナーで得られること' },
    { id: 'details', label: 'セミナー詳細' },
    { id: 'profile', label: '講師紹介' },
    { id: 'testimonials', label: '参加者の声' },
    { id: 'bonus', label: '参加特典' },
    { id: 'faq', label: 'よくある質問' },
    { id: 'cta', label: '申込フォーム' },
  ],
  consultation: [
    { id: 'hero', label: 'キャッチコピー' },
    { id: 'pain', label: 'こんなお悩みありませんか？' },
    { id: 'benefits', label: '相談で得られること' },
    { id: 'flow', label: '相談の流れ' },
    { id: 'profile', label: '担当者紹介' },
    { id: 'testimonials', label: '相談者の声' },
    { id: 'faq', label: 'よくある質問' },
    { id: 'cta', label: '申込フォーム' },
  ],
  vsl: [
    { id: 'hero', label: 'ヘッドライン' },
    { id: 'video', label: '動画エリア' },
    { id: 'benefits', label: 'ベネフィットまとめ' },
    { id: 'testimonials', label: 'お客様の声' },
    { id: 'cta', label: 'CTA' },
  ],
  entry_form: [
    { id: 'hero', label: 'キャッチコピー' },
    { id: 'overview', label: 'プログラム概要' },
    { id: 'target', label: '対象者' },
    { id: 'benefits', label: '得られるもの' },
    { id: 'process', label: '選考プロセス' },
    { id: 'form', label: 'エントリーフォーム' },
    { id: 'faq', label: 'よくある質問' },
  ],
  thankyou: [
    { id: 'thanks', label: 'お礼メッセージ' },
    { id: 'nextstep', label: '次のステップ' },
    { id: 'action', label: '追加アクション' },
  ],
};

// ── Helpers ──

export function createEmptyConcept(): ConceptSheet {
  return {
    targetAudience: '',
    painPoints: '',
    desiredFuture: '',
    differentiator: '',
    socialProof: '',
    freeOfferName: '',
    freeOfferContent: '',
    registrationMethod: '',
    seminarTitle: '',
    seminarDetails: '',
    speakerProfile: '',
    consultationType: '',
    consultationFlow: '',
    offerName: '',
    offerDescription: '',
    curriculum: '',
    format: '',
    regularPrice: '',
    price: '',
    bonuses: '',
    guarantee: '',
    deadline: '',
  };
}

// ── Field definitions by category ──

export interface ConceptField {
  key: keyof ConceptSheet;
  label: string;
  placeholder: string;
  rows: number;
}

// 全ページタイプ共通
export const COMMON_FIELDS: ConceptField[] = [
  { key: 'targetAudience', label: 'ターゲット（誰に向けて）', placeholder: '例: 起業1〜3年目の女性コーチ・コンサル、自分の講座やサービスを作りたい方', rows: 2 },
  { key: 'painPoints', label: '悩み・痛み', placeholder: '例: 集客に時間がかかりすぎる、SNSを頑張っても成約につながらない、差別化できない', rows: 3 },
  { key: 'desiredFuture', label: '理想の未来・得られる成果', placeholder: '例: 毎月安定して見込み客が集まる、自信を持ってセールスできる', rows: 3 },
  { key: 'differentiator', label: '差別化ポイント・あなたの強み', placeholder: '例: 広告費ゼロのオーガニック特化、10年の実績、再現性の高いテンプレート付き', rows: 2 },
  { key: 'socialProof', label: '実績・お客様の声', placeholder: '例: 受講生120名超、「人生が変わった」という声多数\n\n※ 詳しく書くほど精度が上がります。名前・肩書・ビフォーアフター・感想をそのまま貼ってください', rows: 5 },
];

// ページタイプ別のフィールド
export const PAGE_SPECIFIC_FIELDS: Record<PageType, ConceptField[]> = {
  optin: [
    { key: 'freeOfferName', label: '無料オファー名', placeholder: '例: 「ローンチ成功の5ステップ」PDF、無料動画講座、テンプレート集', rows: 1 },
    { key: 'freeOfferContent', label: '無料オファーの内容', placeholder: '例: 全30ページのPDF＋解説動画3本。ローンチの全体設計からLP作成まで網羅', rows: 3 },
    { key: 'registrationMethod', label: '登録先', placeholder: '例: LINE公式アカウント、メールマガジン', rows: 1 },
  ],
  seminar: [
    { key: 'seminarTitle', label: 'セミナータイトル', placeholder: '例: 「初めてのローンチで30万円を達成する方法」無料オンラインセミナー', rows: 1 },
    { key: 'seminarDetails', label: 'セミナー詳細（日時・形式・所要時間）', placeholder: '例: オンライン（Zoom）、90分、3月20日(木) 20:00〜 / 3月22日(土) 10:00〜', rows: 2 },
    { key: 'speakerProfile', label: '講師プロフィール', placeholder: '例: プロモーター歴10年、累計200名以上のローンチ支援、自身も年商3000万円達成', rows: 3 },
  ],
  consultation: [
    { key: 'consultationType', label: '相談の形式・内容', placeholder: '例: 60分のオンライン個別相談（Zoom）、あなたの現状を整理し最適なローンチ戦略を提案', rows: 2 },
    { key: 'consultationFlow', label: '相談の流れ', placeholder: '例: Step1 申込→Step2 日程調整メール→Step3 当日Zoomで相談', rows: 2 },
    { key: 'speakerProfile', label: '担当者プロフィール', placeholder: '例: プロモーター歴10年、累計200名以上の支援実績', rows: 2 },
  ],
  sales: [
    { key: 'offerName', label: '講座名（商品・サービス名）', placeholder: '例: ローンチマスター養成講座', rows: 1 },
    { key: 'offerDescription', label: '講座の目的とゴール', placeholder: '例: 自分の講座を作り、最初のローンチで30万円以上の売上を達成すること', rows: 2 },
    { key: 'curriculum', label: 'カリキュラム・ステップ内容', placeholder: '例:\n■ Step1: コンセプト設計\n説明文...\n\n■ Step2: コンテンツ作成\n説明文...\n\n※ 各ステップの見出し＋説明を詳しく書くとそのまま反映されます', rows: 10 },
    { key: 'format', label: '受講形式', placeholder: '例: オンライン動画（全6回）＋ワークシート＋個別コンサル3回', rows: 2 },
    { key: 'regularPrice', label: '通常価格', placeholder: '例: 498,000円（税込）', rows: 1 },
    { key: 'price', label: '今回の価格', placeholder: '例: モニター価格 298,000円（税込）、先着20名限定', rows: 1 },
    { key: 'bonuses', label: '受講特典', placeholder: '例:\n🎁 1. テンプレート集\n🎁 2. LINEサポート1ヶ月\n🎁 3. 過去セミナー動画アーカイブ\n\n※ 一つずつ書くとそのままリスト化されます', rows: 8 },
    { key: 'guarantee', label: '保証', placeholder: '例: 30日間全額返金保証', rows: 1 },
    { key: 'deadline', label: '募集期限・限定性', placeholder: '例: 3日間限定、先着20名、特典は今回のみ', rows: 1 },
  ],
  vsl: [
    { key: 'offerName', label: '商品・サービス名', placeholder: '例: ローンチマスター養成講座', rows: 1 },
    { key: 'offerDescription', label: '動画の内容・ゴール', placeholder: '例: この動画を見ることで、ローンチの全体像と最初にやるべきことがわかる', rows: 2 },
    { key: 'price', label: '価格（動画内で提示する場合）', placeholder: '例: 298,000円（税込）', rows: 1 },
  ],
  entry_form: [
    { key: 'offerName', label: 'プログラム名', placeholder: '例: ローンチマスター養成プログラム 第3期', rows: 1 },
    { key: 'offerDescription', label: 'プログラム概要', placeholder: '例: 半年間の少人数制プログラム。選考制のため本気の方のみ', rows: 2 },
    { key: 'format', label: 'プログラム形式', placeholder: '例: 月2回のグループコンサル＋無制限チャットサポート＋合宿1回', rows: 2 },
  ],
  thankyou: [
    { key: 'registrationMethod', label: '次のステップ（何を案内する？）', placeholder: '例: LINEに届くメッセージを確認してください、セミナーのZoomリンクをメールで送信します', rows: 2 },
  ],
};

// ファネル全体の情報（精度UP用、任意）
export const FUNNEL_CONTEXT_FIELDS: ConceptField[] = [
  { key: 'offerName', label: '最終オファーの講座名', placeholder: '例: ローンチマスター養成講座（このファネルの最終ゴール）', rows: 1 },
  { key: 'offerDescription', label: '最終オファーの概要', placeholder: '例: 全6回のオンライン講座で、自分のローンチを完成させるプログラム', rows: 2 },
  { key: 'price', label: '最終オファーの価格帯', placeholder: '例: 30〜50万円の高額講座', rows: 1 },
];

// ページタイプに応じて、ファネル情報セクションを表示すべきか
export function shouldShowFunnelContext(pageTypes: PageType[]): boolean {
  const salesTypes: PageType[] = ['sales', 'vsl'];
  // セールス系ページがない場合のみファネル情報を追加表示
  return !pageTypes.some(pt => salesTypes.includes(pt));
}
