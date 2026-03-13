'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import {
  PageType, PAGE_TYPE_META, ToneType, TONE_META,
  ConceptSheet, ConceptField, createEmptyConcept,
  COMMON_FIELDS, PAGE_SPECIFIC_FIELDS, FUNNEL_CONTEXT_FIELDS, shouldShowFunnelContext,
} from '@/app/lib/types';
import { saveProject } from '@/app/lib/store';
import SheetImporter from '@/app/components/SheetImporter';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [concept, setConcept] = useState(createEmptyConcept());
  const [tone, setTone] = useState<ToneType>('friendly');
  const [selectedPages, setSelectedPages] = useState<PageType[]>([]);
  const [showFunnelContext, setShowFunnelContext] = useState(false);

  const togglePage = (pt: PageType) => {
    setSelectedPages(prev =>
      prev.includes(pt) ? prev.filter(p => p !== pt) : [...prev, pt]
    );
  };

  const handleCreate = () => {
    if (!name.trim()) { alert('プロジェクト名を入力してください'); return; }
    if (selectedPages.length === 0) { alert('作成するページを1つ以上選択してください'); return; }

    const project = saveProject({
      name: name.trim(),
      concept,
      tone,
      pages: selectedPages.map(pt => ({
        id: crypto.randomUUID(),
        pageType: pt,
        generatedHtml: '',
        generatedText: '',
      })),
    });
    router.push(`/projects/${project.id}`);
  };

  const updateConcept = (key: keyof ConceptSheet, value: string) => {
    setConcept(prev => ({ ...prev, [key]: value }));
  };

  // Collect unique page-specific fields for selected pages
  const pageSpecificFields = getUniquePageFields(selectedPages);
  const showFunnelSection = shouldShowFunnelContext(selectedPages);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]" style={{ fontFamily: "'Georgia', 'Noto Serif JP', serif" }}>
      <div className="border-b border-[#E5E0D8] px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => router.push('/')} className="text-[#888880] hover:text-[#666660] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-medium">新規LPプロジェクト</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Project name */}
        <div>
          <label className="block text-sm text-[#666660] mb-1">プロジェクト名</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例: 2025年春ローンチ LP"
            className="w-full px-4 py-2.5 bg-white border border-[#E5E0D8] rounded-lg text-sm focus:outline-none focus:border-[#B8975A]"
          />
        </div>

        {/* Page type selection */}
        <div>
          <h2 className="text-base font-medium text-[#1A1A1A] mb-3 pb-2 border-b border-[#E5E0D8]">作成するページを選択</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.entries(PAGE_TYPE_META) as [PageType, typeof PAGE_TYPE_META[PageType]][]).map(([key, meta]) => {
              const selected = selectedPages.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => togglePage(key)}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selected
                      ? 'border-[#B8975A] bg-[#B8975A]/5'
                      : 'border-[#E5E0D8] bg-white hover:border-[#D5D0C8]'
                  }`}
                >
                  <div className="text-xl mb-1">{meta.icon}</div>
                  <div className="text-sm font-medium">{meta.label}</div>
                  <div className="text-xs text-[#888880] mt-0.5">{meta.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tone selection */}
        <div>
          <h2 className="text-base font-medium text-[#1A1A1A] mb-3 pb-2 border-b border-[#E5E0D8]">文体・トーン</h2>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(TONE_META) as [ToneType, typeof TONE_META[ToneType]][]).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setTone(key)}
                className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                  tone === key
                    ? 'border-[#B8975A] bg-[#B8975A]/5 text-[#B8975A] font-medium'
                    : 'border-[#E5E0D8] bg-white text-[#666660] hover:border-[#D5D0C8]'
                }`}
              >
                {meta.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-[#AAAAAA] mt-2">{TONE_META[tone].description}</p>
        </div>

        {/* Sheet importer */}
        <SheetImporter
          onImport={(fields) => setConcept(prev => ({ ...prev, ...fields }))}
        />

        {/* Common fields */}
        <div>
          <h2 className="text-base font-medium text-[#1A1A1A] mb-3 pb-2 border-b border-[#E5E0D8]">基本情報</h2>
          <p className="text-xs text-[#AAAAAA] mb-4">全ページ共通の情報です。あとからでも編集できます。</p>
          <FieldGroup fields={COMMON_FIELDS} concept={concept} onChange={updateConcept} />
        </div>

        {/* Page-specific fields */}
        {selectedPages.length > 0 && pageSpecificFields.length > 0 && (
          <div>
            <h2 className="text-base font-medium text-[#1A1A1A] mb-3 pb-2 border-b border-[#E5E0D8]">
              ページ別の情報
              <span className="text-xs text-[#888880] font-normal ml-2">
                {selectedPages.map(pt => PAGE_TYPE_META[pt].icon).join(' ')} 選択中のページに必要な項目
              </span>
            </h2>
            <FieldGroup fields={pageSpecificFields} concept={concept} onChange={updateConcept} />
          </div>
        )}

        {/* Funnel context (optional, collapsible) */}
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
                  このLP先に講座のオファーがある場合、その情報を入れるとAIが逆算して最適なコピーを生成できます
                </p>
                <FieldGroup fields={FUNNEL_CONTEXT_FIELDS} concept={concept} onChange={updateConcept} />
              </>
            )}
          </div>
        )}

        {/* Create button */}
        <button
          onClick={handleCreate}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-[#B8975A] text-white rounded-lg text-base font-medium hover:bg-[#A6854D] transition-colors"
        >
          <Plus size={18} />
          プロジェクトを作成
        </button>
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

// Collect unique fields across selected page types, avoiding duplicates
function getUniquePageFields(selectedPages: PageType[]): ConceptField[] {
  const seen = new Set<string>();
  const fields: ConceptField[] = [];
  for (const pt of selectedPages) {
    for (const field of PAGE_SPECIFIC_FIELDS[pt] || []) {
      if (!seen.has(field.key)) {
        seen.add(field.key);
        fields.push(field);
      }
    }
  }
  return fields;
}
