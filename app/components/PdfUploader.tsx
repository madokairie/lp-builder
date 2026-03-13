'use client';

import { useState, useRef } from 'react';
import { FileUp, Loader2, FileText, X } from 'lucide-react';

interface PdfUploaderProps {
  onExtract: (text: string) => void;
  label?: string;
  compact?: boolean;
}

export default function PdfUploader({ onExtract, label = 'PDFから読み込む', compact = false }: PdfUploaderProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ fileName: string; pages: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('PDFファイルを選択してください');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'PDF解析に失敗しました' }));
        throw new Error(err.error);
      }

      const { text, pages, fileName } = await res.json();
      setResult({ fileName, pages });
      onExtract(text);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'PDF解析に失敗しました');
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E0D8] rounded-lg text-xs text-[#666660] hover:border-[#B8975A] hover:text-[#B8975A] transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <FileUp size={12} />}
          {loading ? '読込中...' : label}
        </button>
        {result && (
          <span className="text-xs text-[#7B9E87]">
            ✓ {result.fileName}（{result.pages}p）
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      className="border-2 border-dashed border-[#E5E0D8] rounded-lg p-4 text-center hover:border-[#B8975A] transition-colors"
    >
      <input
        ref={fileRef}
        type="file"
        accept=".pdf"
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="hidden"
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-[#888880]">
          <Loader2 size={16} className="animate-spin" />
          PDF解析中...
        </div>
      ) : result ? (
        <div className="flex items-center justify-center gap-2 py-2">
          <FileText size={16} className="text-[#7B9E87]" />
          <span className="text-sm text-[#7B9E87]">{result.fileName}（{result.pages}ページ）読込完了</span>
          <button onClick={() => setResult(null)} className="text-[#AAAAAA] hover:text-[#666660]">
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-2"
        >
          <FileUp size={20} className="mx-auto text-[#B8975A] mb-1" />
          <p className="text-sm text-[#666660]">{label}</p>
          <p className="text-xs text-[#AAAAAA] mt-1">ドラッグ＆ドロップ or クリックで選択（10MBまで）</p>
        </button>
      )}
    </div>
  );
}
