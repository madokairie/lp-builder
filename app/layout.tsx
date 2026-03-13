import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LP Builder — ローンチ用LP作成ツール',
  description: 'ファネルに合わせたLP（セールス・オプトイン・セミナー募集等）をAIで自動生成',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
