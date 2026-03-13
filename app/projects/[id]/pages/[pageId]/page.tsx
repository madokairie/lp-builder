'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Loader2, Eye, Code, FileText, Copy, Check, Download, RefreshCw, MessageCircle, Send, X } from 'lucide-react';
import { LPProject, PAGE_TYPE_META } from '@/app/lib/types';
import { getProject, updateProject } from '@/app/lib/store';

type ViewMode = 'preview' | 'html' | 'text';

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
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [refining, setRefining] = useState(false);
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
        body: JSON.stringify({ concept: project.concept, pageType: page.pageType, tone: project.tone }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'LP生成に失敗しました' }));
        throw new Error(err.error);
      }
      const { html, text } = await res.json();
      const updatedPages = project.pages.map(p =>
        p.id === pageId ? { ...p, generatedHtml: html, generatedText: text, generatedAt: new Date().toISOString() } : p
      );
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
            <div className="flex flex-col items-center justify-center py-32">
              <div className="text-5xl mb-4">{meta.icon}</div>
              <h2 className="text-lg font-medium mb-2">{meta.label}</h2>
              <p className="text-sm text-[#888880] mb-6 text-center max-w-md">
                コンセプトシートの情報をもとにAIが{meta.label}を生成します。<br />
                情報が足りない場合はプロジェクトページから追記してください。
              </p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-3 bg-[#B8975A] text-white rounded-lg text-sm font-medium hover:bg-[#A6854D] transition-colors disabled:opacity-50"
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {generating ? '生成中...' : 'AIでLPを生成する'}
              </button>
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
              <pre className="bg-[#1A1A1A] text-[#E5E0D8] rounded-lg p-6 text-xs leading-relaxed overflow-auto max-h-[80vh] whitespace-pre-wrap break-all">
                {page.generatedHtml}
              </pre>
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
