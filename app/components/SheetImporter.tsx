'use client';

import { useState } from 'react';
import { Upload, Loader2, X, ClipboardPaste } from 'lucide-react';
import { ConceptSheet } from '@/app/lib/types';

interface SheetImporterProps {
  onImport: (fields: Partial<ConceptSheet>) => void;
}

export default function SheetImporter({ onImport }: SheetImporterProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);

  const handleParse = async () => {
    if (!text.trim() || parsing) return;
    setParsing(true);

    try {
      const res = await fetch('/api/parse-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '解析に失敗しました' }));
        throw new Error(err.error);
      }

      const { fields } = await res.json();

      // Only import non-empty fields
      const nonEmpty: Partial<ConceptSheet> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value && typeof value === 'string' && value.trim()) {
          (nonEmpty as Record<string, string>)[key] = value.trim();
        }
      }

      onImport(nonEmpty);
      setOpen(false);
      setText('');
    } catch (err) {
      alert(err instanceof Error ? err.message : '解析に失敗しました');
    } finally {
      setParsing(false);
    }
  };

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) setText(clipText);
    } catch {
      // Clipboard API might be blocked
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-dashed border-[#D5D0C8] rounded-lg text-sm text-[#888880] hover:border-[#B8975A] hover:text-[#B8975A] transition-colors w-full justify-center"
      >
        <Upload size={15} />
        ローンチ設計シートから読み込む
      </button>
    );
  }

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-[#1A1A1A]">ローンチ設計シートから読み込み</h3>
        <button onClick={() => { setOpen(false); setText(''); }} className="text-[#AAAAAA] hover:text-[#666660]">
          <X size={16} />
        </button>
      </div>
      <p className="text-xs text-[#888880] mb-3">
        ローンチ設計シート、コンセプトシート、ファネル設計メモなどを貼り付けてください。<br />
        テキスト・HTML・Markdownなど形式は問いません。AIが解析して自動入力します。
      </p>
      <div className="relative">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={`ここにローンチ設計シートの内容をペースト...

テキスト、HTML、Markdown なんでもOK

例:
【講座名】ローンチマスター養成講座
【ターゲット】起業1〜3年目のコーチ・コンサル
【悩み】集客に時間がかかる、成約率が低い
...

※ コンセプト設計アプリのHTML出力もそのまま貼れます`}
          rows={10}
          className="w-full px-4 py-3 bg-[#FAFAF8] border border-[#E5E0D8] rounded-lg text-sm focus:outline-none focus:border-[#B8975A] resize-none"
        />
        <button
          onClick={handlePaste}
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-white border border-[#E5E0D8] rounded text-xs text-[#888880] hover:border-[#B8975A] hover:text-[#B8975A] transition-colors"
        >
          <ClipboardPaste size={11} />
          貼り付け
        </button>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-[#AAAAAA]">
          {text.length > 0 ? `${text.length}文字` : ''}
        </span>
        <button
          onClick={handleParse}
          disabled={!text.trim() || parsing}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#B8975A] text-white rounded-lg text-sm font-medium hover:bg-[#A6854D] transition-colors disabled:opacity-50"
        >
          {parsing ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {parsing ? '解析中...' : 'AIで解析して入力'}
        </button>
      </div>
    </div>
  );
}
