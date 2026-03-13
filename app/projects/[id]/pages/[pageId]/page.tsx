'use client';

import { useState, useEffect, useRef, use, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Loader2, Eye, Code, FileText, Copy, Check, Download, RefreshCw, MessageCircle, Send, X, Layers, FileCode, Maximize2, History, Pencil } from 'lucide-react';
import { LPProject, PAGE_TYPE_META, PAGE_SECTIONS } from '@/app/lib/types';
import { getProject, updateProject } from '@/app/lib/store';
import PdfUploader from '@/app/components/PdfUploader';

type ViewMode = 'preview' | 'html' | 'text';
type HtmlViewMode = 'full' | 'blocks';

interface HtmlBlock {
  label: string;
  html: string;
}

function parseHtmlBlocks(html: string): HtmlBlock[] {
  if (!html) return [];
  const blocks: HtmlBlock[] = [];

  // Extract content between <body> or within the container
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1] : html;

  // Split by <section> tags
  const sectionRegex = /<section[\s\S]*?<\/section>/gi;
  const sections = bodyContent.match(sectionRegex);

  if (sections && sections.length > 0) {
    sections.forEach((section, i) => {
      // Try to extract a label from section content
      const labelMatch = section.match(/class="section-label"[^>]*>([\s\S]*?)<\//i)
        || section.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/i);
      let label = labelMatch ? labelMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      if (!label) {
        // Check for class names that hint at section purpose
        const classMatch = section.match(/class="[^"]*\b(hero|faq|price|testimonial|cta|curriculum|footer)\b/i);
        label = classMatch ? classMatch[1].toUpperCase() : `セクション ${i + 1}`;
      }
      if (label.length > 30) label = label.substring(0, 30) + '...';
      blocks.push({ label, html: section.trim() });
    });
  } else {
    // Fallback: split by major div blocks inside container
    const divRegex = /<div[\s\S]*?<\/div>/gi;
    const divs = bodyContent.match(divRegex);
    if (divs && divs.length > 0) {
      divs.forEach((div, i) => {
        blocks.push({ label: `ブロック ${i + 1}`, html: div.trim() });
      });
    } else {
      blocks.push({ label: '全体', html: html });
    }
  }

  return blocks;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isUpdate?: boolean;
}

