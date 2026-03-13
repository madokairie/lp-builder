'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Check, Plus, Trash2, ChevronDown, ChevronUp, Download } from 'lucide-react';
import {
  LPProject, PageType, PAGE_TYPE_META, ToneType, TONE_META,
  ConceptSheet, ConceptField, LPPage,
  COMMON_FIELDS, PAGE_SPECIFIC_FIELDS, FUNNEL_CONTEXT_FIELDS, shouldShowFunnelContext,
} from '@/app/lib/types';
import { getProject, updateProject } from '@/app/lib/store';
import SheetImporter from '@/app/components/SheetImporter';
import PdfUploader from '@/app/components/PdfUploader';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<LPProject | null>(null);
  const [saved, setSaved] = useState(false);
  const [showFunnelContext, setShowFunnelContext] = useState(false);

  useEffect(() => {
    const p = getProject(id);
    if (!p) { router.push('/'); return; }
    setProject(p);
  }, [id, router]);

  const handleDownloadAll = () => {
    if (!project) return;
    const generatedPages = project.pages.filter(p => p.generatedHtml);
    generatedPages.forEach(page => {
      const meta = PAGE_TYPE_META[page.pageType];
      const blob = new Blob([page.generatedHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}_${meta.label}.html`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  };

  const handleExportPdf = (pageObj: LPPage) => {
    if (!project || !pageObj.generatedHtml) return;
    const meta = PAGE_TYPE_META[pageObj.pageType];
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('ポップアップがブロックされています。許可してください。'); return; }
    printWindow.document.write(pageObj.generatedHtml);
    printWindow.document.title = `${project.name}_${meta.label}`;
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const handleSave = () => {
    if (!project) return;
    updateProject(id, { concept: project.concept, tone: project.tone, pages: project.pages, name: project.name, brandVoice: project.brandVoice, referenceLp: project.referenceLp });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateConcept = (key: keyof ConceptSheet, value: string) => {
    setProject(prev => prev ? { ...prev, concept: { ...prev.concept, [key]: value } } : prev);
  };

  const addPage = (pageType: PageType) => {
    setProject(prev => {
      if (!prev) return prev;
      const newPage: LPPage = {
        id: crypto.randomUUID(),
        pageType,
        rawMaterial: '',
        ctaText: '',
        faq: '',
        photoInstructions: '',
        excludeSections: [],
        generatedHtml: '',
        generatedText: '',
      };
      return { ...prev, pages: [...prev.pages, newPage] };
    });
  };

  const removePage = (pageId: string) => {
    const page = project?.pages.find(p => p.id === pageId);
    const hasContent = page && (page.generatedHtml || page.generatedText);
    const msg = hasContent
      ? `「${PAGE_TYPE_META[page.pageType].label}」を削除しますか？\n生成済みの内容も失われます。`
      : 'このページを削除しますか？';
    if (!confirm(msg)) return;
    setProject(prev => prev ? { ...prev, pages: prev.pages.filter(p => p.id !== pageId) } : prev);
  };

  const movePage = (pageId: string, direction: -1 | 1) => {
    setProject(prev => {
      if (!prev) return prev;
      const pages = [...prev.pages];
      const idx = pages.findIndex(p => p.id === pageId);
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= pages.length) return prev;
      [pages[idx], pages[newIdx]] = [pages[newIdx], pages[idx]];
      return { ...prev, pages };
    });
  };

  if (!project) return null;

  const existingTypes = new Set(project.pages.map(p => p.pageType));
  const pageTypes = project.pages.map(p => p.pageType);
  const pageSpecificFields = getUniquePageFields(pageTypes);
  const showFunnelSection = shouldShowFunnelContext(pageTypes);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]" style={{ fontFamily: "'Georgia', 'Noto Serif JP', serif" }}>
      {/* Header */}
      <div className="border-b border-[#E5E0D8] px-6 py-3 sticky top-0 bg-[#FAFAF8] z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="text-[#888880] hover:text-[#666660] transition-colors">
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="text-xs text-[#B8975A] tracking-[3px] uppercase">LP Builder</div>
              <h1 className="text-base font-medium">{project.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {project.pages.some(p => p.generatedHtml) && (
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F3F0] border border-[#D5D0C8] rounded text-sm text-[#666660] hover:border-[#B8975A] transition-colors"
                title="全ページダウンロード"
              >
                <Download size={13} />
                一括DL
              </button>
            )}
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F3F0] border border-[#D5D0C8] rounded text-sm text-[#666660] hover:border-[#B8975A] transition-colors"
            >
              {saved ? <Check size={13} className="text-[#7B9E87]" /> : <Save size={13} />}
              {saved ? '保存済み' : '保存'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Pages grid */}
        <div>
          <h2 className="text-base font-medium mb-3 pb-2 border-b border-[#E5E0D8]">LPページ一覧</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {project.pages.map((page, pageIndex) => {
              const meta = PAGE_TYPE_META[page.pageType];
              const hasContent = !!page.generatedHtml || !!page.generatedText;
              return (
                <div
                  key={page.id}
                  className="bg-white border border-[#E5E0D8] rounded-lg p-4 hover:border-[#B8975A] transition-colors cursor-pointer group relative"
                  onClick={() => router.push(`/projects/${id}/pages/${page.id}`)}
                >
                  <div className="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {project.pages.length > 1 && (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); movePage(page.id, -1); }}
                          disabled={pageIndex === 0}
                          className="p-1 text-[#AAAAAA] hover:text-[#B8975A] disabled:opacity-30 disabled:cursor-not-allowed"
                          title="前へ"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); movePage(page.id, 1); }}
                          disabled={pageIndex === project.pages.length - 1}
                          className="p-1 text-[#AAAAAA] hover:text-[#B8975A] disabled:opacity-30 disabled:cursor-not-allowed"
                          title="後へ"
                        >
                          <ChevronDown size={12} />
                        </button>
                      </>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                      className="p-1 text-[#AAAAAA] hover:text-[#C47A5A]"
                      title="削除"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="text-2xl mb-2">{meta.icon}</div>
                  <div className="text-sm font-medium">{meta.label}</div>
                  <div className="text-xs mt-1 flex items-center gap-2">
                    {hasContent ? (
                      <>
                        <span className="text-[#7B9E87]">生成済み</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleExportPdf(page); }}
                          className="text-[10px] text-[#888880] hover:text-[#B8975A] underline transition-colors"
                          title="PDFとして保存（印刷ダイアログ）"
                        >
                          PDF保存
                        </button>
                      </>
                    ) : (
                      <span className="text-[#AAAAAA]">未生成</span>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="relative">
              <AddPageDropdown existingTypes={existingTypes} onAdd={addPage} />
            </div>
          </div>
        </div>

        {/* Tone */}
        <div>
          <h2 className="text-base font-medium mb-3 pb-2 border-b border-[#E5E0D8]">文体・トーン</h2>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(TONE_META) as [ToneType, typeof TONE_META[ToneType]][]).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setProject(prev => prev ? { ...prev, tone: key } : prev)}
                className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                  project.tone === key
                    ? 'border-[#B8975A] bg-[#B8975A]/5 text-[#B8975A] font-medium'
                    : 'border-[#E5E0D8] bg-white text-[#666660] hover:border-[#D5D0C8]'
                }`}
              >
                {meta.label}
              </button>
            ))}
          </div>
        </div>

        {/* Brand voice & Reference LP */}
        <div>
          <h2 className="text-base font-medium mb-3 pb-2 border-b border-[#E5E0D8]">
            ブランドボイス・参考LP
            <span className="text-xs text-[#B8975A] font-normal ml-2">任意 · 設定すると全ページに反映</span>
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-[#666660]">ブランドボイス（文体サンプル）</label>
                <PdfUploader
                  compact
                  label="PDFから読み込む"
                  onExtract={text => setProject(prev => prev ? { ...prev, brandVoice: (prev.brandVoice || '') + '\n\n' + text } : prev)}
                />
              </div>
              <textarea
                value={project.brandVoice || ''}
                onChange={e => setProject(prev => prev ? { ...prev, brandVoice: e.target.value } : prev)}
                placeholder={'過去に書いたLPやメルマガの文章を貼ってください。AIがあなたの文体を学習して再現します。\n\n例:\n「自分にもできるのかな」\nそう感じるのは、"今の自分"を超えようとしている証拠です。\nこの講座では、ただ学ぶだけでなく...'}
                rows={5}
                className="w-full px-4 py-2.5 bg-white border border-[#E5E0D8] rounded-lg text-sm focus:outline-none focus:border-[#B8975A] resize-y"
              />
              {(project.brandVoice || '').length > 3000 && (
                <p className="text-xs text-[#C47A5A] mt-1">
                  {(project.brandVoice || '').length}文字入力中（3,000文字を超えた分は生成時にカットされます）
                </p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-[#666660]">参考LP（トーンやレイアウトの参考にしたいLP）</label>
                <PdfUploader
                  compact
                  label="PDFから読み込む"
                  onExtract={text => setProject(prev => prev ? { ...prev, referenceLp: (prev.referenceLp || '') + '\n\n' + text } : prev)}
                />
              </div>
              <textarea
                value={project.referenceLp || ''}
                onChange={e => setProject(prev => prev ? { ...prev, referenceLp: e.target.value } : prev)}
                placeholder="参考にしたいLPのHTMLやテキストを貼ってください。PDFのアップロードもできます。「このLPのような雰囲気で」という指示として使われます。"
                rows={4}
                className="w-full px-4 py-2.5 bg-white border border-[#E5E0D8] rounded-lg text-sm focus:outline-none focus:border-[#B8975A] resize-y"
              />
              {(project.referenceLp || '').length > 5000 && (
                <p className="text-xs text-[#C47A5A] mt-1">
                  {(project.referenceLp || '').length}文字入力中（5,000文字を超えた分は生成時にカットされます）
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sheet importer */}
        <SheetImporter
          onImport={(fields) => setProject(prev => prev ? { ...prev, concept: { ...prev.concept, ...fields } } : prev)}
        />

        {/* Common fields */}
        <div>
          <h2 className="text-base font-medium mb-3 pb-2 border-b border-[#E5E0D8]">基本情報</h2>
          <FieldGroup fields={COMMON_FIELDS} concept={project.concept} onChange={updateConcept} />
        </div>

        {/* Page-specific fields */}
        {pageSpecificFields.length > 0 && (
          <div>
            <h2 className="text-base font-medium mb-3 pb-2 border-b border-[#E5E0D8]">
              ページ別の情報
              <span className="text-xs text-[#888880] font-normal ml-2">
                {pageTypes.map(pt => PAGE_TYPE_META[pt].icon).join(' ')}
              </span>
            </h2>
            <FieldGroup fields={pageSpecificFields} concept={project.concept} onChange={updateConcept} />
          </div>
        )}

        {/* Funnel context */}
        {showFunnelSection && (
          <div>
            <button
              onClick={() => setShowFunnelContext(!showFunnelContext)}
              className="w-full flex items-center justify-between text-left text-base font-medium text-[#1A1A1A] mb-3 pb-2 border-b border-[#E5E0D8]"
            >
              <div>
                ファネル全体の情報
                <span className="text-xs text-[#B8975A] font-normal ml-2">任意 · 入力すると精度UP</span>
              </div>
              {showFunnelContext ? <ChevronUp size={16} className="text-[#888880]" /> : <ChevronDown size={16} className="text-[#888880]" />}
            </button>
            {showFunnelContext && (
              <>
                <p className="text-xs text-[#AAAAAA] mb-4">
                  このLP先に講座のオファーがある場合、情報を入れるとAIが逆算して最適なコピーを生成します
                </p>
                <FieldGroup fields={FUNNEL_CONTEXT_FIELDS} concept={project.concept} onChange={updateConcept} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function FieldGroup({
  fields,
  concept,
  onChange,
}: {
  fields: ConceptField[];
  concept: ConceptSheet;
  onChange: (key: keyof ConceptSheet, value: string) => void;
}) {
  return (
    <div className="space-y-4">
      {fields.map(field => (
        <div key={field.key}>
          <label className="block text-sm text-[#666660] mb-1">{field.label}</label>
          {field.rows <= 1 ? (
            <input
              type="text"
              value={concept[field.key]}
              onChange={e => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full px-4 py-2.5 bg-white border border-[#E5E0D8] rounded-lg text-sm focus:outline-none focus:border-[#B8975A]"
            />
          ) : (
            <textarea
              value={concept[field.key]}
              onChange={e => onChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              rows={field.rows}
              className="w-full px-4 py-2.5 bg-white border border-[#E5E0D8] rounded-lg text-sm focus:outline-none focus:border-[#B8975A] resize-none"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function AddPageDropdown({ existingTypes, onAdd }: { existingTypes: Set<PageType>; onAdd: (pt: PageType) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="w-full h-full min-h-[120px] bg-[#FAFAF8] border-2 border-dashed border-[#D5D0C8] rounded-lg flex flex-col items-center justify-center text-[#AAAAAA] hover:border-[#B8975A] hover:text-[#B8975A] transition-colors"
      >
        <Plus size={20} />
        <span className="text-xs mt-1">ページ追加</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-[#E5E0D8] rounded-lg shadow-lg z-20 py-1">
          {(Object.entries(PAGE_TYPE_META) as [PageType, typeof PAGE_TYPE_META[PageType]][]).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => { onAdd(key); setOpen(false); }}
              disabled={existingTypes.has(key)}
              className="w-full text-left px-4 py-2 text-sm hover:bg-[#FAFAF8] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
              {existingTypes.has(key) && <span className="text-xs text-[#AAAAAA] ml-auto">追加済み</span>}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function getUniquePageFields(pageTypes: PageType[]): ConceptField[] {
  const seen = new Set<string>();
  const fields: ConceptField[] = [];
  for (const pt of pageTypes) {
    for (const field of PAGE_SPECIFIC_FIELDS[pt] || []) {
      if (!seen.has(field.key)) {
        seen.add(field.key);
        fields.push(field);
      }
    }
  }
  return fields;
}
