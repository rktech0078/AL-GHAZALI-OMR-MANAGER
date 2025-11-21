import { NextRequest, NextResponse } from "next/server";
import { OMRPDFGenerator } from "@/lib/omr/pdf-generator";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      students,
      examName = "OMR Answer Sheet",
      schoolName = "Al-Ghazali OMR Manager",
      questions = 20,
      options = 4,
      showKey = false,
      answerKey = {},
      examId
    } = body;

    // Load Logo
    const logoPath = path.join(process.cwd(), "public", "al-ghazali-logo.png");
    let logoBuffer: Buffer | undefined;
    if (fs.existsSync(logoPath)) {
      logoBuffer = fs.readFileSync(logoPath);
    }

    // Generate PDF
    const generator = new OMRPDFGenerator({
      totalQuestions: parseInt(questions),
      options: parseInt(options),
      showKey,
      answerKey,
      examName,
      schoolName,
      logoBuffer,
      examId
    });

    let pdfBuffer: Buffer;

    if (students && Array.isArray(students) && students.length > 0) {
      pdfBuffer = await generator.generateBulk(students);
    } else {
      // Fallback for single/empty generation (though frontend should send students)
      pdfBuffer = await generator.generate();
    }

    // Return Response
    const uniqueId = `OMR-BULK-${Date.now()}`;
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="omr-sheets-${uniqueId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Generation Error:", error);
    return new NextResponse("An error occurred during PDF generation.", {
      status: 500,
    });
  }
}
