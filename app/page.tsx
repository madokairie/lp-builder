'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, FileText, ChevronRight } from 'lucide-react';
import { LPProject, PAGE_TYPE_META } from './lib/types';
import { getProjects, deleteProject } from './lib/store';

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<LPProject[]>([]);

  useEffect(() => {
    setProjects(getProjects());
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return;
    deleteProject(id);
    setProjects(getProjects());
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]" style={{ fontFamily: "'Georgia', 'Noto Serif JP', serif" }}>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-xs text-[#B8975A] tracking-[3px] uppercase mb-1">LP Builder</div>
            <h1 className="text-xl font-medium">ローンチ用LP作成ツール</h1>
          </div>
          <button
            onClick={() => router.push('/projects/new')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#B8975A] text-white rounded-lg text-sm font-medium hover:bg-[#A6854D] transition-colors"
          >
            <Plus size={16} />
            新規プロジェクト
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={40} className="mx-auto text-[#D5D0C8] mb-4" />
            <p className="text-[#888880] mb-4">まだプロジェクトがありません</p>
            <button
              onClick={() => router.push('/projects/new')}
              className="px-4 py-2 bg-[#B8975A] text-white rounded-lg text-sm hover:bg-[#A6854D] transition-colors"
            >
              最初のLPを作成する
            </button>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(project.id, project.name); }}
                      className="p-2 text-[#AAAAAA] hover:text-[#C47A5A] transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={16} className="text-[#D5D0C8] group-hover:text-[#B8975A] transition-colors" />
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
