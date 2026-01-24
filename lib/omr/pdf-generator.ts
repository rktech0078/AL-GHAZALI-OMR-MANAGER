import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

interface OMRGeneratorOptions {
    totalQuestions?: number;
    options?: number;
    showKey?: boolean;
    answerKey?: { [key: string]: string };
    examName?: string;
    schoolName?: string;
    logoBuffer?: Buffer;
    studentName?: string;
    studentId?: string;
    examId?: string;
    rollNumber?: string;
    studentClass?: string;
}

export interface StudentInfo {
    id: string;
    name: string;
    rollNumber?: string;
    className?: string;
}

export class OMRPDFGenerator {
    private doc: PDFKit.PDFDocument;
    private buffers: Buffer[] = [];
    private options: OMRGeneratorOptions;
    private pageMargin = 40;

    // Enterprise B&W color scheme
    private colors = {
        black: '#000000',
        white: '#FFFFFF',
        gray: '#E5E7EB',
        darkGray: '#4B5563'
    };

    constructor(options: OMRGeneratorOptions = {}) {
        this.options = {
            totalQuestions: 20,
            options: 4,
            showKey: false,
            answerKey: {},
            schoolName: "AL-GHAZALI HIGH SCHOOL",
            examName: "OMR Answer Sheet",
            ...options,
        };

        this.doc = new PDFDocument({
            size: "A4",
            margins: { top: 30, bottom: 0, left: this.pageMargin, right: this.pageMargin },
            autoFirstPage: false,
            bufferPages: true,
        });

        this.doc.on("data", this.buffers.push.bind(this.buffers));
    }

    private loadFont() {
        try {
            const fontPath = path.join(process.cwd(), "public", "fonts", "Inter-Bold.ttf");
            if (fs.existsSync(fontPath)) {
                this.doc.registerFont("Inter-Bold", fontPath);
                this.doc.font("Inter-Bold");
            } else {
                this.doc.font('Helvetica-Bold');
            }
        } catch (error) {
            this.doc.font('Helvetica-Bold');
        }
    }

    public async generate(): Promise<Buffer> {
        this.loadFont();
        await this.addPageForStudent({
            id: this.options.studentId || 'N/A',
            name: this.options.studentName || 'Sample Student',
            rollNumber: this.options.rollNumber,
            className: this.options.studentClass
        });

        this.addFooter(); // Call once at the end
        this.doc.end();

        return new Promise<Buffer>((resolve, reject) => {
            this.doc.on("end", () => resolve(Buffer.concat(this.buffers)));
            this.doc.on("error", reject);
        });
    }

    public async generateBulk(students: StudentInfo[]): Promise<Buffer> {
        this.loadFont();

        for (const student of students) {
            await this.addPageForStudent(student);
        }

        this.addFooter(); // Call once at the end
        this.doc.end();

        return new Promise<Buffer>((resolve, reject) => {
            this.doc.on("end", () => resolve(Buffer.concat(this.buffers)));
            this.doc.on("error", reject);
        });
    }

    private async addPageForStudent(student: StudentInfo) {
        this.doc.addPage({
            margins: { top: 30, bottom: 0, left: this.pageMargin, right: this.pageMargin },
        });

        const uniqueId = `OMR-${student.id.substring(0, 4)}-${Math.floor(Math.random() * 1000)}`;

        // Update current student state
        const originalName = this.options.studentName;
        const originalId = this.options.studentId;
        const originalRoll = this.options.rollNumber;
        const originalClass = this.options.studentClass;

        this.options.studentName = student.name;
        this.options.studentId = student.id;
        this.options.rollNumber = student.rollNumber;
        this.options.studentClass = student.className;

        // 1. Add Corner Anchors
        this.addCornerAnchors();

        // 2. Add Content Header (Refined Alignment)
        await this.addHeader(uniqueId);

        // 3. Add Info Section
        this.addStudentInfo();

        // 4. Add Instructions
        this.addInstructions();

        // 5. Add Answer Grid
        this.addAnswerGrid();

        // Revert options for next bulk iteration if needed
        this.options.studentName = originalName;
        this.options.studentId = originalId;
        this.options.rollNumber = originalRoll;
        this.options.studentClass = originalClass;
    }

    private addCornerAnchors() {
        const size = 15;
        const m = 20; // Anchor margin from edge

        this.doc.save();
        this.doc.fillColor(this.colors.black);

        // Top-Left
        this.doc.rect(m, m, size, size).fill();
        // Top-Right
        this.doc.rect(this.doc.page.width - m - size, m, size, size).fill();
        // Bottom-Left
        this.doc.rect(m, this.doc.page.height - m - size, size, size).fill();
        // Bottom-Right
        this.doc.rect(this.doc.page.width - m - size, this.doc.page.height - m - size, size, size).fill();
        this.doc.restore();
    }

