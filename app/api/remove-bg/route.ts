import { NextRequest, NextResponse } from 'next/server';
import { env, AutoModel, AutoProcessor, RawImage } from '@xenova/transformers';
import sharp from 'sharp';

// Cache folder set karo
env.cacheDir = './.cache';
env.allowLocalModels = true;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    // Halka model - Vercel compatible, sirf 15MB
    const model = await AutoModel.from_pretrained('Xenova/modnet', {
      // quantized version - RAM kam khayega
      quantized: true,
    } as any);
    const processor = await AutoProcessor.from_pretrained('Xenova/modnet');

    const image = await RawImage.read(new Blob([buffer]));
    const { pixel_values } = await processor(image);
    const { output } = await model({ input: pixel_values });

    const mask = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(image.width, image.height).toBlob();
    const maskBuffer = Buffer.from(await mask.arrayBuffer());

    const result = await sharp(buffer)
      .ensureAlpha()
      .composite([{ input: maskBuffer, blend: 'dest-in' }])
      .png()
      .toBuffer();

    return new NextResponse(result, {
      headers: { 'Content-Type': 'image/png' },
    });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}