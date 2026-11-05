// File: app/api/extract-document/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType, customApiKey } = await req.json();
    const apiKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY missing! Add it in .env.local or paste in UI.' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert Indian Exam Form Assistant. Extract student details from this marksheet or ID document image.
Return ONLY a valid JSON object with these exact keys (use empty string "" if not found):
{
  "fullName": "Candidate Name in UPPERCASE without Mr/Ms/Shri/Kumari",
  "fatherName": "Father Name in UPPERCASE without Shri/Mr/Late/Md",
  "motherName": "Mother Name in UPPERCASE without Smt/Mrs/Late",
  "dob": "YYYY-MM-DD format (convert from DD/MM/YYYY or DD-MM-YYYY)",
  "rollNumber": "Roll Number",
  "rollCode": "Roll Code or School Code if mentioned",
  "passingYear": "4-digit Passing Year like 2020",
  "boardOrUniv": "Board Name in short like BSEB Patna, CBSE, HBSE",
  "percentageOrCgpa": "Percentage or GPA number only"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType || 'image/jpeg',
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || 'Gemini API Error' },
        { status: 500 }
      );
    }

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const extracted = JSON.parse(rawText);

    return NextResponse.json({ success: true, extracted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to parse document' },
      { status: 500 }
    );
  }
}