export default function PageEditorPage({ params }: { params: Promise<{ id: string; pageId: string }> }) {
  const { id, pageId } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<LPProject | null>(null);
  const [generating, setGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('preview');
  const [copied, setCopied] = useState(false);
  const [copiedBlockIndex, setCopiedBlockIndex] = useState<number | null>(null);
  const [htmlViewMode, setHtmlViewMode] = useState<HtmlViewMode>('full');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [refining, setRefining] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [blockInstruction, setBlockInstruction] = useState('');
  const [refiningBlock, setRefiningBlock] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const p = getProject(id);
    if (!p) { router.push('/'); return; }
    const pg = p.pages.find(pg => pg.id === pageId);
    if (!pg) { router.push(`/projects/${id}`); return; }
    setProject(p);
  }, [id, pageId, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const page = project?.pages.find(pg => pg.id === pageId);
  const htmlBlocks = useMemo(() => parseHtmlBlocks(page?.generatedHtml || ''), [page?.generatedHtml]);

  const handleCopyBlock = (index: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedBlockIndex(index);
    setTimeout(() => setCopiedBlockIndex(null), 2000);
  };

  const handleRefineBlock = async (blockIndex: number) => {
    if (!blockInstruction.trim() || refiningBlock || !page || !project) return;
    const block = htmlBlocks[blockIndex];
    if (!block) return;

    setRefiningBlock(true);
    try {
      const res = await fetch('/api/refine-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockHtml: block.html,
          blockLabel: block.label,
          instruction: blockInstruction.trim(),
          pageType: PAGE_TYPE_META[page.pageType].label,
          fullHtml: page.generatedHtml,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'ブロック修正に失敗しました' }));
        throw new Error(err.error);
      }
      const { html: newBlockHtml } = await res.json();
      // Replace the block in the full HTML
      const fullHtml = page.generatedHtml;
      const updatedHtml = fullHtml.replace(block.html, newBlockHtml);
      const updatedPages = project.pages.map(p =>
        p.id === pageId ? { ...p, generatedHtml: updatedHtml, generatedAt: new Date().toISOString() } : p
      );
      const updated = updateProject(id, { pages: updatedPages });
      if (updated) setProject(updated);
      setEditingBlockIndex(null);
      setBlockInstruction('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'ブロック修正に失敗しました');
    } finally {
      setRefiningBlock(false);
    }
  };

  if (!project || !page) return null;

  const meta = PAGE_TYPE_META[page.pageType];
  const hasContent = !!page.generatedHtml || !!page.generatedText;

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: project.concept,
          pageType: page.pageType,
          tone: project.tone,
          rawMaterial: page.rawMaterial || '',
          ctaText: page.ctaText || '',
          faq: page.faq || '',
          photoInstructions: page.photoInstructions || '',
          excludeSections: page.excludeSections || [],
          brandVoice: project.brandVoice || '',
          referenceLp: project.referenceLp || '',
          // ページ間連携: 同プロジェクトの他ページの生成済みテキストを渡す
          otherPages: project.pages
            .filter(p => p.id !== pageId && p.generatedText)
            .map(p => ({ pageType: p.pageType, text: p.generatedText.substring(0, 2000) })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'LP生成に失敗しました' }));
        throw new Error(err.error);
      }
      const { html, text } = await res.json();
      const updatedPages = project.pages.map(p => {
        if (p.id !== pageId) return p;
        // Save current version to history before overwriting (max 5)
        const history = [...(p.generationHistory || [])];
        if (p.generatedHtml && p.generatedAt) {
          history.unshift({ html: p.generatedHtml, text: p.generatedText, generatedAt: p.generatedAt });
          if (history.length > 5) history.pop();
        }
        return { ...p, generatedHtml: html, generatedText: text, generatedAt: new Date().toISOString(), generationHistory: history };
      });
      const updated = updateProject(id, { pages: updatedPages });
      if (updated) setProject(updated);
      setViewMode('preview');
      setChatMessages([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'LP生成に失敗しました');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    if (!page.generatedHtml) return;
    const blob = new Blob([page.generatedHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}_${meta.label}.html`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const updatePageField = (field: string, value: string | string[]) => {
    const updatedPages = project.pages.map(p =>
      p.id === pageId ? { ...p, [field]: value } : p
    );
    const updated = updateProject(id, { pages: updatedPages });
    if (updated) setProject(updated);
  };

  const handleDownloadText = () => {
    if (!page.generatedText) return;
    const blob = new Blob([page.generatedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}_${meta.label}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || refining || !page) return;
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setRefining(true);

    try {
      const allMessages = [...chatMessages, { role: 'user' as const, content: userMessage }];

      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentHtml: page.generatedHtml,
          currentText: page.generatedText,
          messages: allMessages,
          pageType: meta.label,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '修正に失敗しました' }));
        throw new Error(err.error);
      }

      const { html, text, message, hasUpdate } = await res.json();

      if (hasUpdate && (html || text)) {
        // Update the page content
        const updatedPages = project.pages.map(p =>
          p.id === pageId
            ? {
                ...p,
                generatedHtml: html || p.generatedHtml,
                generatedText: text || p.generatedText,
                generatedAt: new Date().toISOString(),
              }
            : p
        );
        const updated = updateProject(id, { pages: updatedPages });
        if (updated) setProject(updated);
        setChatMessages(prev => [...prev, { role: 'assistant', content: '修正しました ✓', isUpdate: true }]);
      } else {
        setChatMessages(prev => [...prev, { role: 'assistant', content: message }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: `エラー: ${err instanceof Error ? err.message : '修正に失敗しました'}` }]);
    } finally {
      setRefining(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendChat();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] flex flex-col" style={{ fontFamily: "'Georgia', 'Noto Serif JP', serif" }}>
      {/* Header */}
      <div className="border-b border-[#E5E0D8] px-6 py-3 sticky top-0 bg-[#FAFAF8] z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push(`/projects/${id}`)} className="text-[#888880] hover:text-[#666660] transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="text-xs text-[#B8975A] tracking-[2px]">{project.name}</div>
              <h1 className="text-base font-medium flex items-center gap-2">
                <span>{meta.icon}</span>
                {meta.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasContent && (
              <div className="flex bg-[#F5F3F0] rounded-lg p-0.5 mr-2">
                {[
                  { mode: 'preview' as ViewMode, icon: Eye, label: 'プレビュー' },
                  { mode: 'html' as ViewMode, icon: Code, label: 'HTML' },
                  { mode: 'text' as ViewMode, icon: FileText, label: 'テキスト' },
                ].map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs transition-colors ${
                      viewMode === mode ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#888880] hover:text-[#666660]'
                    }`}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>
            )}

            {hasContent && (
              <>
                {viewMode === 'preview' && (
                  <button
                    onClick={() => setFullscreen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F3F0] border border-[#D5D0C8] rounded text-sm text-[#666660] hover:border-[#B8975A] transition-colors"
                    title="全画面プレビュー"
                  >
                    <Maximize2 size={13} />
                  </button>
                )}
                {(page.generationHistory || []).length > 0 && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F3F0] border border-[#D5D0C8] rounded text-sm text-[#666660] hover:border-[#B8975A] transition-colors"
                    title="生成履歴"
                  >
                    <History size={13} />
                    <span className="text-xs">{(page.generationHistory || []).length}</span>
                  </button>
                )}
                <button
                  onClick={() => handleCopy(viewMode === 'text' ? page.generatedText : page.generatedHtml)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F3F0] border border-[#D5D0C8] rounded text-sm text-[#666660] hover:border-[#B8975A] transition-colors"
                >
                  {copied ? <Check size={13} className="text-[#7B9E87]" /> : <Copy size={13} />}
                  {copied ? 'コピー済み' : 'コピー'}
                </button>
                <button
                  onClick={viewMode === 'text' ? handleDownloadText : handleDownloadHtml}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#B8975A] text-white rounded text-sm font-medium hover:bg-[#A6854D] transition-colors"
                >
                  <Download size={13} />
                  {viewMode === 'text' ? 'TXT' : 'HTML'}
                </button>
                {viewMode !== 'text' && (
                  <button
                    onClick={() => {
                      if (!page.generatedHtml) return;
                      const pw = window.open('', '_blank');
                      if (!pw) { alert('ポップアップがブロックされています。許可してください。'); return; }
                      pw.document.write(page.generatedHtml);
                      pw.document.title = `${project.name}_${meta.label}`;
                      pw.document.close();
                      pw.onload = () => pw.print();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F3F0] border border-[#D5D0C8] rounded text-sm text-[#666660] hover:border-[#B8975A] transition-colors"
                    title="PDFとして保存（印刷ダイアログ）"
                  >
                    <Download size={13} />
                    PDF
                  </button>
                )}
                <button
                  onClick={() => { setChatOpen(!chatOpen); setTimeout(() => chatInputRef.current?.focus(), 100); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm transition-colors ${
                    chatOpen
                      ? 'bg-[#B8975A] text-white'
                      : 'bg-[#F5F3F0] border border-[#D5D0C8] text-[#666660] hover:border-[#B8975A]'
                  }`}
                >
                  <MessageCircle size={13} />
                  修正チャット
                </button>
              </>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F3F0] border border-[#D5D0C8] rounded text-sm text-[#666660] hover:border-[#B8975A] transition-colors disabled:opacity-50"
            >
              {generating ? <Loader2 size={13} className="animate-spin" /> : hasContent ? <RefreshCw size={13} /> : <Sparkles size={13} />}
              {generating ? '生成中...' : hasContent ? '再生成' : 'AIで生成'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex">
        {/* LP content */}
        <div className={`flex-1 ${chatOpen && hasContent ? 'mr-[380px]' : ''} transition-all`}>
          {!hasContent ? (
            <div className="max-w-2xl mx-auto py-12 px-6">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">{meta.icon}</div>
                <h2 className="text-lg font-medium mb-2">{meta.label}</h2>
                <p className="text-sm text-[#888880]">
                  コンセプトシートの情報 + 素材テキストをもとにAIが生成します
                </p>
              </div>

              {/* 素材テキスト入力 */}
              <div className="bg-white border border-[#E5E0D8] rounded-lg p-5 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-[#1A1A1A]">
                      素材テキスト
                      <span className="text-xs text-[#B8975A] font-normal ml-2">精度UP · 任意</span>
                    </label>
                    <PdfUploader
                      compact
                      label="PDFから読み込む"
                      onExtract={text => updatePageField('rawMaterial', (page.rawMaterial || '') + '\n\n' + text)}
                    />
                  </div>
                  <span className="text-xs text-[#AAAAAA]">
                    {page.rawMaterial ? `${page.rawMaterial.length}文字` : ''}
                  </span>
                </div>
                <p className="text-xs text-[#888880] mb-3">
                  原稿・メモ・構成案・コンセプトシートの出力など、手元にある素材をそのまま貼ってください。<br />
                  テキスト・HTML・Markdown・PDF何でもOK。AIがこの内容を最優先で使います。
                </p>
                <textarea
                  value={page.rawMaterial || ''}
                  onChange={e => updatePageField('rawMaterial', e.target.value)}
                  placeholder={`ここにLP原稿・メモ・構成案を貼り付け...\n\n例:\n【1. ファーストビュー】\nセカンドキャリアは"ローンチを動かす人"になる\nプロモーター養成講座\n\n【2. 共感導入】\n「この先、ずっと今のままで大丈夫かな……」\n...\n\n※ コンセプト設計アプリの出力HTMLもそのまま貼れます`}
                  rows={12}
                  className="w-full px-4 py-3 bg-[#FAFAF8] border border-[#E5E0D8] rounded-lg text-sm focus:outline-none focus:border-[#B8975A] resize-y"
                />
              </div>

              {/* CTA文言 */}
              <div className="bg-white border border-[#E5E0D8] rounded-lg p-5 mb-4">
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  CTAボタンの文言
                  <span className="text-xs text-[#888880] font-normal ml-2">空欄ならAIが自動生成</span>
                </label>
                <input
                  type="text"
                  value={page.ctaText || ''}
                  onChange={e => updatePageField('ctaText', e.target.value)}
                  placeholder="例: 今すぐ申し込む / モニター枠に応募する / 無料で受け取る"
                  className="w-full px-4 py-2.5 bg-[#FAFAF8] border border-[#E5E0D8] rounded-lg text-sm focus:outline-none focus:border-[#B8975A]"
                />
              </div>

              {/* FAQ */}
              <div className="bg-white border border-[#E5E0D8] rounded-lg p-5 mb-4">
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  よくある質問（FAQ）
                  <span className="text-xs text-[#888880] font-normal ml-2">空欄ならAIが自動生成</span>
                </label>
                <p className="text-xs text-[#888880] mb-2">
                  Q: と A: の形式で書いてください。そのまま反映されます。
                </p>
                <textarea
                  value={page.faq || ''}
                  onChange={e => updatePageField('faq', e.target.value)}
                  placeholder={`Q: 未経験でも大丈夫ですか？\nA: はい、基礎から学べるカリキュラムなのでご安心ください。\n\nQ: 受講期間はどのくらいですか？\nA: 6ヶ月間のプログラムです。自分のペースで進められます。\n\nQ: 分割払いは可能ですか？\nA: はい、対応しています。お申し込み時にご相談ください。`}
                  rows={8}
                  className="w-full px-4 py-3 bg-[#FAFAF8] border border-[#E5E0D8] rounded-lg text-sm focus:outline-none focus:border-[#B8975A] resize-y"
                />
              </div>

              {/* 写真配置の指示 */}
              <div className="bg-white border border-[#E5E0D8] rounded-lg p-5 mb-4">
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  写真・画像の配置指示
                  <span className="text-xs text-[#888880] font-normal ml-2">任意</span>
                </label>
                <textarea
                  value={page.photoInstructions || ''}
                  onChange={e => updatePageField('photoInstructions', e.target.value)}
                  placeholder={`例:\n・ファーストビューに講師2人の写真\n・お客様の声に各受講生の顔写真\n・カリキュラムセクションにイメージ画像\n\n※ 実際の画像は入りませんが、プレースホルダー（配置枠）が生成されます`}
                  rows={4}
                  className="w-full px-4 py-3 bg-[#FAFAF8] border border-[#E5E0D8] rounded-lg text-sm focus:outline-none focus:border-[#B8975A] resize-y"
                />
              </div>

              {/* セクションON/OFF */}
              <div className="bg-white border border-[#E5E0D8] rounded-lg p-5 mb-6">
                <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                  セクション構成
                  <span className="text-xs text-[#888880] font-normal ml-2">不要なセクションをOFFにできます</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {(PAGE_SECTIONS[page.pageType] || []).map(section => {
                    const excluded = (page.excludeSections || []).includes(section.id);
                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          const current = page.excludeSections || [];
                          const next = excluded
                            ? current.filter(s => s !== section.id)
                            : [...current, section.id];
                          updatePageField('excludeSections', next);
                        }}
                        className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${
                          excluded
                            ? 'border-[#E5E0D8] bg-[#F5F3F0] text-[#AAAAAA] line-through'
                            : 'border-[#B8975A] bg-[#B8975A]/5 text-[#B8975A] font-medium'
                        }`}
                      >
                        {section.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="flex items-center gap-2 px-6 py-3 bg-[#B8975A] text-white rounded-lg text-sm font-medium hover:bg-[#A6854D] transition-colors disabled:opacity-50 mx-auto"
                >
                  {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {generating ? '生成中...' : 'AIでLPを生成する'}
                </button>
                <p className="text-xs text-[#AAAAAA] mt-3">
                  素材テキストなしでも生成できます（コンセプトシートの情報のみ使用）
                </p>
              </div>
            </div>
          ) : viewMode === 'preview' ? (
            <div className="max-w-4xl mx-auto py-4 px-6">
              <div className="bg-white border border-[#E5E0D8] rounded-lg overflow-hidden shadow-sm">
                <iframe
                  ref={iframeRef}
                  srcDoc={page.generatedHtml}
                  className="w-full border-none"
                  style={{ minHeight: '800px', height: '100vh' }}
                  sandbox="allow-same-origin"
                />
              </div>
              {page.generatedAt && (
                <div className="mt-3 text-center text-xs text-[#AAAAAA]">
                  生成日時: {new Date(page.generatedAt).toLocaleString('ja-JP')}
                </div>
              )}
            </div>
          ) : viewMode === 'html' ? (
            <div className="max-w-4xl mx-auto px-6 py-6">
              {/* Toggle: full vs blocks */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex bg-[#F5F3F0] rounded-lg p-0.5">
                  <button
                    onClick={() => setHtmlViewMode('full')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
                      htmlViewMode === 'full' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#888880] hover:text-[#666660]'
                    }`}
                  >
                    <FileCode size={12} />
                    全体
                  </button>
                  <button
                    onClick={() => setHtmlViewMode('blocks')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
                      htmlViewMode === 'blocks' ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#888880] hover:text-[#666660]'
                    }`}
                  >
                    <Layers size={12} />
                    ブロック別
                  </button>
                </div>
                {htmlViewMode === 'blocks' && (
                  <span className="text-xs text-[#888880]">{htmlBlocks.length} ブロック · UTAGE貼り付け用</span>
                )}
              </div>

              {htmlViewMode === 'full' ? (
                <pre className="bg-[#1A1A1A] text-[#E5E0D8] rounded-lg p-6 text-xs leading-relaxed overflow-auto max-h-[80vh] whitespace-pre-wrap break-all">
                  {page.generatedHtml}
                </pre>
              ) : (
                <div className="space-y-3">
                  {htmlBlocks.map((block, i) => (
                    <div key={i} className={`bg-white border rounded-lg overflow-hidden ${editingBlockIndex === i ? 'border-[#B8975A]' : 'border-[#E5E0D8]'}`}>
                      <div className="flex items-center justify-between px-4 py-2.5 bg-[#FAFAF8] border-b border-[#E5E0D8]">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-5 h-5 bg-[#C8956C] text-white rounded text-[10px] font-bold">
                            {i + 1}
                          </span>
                          <span className="text-xs font-medium text-[#666660]">{block.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              if (editingBlockIndex === i) { setEditingBlockIndex(null); setBlockInstruction(''); }
                              else { setEditingBlockIndex(i); setBlockInstruction(''); }
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors ${
                              editingBlockIndex === i
                                ? 'bg-[#B8975A] text-white'
                                : 'bg-white border border-[#D5D0C8] text-[#666660] hover:border-[#B8975A] hover:text-[#B8975A]'
                            }`}
                          >
                            <Pencil size={11} />
                            修正
                          </button>
                          <button
                            onClick={() => handleCopyBlock(i, block.html)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#D5D0C8] rounded text-xs text-[#666660] hover:border-[#B8975A] hover:text-[#B8975A] transition-colors"
                          >
                            {copiedBlockIndex === i ? <Check size={11} className="text-[#7B9E87]" /> : <Copy size={11} />}
                            {copiedBlockIndex === i ? 'コピー済み' : 'コピー'}
                          </button>
                        </div>
                      </div>
                      {editingBlockIndex === i && (
                        <div className="px-4 py-3 bg-[#B8975A]/5 border-b border-[#E5E0D8]">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={blockInstruction}
                              onChange={e => setBlockInstruction(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefineBlock(i); } }}
                              placeholder="修正内容を入力... 例: もっと共感的なトーンにして"
                              className="flex-1 px-3 py-2 bg-white border border-[#D5D0C8] rounded-lg text-sm focus:outline-none focus:border-[#B8975A]"
                              autoFocus
                              disabled={refiningBlock}
                            />
                            <button
                              onClick={() => handleRefineBlock(i)}
                              disabled={!blockInstruction.trim() || refiningBlock}
                              className="px-4 py-2 bg-[#B8975A] text-white rounded-lg text-sm font-medium hover:bg-[#A6854D] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                              {refiningBlock ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                              {refiningBlock ? '修正中...' : 'AI修正'}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {['もっと短く', 'もっと具体的に', 'トーンを柔らかく', 'CTAを強くして', '箇条書きに変えて'].map(s => (
                              <button
                                key={s}
                                onClick={() => setBlockInstruction(s)}
                                className="px-2 py-0.5 bg-white border border-[#E5E0D8] rounded text-[10px] text-[#888880] hover:border-[#B8975A] hover:text-[#B8975A] transition-colors"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <pre className="bg-[#1A1A1A] text-[#E5E0D8] p-4 text-xs leading-relaxed overflow-auto max-h-[300px] whitespace-pre-wrap break-all">
                        {block.html}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-6 py-6">
              <div className="bg-white border border-[#E5E0D8] rounded-lg p-8">
                <pre className="text-sm leading-[1.9] text-[#333330] whitespace-pre-wrap font-[Georgia,'Noto_Serif_JP',serif]">
                  {page.generatedText}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Fullscreen preview */}
        {fullscreen && hasContent && (
          <div className="fixed inset-0 bg-white z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#E5E0D8] bg-[#FAFAF8]">
              <span className="text-sm text-[#666660]">{meta.icon} {meta.label} — 全画面プレビュー</span>
              <button
                onClick={() => setFullscreen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F3F0] border border-[#D5D0C8] rounded text-sm text-[#666660] hover:border-[#B8975A] transition-colors"
              >
                <X size={14} />
                閉じる
              </button>
            </div>
            <iframe
              srcDoc={page.generatedHtml}
              className="flex-1 w-full border-none"
              sandbox="allow-same-origin"
            />
          </div>
        )}

        {/* History panel */}
        {showHistory && hasContent && (page.generationHistory || []).length > 0 && (
          <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowHistory(false)}>
            <div className="bg-white rounded-xl shadow-xl w-[600px] max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E0D8]">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <History size={14} />
                  生成履歴（最大5件）
                </h3>
                <button onClick={() => setShowHistory(false)} className="text-[#AAAAAA] hover:text-[#666660]">
                  <X size={16} />
                </button>
              </div>
              <div className="overflow-y-auto max-h-[70vh] divide-y divide-[#E5E0D8]">
                {(page.generationHistory || []).map((entry, i) => (
                  <div key={i} className="px-5 py-3 hover:bg-[#FAFAF8]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[#888880]">
                        {new Date(entry.generatedAt).toLocaleString('ja-JP')}
                      </span>
                      <button
                        onClick={() => {
                          if (!confirm('この履歴に戻しますか？現在の内容は履歴に保存されます。')) return;
                          // Save current to history, restore old
                          const history = [...(page.generationHistory || [])];
                          if (page.generatedAt) {
                            history.splice(i, 1);
                            history.unshift({ html: page.generatedHtml, text: page.generatedText, generatedAt: page.generatedAt });
                            if (history.length > 5) history.pop();
                          }
                          const updatedPages = project.pages.map(p =>
                            p.id === pageId
                              ? { ...p, generatedHtml: entry.html, generatedText: entry.text, generatedAt: entry.generatedAt, generationHistory: history }
                              : p
                          );
                          const updated = updateProject(id, { pages: updatedPages });
                          if (updated) setProject(updated);
                          setShowHistory(false);
                        }}
                        className="px-3 py-1 bg-[#F5F3F0] border border-[#D5D0C8] rounded text-xs text-[#666660] hover:border-[#B8975A] hover:text-[#B8975A] transition-colors"
                      >
                        この版に戻す
                      </button>
                    </div>
                    <pre className="text-xs text-[#666660] leading-relaxed whitespace-pre-wrap line-clamp-4">
                      {entry.text.substring(0, 300)}...
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat panel */}
        {chatOpen && hasContent && (
          <div className="fixed right-0 top-[53px] bottom-0 w-[380px] bg-white border-l border-[#E5E0D8] flex flex-col z-20">
            {/* Chat header */}
            <div className="px-4 py-3 border-b border-[#E5E0D8] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">修正チャット</h3>
                <p className="text-xs text-[#888880]">修正したい箇所をリクエスト</p>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-[#AAAAAA] hover:text-[#666660]">
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle size={28} className="mx-auto text-[#D5D0C8] mb-3" />
                  <p className="text-xs text-[#888880] leading-relaxed">
                    修正リクエストを送ってください
                  </p>
                  <div className="mt-4 space-y-1.5">
                    {[
                      'キャッチコピーをもっと強くして',
                      'お客様の声を3つに増やして',
                      '全体的にもっと柔らかいトーンに',
                      '特典セクションをもっと目立たせて',
                    ].map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => { setChatInput(suggestion); chatInputRef.current?.focus(); }}
                        className="block w-full text-left px-3 py-2 bg-[#FAFAF8] border border-[#E5E0D8] rounded text-xs text-[#666660] hover:border-[#B8975A] transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#B8975A] text-white'
                        : msg.isUpdate
                        ? 'bg-[#7B9E87]/10 text-[#7B9E87] border border-[#7B9E87]/20'
                        : 'bg-[#F5F3F0] text-[#333330]'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}

              {refining && (
                <div className="flex justify-start">
                  <div className="bg-[#F5F3F0] px-3 py-2 rounded-lg flex items-center gap-2 text-sm text-[#888880]">
                    <Loader2 size={14} className="animate-spin" />
                    修正中...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-[#E5E0D8]">
              <div className="flex gap-2">
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="修正リクエストを入力..."
                  rows={2}
                  className="flex-1 px-3 py-2 bg-[#FAFAF8] border border-[#E5E0D8] rounded-lg text-sm focus:outline-none focus:border-[#B8975A] resize-none"
                />
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || refining}
                  className="self-end px-3 py-2 bg-[#B8975A] text-white rounded-lg hover:bg-[#A6854D] transition-colors disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-xs text-[#AAAAAA] mt-1.5">Enter で送信 · Shift+Enter で改行</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
