import { NextRequest, NextResponse } from "next/server";
import { OMRPDFGenerator } from "@/lib/omr/pdf-generator";
import { createClient } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Role-based authorization - only admin and teacher can generate PDFs
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'teacher'].includes(profile.role)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = await request.json();
    const {
      students,
      examName = "OMR Answer Sheet",
      schoolName = "AL-GHAZALI HIGH SCHOOL",
      questions = 20,
      options = 4,
      showKey = false,
      answerKey = {},
      examId
    } = body;

    // Load Logo
    const logoPath = path.join(process.cwd(), "public", "al-ghazali-logo.png");
    let logoBuffer: Buffer | undefined;
    try {
      logoBuffer = await fs.promises.readFile(logoPath);
    } catch (error) {
      console.warn("Logo file not found, proceeding without logo.");
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
