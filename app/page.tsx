'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, FileText, ChevronRight, Download, Upload, Copy, AlertTriangle } from 'lucide-react';
import { LPProject, PAGE_TYPE_META } from './lib/types';
import { getProjects, deleteProject, exportProjects, importProjects, duplicateProject, getStorageInfo } from './lib/store';

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<LPProject[]>([]);
  const [storageInfo, setStorageInfo] = useState<{ count: number; max: number; usedKB: number; nearLimit: boolean; atLimit: boolean } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const refreshProjects = () => {
    setProjects(getProjects());
    setStorageInfo(getStorageInfo());
  };

  useEffect(() => {
    refreshProjects();
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？\nこの操作は取り消せません。`)) return;
    deleteProject(id);
    refreshProjects();
  };

  const handleDuplicate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const copied = duplicateProject(id);
    if (copied) refreshProjects();
  };

  const handleExport = () => {
    const json = exportProjects();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lp-builder-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importProjects(reader.result as string);
        refreshProjects();
        alert('インポートが完了しました');
      } catch {
        alert('ファイルの読み込みに失敗しました。正しいバックアップファイルか確認してください。');
      }
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]" style={{ fontFamily: "'Georgia', 'Noto Serif JP', serif" }}>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs text-[#B8975A] tracking-[3px] uppercase mb-1">LP Builder</div>
            <h1 className="text-xl font-medium">ローンチ用LP作成ツール</h1>
          </div>
          <div className="flex items-center gap-2">
            <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
            {projects.length > 0 && (
              <>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#F5F3F0] border border-[#D5D0C8] rounded-lg text-xs text-[#666660] hover:border-[#B8975A] transition-colors"
                  title="バックアップ"
                >
                  <Download size={14} />
                  バックアップ
                </button>
                <button
                  onClick={() => importRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#F5F3F0] border border-[#D5D0C8] rounded-lg text-xs text-[#666660] hover:border-[#B8975A] transition-colors"
                  title="復元"
                >
                  <Upload size={14} />
                  復元
                </button>
              </>
            )}
            <button
              onClick={() => {
                if (storageInfo?.atLimit) {
                  alert(`プロジェクト数が上限（${storageInfo.max}件）に達しています。\n不要なプロジェクトを削除するか、バックアップして削除してください。`);
                  return;
                }
                router.push('/projects/new');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                storageInfo?.atLimit
                  ? 'bg-[#D5D0C8] text-white cursor-not-allowed'
                  : 'bg-[#B8975A] text-white hover:bg-[#A6854D]'
              }`}
            >
              <Plus size={16} />
              新規プロジェクト
            </button>
          </div>
        </div>

        {/* Storage warning */}
        {storageInfo && storageInfo.nearLimit && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-4 text-sm ${
            storageInfo.atLimit
              ? 'bg-[#C47A5A]/10 border border-[#C47A5A]/30 text-[#C47A5A]'
              : 'bg-[#B8975A]/10 border border-[#B8975A]/30 text-[#B8975A]'
          }`}>
            <AlertTriangle size={16} className="flex-shrink-0" />
            <span>
              {storageInfo.atLimit
                ? `プロジェクト数が上限（${storageInfo.count}/${storageInfo.max}件）に達しています。不要なプロジェクトを削除するかバックアップしてください。`
                : `プロジェクト数: ${storageInfo.count}/${storageInfo.max}件 — 上限が近づいています。`}
              <span className="text-xs ml-2 opacity-70">（使用容量: {storageInfo.usedKB}KB）</span>
            </span>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={40} className="mx-auto text-[#D5D0C8] mb-4" />
            <p className="text-[#888880] mb-4">まだプロジェクトがありません</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => router.push('/projects/new')}
                className="px-4 py-2 bg-[#B8975A] text-white rounded-lg text-sm hover:bg-[#A6854D] transition-colors"
              >
                最初のLPを作成する
              </button>
              <button
                onClick={() => importRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#F5F3F0] border border-[#D5D0C8] rounded-lg text-sm text-[#666660] hover:border-[#B8975A] transition-colors"
              >
                <Upload size={14} />
                バックアップから復元
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(project => (
              <div
                key={project.id}
                className="bg-white border border-[#E5E0D8] rounded-lg p-5 hover:border-[#B8975A] transition-colors cursor-pointer group"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-medium truncate">{project.name}</h2>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[#888880]">
                      <span>{project.concept.offerName || '未設定'}</span>
                      <span>·</span>
                      <span>{project.pages.length}ページ</span>
                      <span>·</span>
                      <div className="flex gap-1">
                        {project.pages.map(p => (
                          <span key={p.id} title={PAGE_TYPE_META[p.pageType].label}>
                            {PAGE_TYPE_META[p.pageType].icon}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDuplicate(e, project.id)}
                      className="p-2 text-[#AAAAAA] hover:text-[#B8975A] transition-colors opacity-0 group-hover:opacity-100"
                      title="複製"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(project.id, project.name); }}
                      className="p-2 text-[#AAAAAA] hover:text-[#C47A5A] transition-colors opacity-0 group-hover:opacity-100"
                      title="削除"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={16} className="text-[#D5D0C8] group-hover:text-[#B8975A] transition-colors ml-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