    private async addHeader(uniqueId: string) {
        const startY = 45;
        const qrSize = 65;
        const logoSize = 55;
        const midY = startY + (qrSize / 2);

        // Enterprise Branding Bar (Top)
        this.doc
            .moveTo(this.pageMargin, startY - 15)
            .lineTo(this.doc.page.width - this.pageMargin, startY - 15)
            .lineWidth(2)
            .strokeColor(this.colors.black)
            .stroke();

        // 1. Logo (Left)
        const logoY = midY - (logoSize / 2);
        if (this.options.logoBuffer) {
            this.doc.image(this.options.logoBuffer, this.pageMargin, logoY, { width: logoSize });
        }

        const textStartX = this.pageMargin + (this.options.logoBuffer ? 65 : 0);

        // 2. School Info (Perfectly centered vertically with QR/Logo)
        this.doc.save();
        this.doc.fillColor(this.colors.black);

        // Calculate vertical offset for text block to center it against the 65pt height
        const textBlockHeight = 28; // Estimate for 16pt + 10pt + gap
        const textStartY = midY - (textBlockHeight / 2);

        this.doc
            .fontSize(16)
            .font('Helvetica-Bold')
            .text(this.options.schoolName?.toUpperCase() || "AL-GHAZALI HIGH SCHOOL", textStartX, textStartY);

        this.doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor(this.colors.darkGray)
            .text(this.options.examName || "OFFICIAL ANSWER SHEET", textStartX, textStartY + 18);
        this.doc.restore();

        const qrX = this.doc.page.width - this.pageMargin - qrSize;
        try {
            const qrDataObj = { e: this.options.examId || 'N/A', s: this.options.studentId || 'N/A' };
            const qrCodeData = await QRCode.toDataURL(JSON.stringify(qrDataObj), { errorCorrectionLevel: "H", margin: 0, width: 200 });
            this.doc.image(qrCodeData, qrX, startY, { width: qrSize });

            // 4. UID Text (Clearly below QR, refined size)
            this.doc
                .fontSize(7) // Increased from 6
                .font('Helvetica-Bold') // Bold for better visibility
                .fillColor(this.colors.darkGray)
                .text(`UID: ${uniqueId}`, qrX, startY + qrSize + 4, { width: qrSize, align: 'center' });
        } catch (e) { }

        this.doc.y = startY + qrSize + 25;
    }

