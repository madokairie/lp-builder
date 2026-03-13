import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'ファイルを選択してください' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'PDFファイルを選択してください' }, { status: 400 });
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズは10MB以下にしてください' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    // Dynamic import to avoid bundling issues
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(process.cwd(), 'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs');

    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const numPages = pdf.numPages;

    const textParts: string[] = [];
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .filter((item: Record<string, unknown>) => 'str' in item)
        .map((item: Record<string, unknown>) => item.str as string)
        .join('');
      textParts.push(pageText);
    }

    await pdf.destroy();

    const text = textParts.join('\n\n').trim();

    // Count pages that actually have text
    const pagesWithText = textParts.filter(t => t.trim().length > 10).length;
    const isMostlyImage = pagesWithText < numPages * 0.3;

    if (!text || isMostlyImage) {
      return NextResponse.json({
        error: 'このPDFは画像で作られているためテキストを読み込めません。テキストベースのPDFをお使いください。',
      }, { status: 400 });
    }

    return NextResponse.json({
      text,
      pages: numPages,
      fileName: file.name,
    });
  } catch (error) {
    console.error('PDF parse error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `PDFの解析に失敗しました: ${msg}` }, { status: 500 });
  }
}