    private addStudentInfo() {
        const startY = this.doc.y;
        const boxHeight = 22;
        const labelWidth = 90;
        const fullWidth = this.doc.page.width - this.pageMargin * 2;
        const halfWidth = fullWidth / 2;

        const fields = [
            { label: "NAME", value: this.options.studentName },
            { label: "ROLL NO", value: this.options.rollNumber },
            { label: "CLASS", value: this.options.studentClass }
        ];

        this.doc.save();
        this.doc.lineWidth(0.5).strokeColor(this.colors.black);

        fields.forEach((field, i) => {
            const y = startY + (i * boxHeight);
            this.doc.rect(this.pageMargin, y, fullWidth, boxHeight).stroke();
            this.doc.moveTo(this.pageMargin + labelWidth, y).lineTo(this.pageMargin + labelWidth, y + boxHeight).stroke();
            this.doc.fontSize(8).font('Helvetica-Bold').text(field.label, this.pageMargin + 10, y + 7);
            if (field.value) {
                this.doc.fontSize(10).font('Helvetica').text(field.value.toString().toUpperCase(), this.pageMargin + labelWidth + 10, y + 6);
            }
        });

        // Split row for Exam ID and Date
        const splitY = startY + (fields.length * boxHeight);

        // Date Box
        this.doc.rect(this.pageMargin, splitY, halfWidth, boxHeight).stroke();
        this.doc.moveTo(this.pageMargin + labelWidth, splitY).lineTo(this.pageMargin + labelWidth, splitY + boxHeight).stroke();
        this.doc.fontSize(8).font('Helvetica-Bold').text("DATE", this.pageMargin + 10, splitY + 7);
        const dateStr = new Date().toLocaleDateString('en-GB').replace(/\//g, ' / ');
        this.doc.fontSize(10).font('Helvetica').text(dateStr, this.pageMargin + labelWidth + 10, splitY + 6);

        // Exam ID Box
        this.doc.rect(this.pageMargin + halfWidth, splitY, halfWidth, boxHeight).stroke();
        this.doc.moveTo(this.pageMargin + halfWidth + labelWidth - 25, splitY).lineTo(this.pageMargin + halfWidth + labelWidth - 25, splitY + boxHeight).stroke();
        this.doc.fontSize(8).font('Helvetica-Bold').text("EXAM ID", this.pageMargin + halfWidth + 10, splitY + 7);
        this.doc.fontSize(9).font('Helvetica').text(this.options.examId || "---", this.pageMargin + halfWidth + labelWidth - 20, splitY + 7);

        this.doc.restore();
        this.doc.y = splitY + boxHeight + 15;
    }

    private addInstructions() {
        const startY = this.doc.y;
        const width = this.doc.page.width - this.pageMargin * 2;

        this.doc.save();
        this.doc.rect(this.pageMargin, startY, width, 45).lineWidth(0.8)
            .dash(3, { space: 3 })
            .strokeColor(this.colors.darkGray)
            .stroke();

        this.doc.undash();
        const inst = [
            "• Use BLACK pen or DARK pencil only. Fill the bubble COMPLETELY.",
            "• Do not fold, stray mark, or use whitener on this sheet.",
        ];

        this.doc.fontSize(8).font('Helvetica-Bold').fillColor(this.colors.black).text("IMPORTANT INSTRUCTIONS:", this.pageMargin + 10, startY + 8);
        this.doc.font('Helvetica').fontSize(7);
        inst.forEach((t, i) => this.doc.text(t, this.pageMargin + 15, startY + 18 + (i * 9)));
        this.doc.restore();
        this.doc.y = startY + 55;
    }

    private addAnswerGrid() {
        const startY = this.doc.y;
        const totalQuestions = this.options.totalQuestions || 50;
        const optionsCount = this.options.options || 4;

        // Dynamic Column Logic
        let questionsPerCol = 25;
        if (totalQuestions <= 20) questionsPerCol = 20;
        else if (totalQuestions <= 60) questionsPerCol = Math.ceil(totalQuestions / 2);
        else questionsPerCol = 25;

        const cols = Math.ceil(totalQuestions / questionsPerCol);
        const colGap = 30;
        const colWidth = (this.doc.page.width - this.pageMargin * 2 - (colGap * (cols - 1))) / cols;

        // Dynamic Spacing to fill page for low question counts
        let rowHeight = 16;
        let bubbleRadius = 5;
        let bubbleSpacing = 17;

        if (totalQuestions <= 20) {
            rowHeight = 22; // More spread out
            bubbleRadius = 6.5;
            bubbleSpacing = 22;
        } else if (totalQuestions <= 50) {
            rowHeight = 18;
            bubbleRadius = 5.5;
            bubbleSpacing = 19;
        }

        this.doc.save();
        for (let i = 0; i < totalQuestions; i++) {
            const colIndex = Math.floor(i / questionsPerCol);
            const rowIndex = i % questionsPerCol;
            const x = this.pageMargin + (colIndex * (colWidth + colGap));
            const y = startY + (rowIndex * rowHeight);

            if (rowIndex % 2 === 0) {
                this.doc.fillColor('#F9FAFB').rect(x, y, colWidth, rowHeight).fill();
            }

            // Question Num
            this.doc.fillColor(this.colors.black).fontSize(8).font('Helvetica-Bold').text(`${i + 1}.`, x + 2, y + 5, { width: 22, align: 'right' });

            // Bubbles
            for (let j = 0; j < optionsCount; j++) {
                const bx = x + 35 + (j * bubbleSpacing);
                const by = y + (rowHeight / 2);
                this.doc.circle(bx, by, bubbleRadius).lineWidth(0.7).strokeColor(this.colors.black).stroke();
                this.doc.fontSize(5).font('Helvetica').text(String.fromCharCode(65 + j), bx - 1, by - 2.5, { width: 10 });
            }

            // Extraordinary Detail: Timing Marks for scanner row tracking
            this.doc.rect(x + colWidth - 5, y + (rowHeight / 4), 3, rowHeight / 2).fill(this.colors.black);
        }
        this.doc.restore();

        // Signature Areas - Fixed to Bottom (Professional Enterprise Standard)
        const sigAreaY = this.doc.page.height - 100;
        const sigWidth = 140;

        this.doc.save();
        this.doc.lineWidth(0.8).dash(2, { space: 2 }).strokeColor(this.colors.black);

        // Student Signature
        this.doc.moveTo(this.pageMargin, sigAreaY).lineTo(this.pageMargin + sigWidth, sigAreaY).stroke();
        this.doc.undash()
            .fontSize(7)
            .font('Helvetica-Bold')
            .text("STUDENT SIGNATURE", this.pageMargin, sigAreaY + 8, { width: sigWidth, align: 'center' });

        // Invigilator Signature
        const invX = this.doc.page.width - this.pageMargin - sigWidth;
        this.doc.dash(2, { space: 2 }).moveTo(invX, sigAreaY).lineTo(invX + sigWidth, sigAreaY).stroke();
        this.doc.undash()
            .fontSize(7)
            .font('Helvetica-Bold')
            .text("INVIGILATOR SIGNATURE", invX, sigAreaY + 8, { width: sigWidth, align: 'center' });

        this.doc.restore();
    }

    private addFooter() {
        const pages = this.doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            this.doc.switchToPage(i);
            const y = this.doc.page.height - 25;
            this.doc.save();
            this.doc.fontSize(6.5).font('Helvetica').fillColor(this.colors.darkGray).text(
                `AL-GHAZALI OMR MANAGEMENT SYSTEM | PAGE ${i + 1} OF ${pages.count} | SECURE DOCUMENT`,
                0, y, { align: 'center', width: this.doc.page.width }
            );

            // Corner Registration Marks
            const size = 15;
            const m = 20;
            this.doc.fillColor(this.colors.black);
            this.doc.rect(m, this.doc.page.height - m - size, size, size).fill();
            this.doc.rect(this.doc.page.width - m - size, this.doc.page.height - m - size, size, size).fill();
            this.doc.restore();
        }
    }
}

