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

    // Professional color scheme
    private colors = {
        primary: '#5B4BDA',      // Purple
        secondary: '#06B6D4',    // Cyan
        dark: '#1F2937',         // Dark gray
        medium: '#6B7280',       // Medium gray
        light: '#E5E7EB',        // Light gray
        accent: '#10B981',       // Green
        warning: '#F59E0B'       // Amber
    };

    constructor(options: OMRGeneratorOptions = {}) {
        this.options = {
            totalQuestions: 20,
            options: 4,
            showKey: false,
            answerKey: {},
            schoolName: "Al-Ghazali School",
            examName: "OMR Answer Sheet",
            ...options,
        };

        this.doc = new PDFDocument({
            size: "A4",
            margin: this.pageMargin,
            autoFirstPage: false,
            bufferPages: true,
        });

        this.doc.on("data", this.buffers.push.bind(this.buffers));
    }

    private loadFont() {
        try {
            const fontPath = path.join(process.cwd(), "public", "fonts", "Roboto-Regular.ttf");
            if (fs.existsSync(fontPath)) {
                this.doc.registerFont("Roboto-Regular", fontPath);
            } else {
                this.doc.font('Helvetica');
            }
        } catch (error) {
            this.doc.font('Helvetica');
        }
    }

    public async generate(): Promise<Buffer> {
        this.loadFont();
        await this.addPageForStudent({
            id: this.options.studentId || '',
            name: this.options.studentName || '',
            rollNumber: this.options.rollNumber,
            className: this.options.studentClass
        });
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

        this.doc.end();

        return new Promise<Buffer>((resolve, reject) => {
            this.doc.on("end", () => resolve(Buffer.concat(this.buffers)));
            this.doc.on("error", reject);
        });
    }

    private async addPageForStudent(student: StudentInfo) {
        this.doc.addPage({
            margins: { top: 30, bottom: 30, left: this.pageMargin, right: this.pageMargin },
        });

        const uniqueId = `OMR-${Date.now()}-${student.id.substring(0, 4)}`;

        this.options.studentName = student.name;
        this.options.studentId = student.id;
        this.options.rollNumber = student.rollNumber;
        this.options.studentClass = student.className;

        await this.addHeader(uniqueId);
        this.addStudentInfo();
        this.addInstructions();
        this.addAnswerGrid();
        this.addFooter();
    }

    private async addHeader(uniqueId: string) {
        const headerHeight = 85;
        const headerStartY = this.doc.y;

        // Header background
        this.doc
            .rect(this.pageMargin - 10, headerStartY - 10, this.doc.page.width - (this.pageMargin * 2) + 20, headerHeight)
            .fillAndStroke(this.colors.primary, this.colors.primary);

        // Logo (Left)
        if (this.options.logoBuffer) {
            this.doc.image(this.options.logoBuffer, this.pageMargin + 5, headerStartY + 5, {
                width: 50,
                height: 50
            });
        }

        // QR Code (Right) - FIXED for better scanning
        const qrCodeX = this.doc.page.width - this.pageMargin - 70;
        const qrDataObj = {
            e: this.options.examId || 'NO_EXAM',
            s: this.options.studentId || 'NO_STUDENT'
        };
        const qrData = JSON.stringify(qrDataObj);

        // Generate high-quality QR code
        const qrCodeData = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: "H",  // Highest error correction
            margin: 2,                   // More margin for better scanning
            width: 256,                  // Higher resolution
            color: {
                dark: '#000000',         // Pure black for maximum contrast
                light: '#FFFFFF'         // Pure white background
            }
        });
        // QR positioned at top of header (aligned with logo)
        this.doc.image(qrCodeData, qrCodeX, headerStartY, { width: 70 });

        // Center content
        const leftSafe = this.pageMargin + 65;
        const rightSafe = this.doc.page.width - this.pageMargin - 80;
        const centerWidth = rightSafe - leftSafe;

        // Exam name
        this.doc
            .fontSize(18)
            .font('Helvetica-Bold')
            .fillColor('#FFFFFF')
            .text(this.options.examName || "OMR ANSWER SHEET", leftSafe, headerStartY + 15, {
                width: centerWidth,
                align: "center",
            });

        // School name
        this.doc
            .fontSize(10)
            .font('Helvetica')
            .fillColor('#E0E7FF')
            .text(this.options.schoolName || "Al-Ghazali School", leftSafe, headerStartY + 38, {
                width: centerWidth,
                align: "center",
            });

        // Document ID
        this.doc
            .fontSize(7)
            .fillColor('#C7D2FE')
            .text(`ID: ${uniqueId}`, leftSafe, headerStartY + 55, {
                width: centerWidth,
                align: "center",
            });

        this.doc.y = headerStartY + headerHeight + 15;
        this.doc.fillColor(this.colors.dark);
    }

    private addStudentInfo() {
        // Section Title
        const titleY = this.doc.y;
        this.doc
            .rect(this.pageMargin - 5, titleY - 2, this.doc.page.width - (this.pageMargin * 2) + 10, 18)
            .fill(this.colors.primary);

        this.doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#FFFFFF')
            .text("STUDENT INFORMATION", this.pageMargin, titleY + 2);

        this.doc.moveDown(0.8);
        this.doc.fillColor(this.colors.dark);

        const fields = [
            { label: "Student Name", value: this.options.studentName },
            { label: "Roll Number", value: this.options.rollNumber },
            { label: "Class/Section", value: this.options.studentClass },
            { label: "Exam ID", value: this.options.examId }
        ];

        const fieldHeight = 26;
        const labelWidth = 100;

        fields.forEach((field) => {
            const currentY = this.doc.y;

            // Label
            this.doc
                .fontSize(9)
                .font('Helvetica-Bold')
                .fillColor(this.colors.medium)
                .text(`${field.label}:`, this.pageMargin, currentY + 7);

            // Field box
            this.doc
                .rect(
                    this.pageMargin + labelWidth,
                    currentY,
                    this.doc.page.width - this.pageMargin * 2 - labelWidth,
                    fieldHeight
                )
                .lineWidth(1)
                .strokeColor(this.colors.medium)
                .fillAndStroke('#FAFAFA', this.colors.medium);

            // Value
            if (field.value) {
                this.doc
                    .fontSize(10)
                    .font('Helvetica-Bold')
                    .fillColor(this.colors.dark)
                    .text(
                        field.value,
                        this.pageMargin + labelWidth + 5,
                        currentY + 7,
                        { width: this.doc.page.width - this.pageMargin * 2 - labelWidth - 10 }
                    );
            }

            this.doc.y = currentY + fieldHeight + 5;
        });

        this.doc.moveDown(0.4);
    }

    private addInstructions() {
        const boxY = this.doc.y;
        const boxHeight = 72;

        // Instructions box
        this.doc
            .rect(this.pageMargin, boxY, this.doc.page.width - this.pageMargin * 2, boxHeight)
            .lineWidth(2)
            .fillAndStroke('#FEF3C7', '#F59E0B');

        // Title bar
        this.doc
            .rect(this.pageMargin + 5, boxY + 5, 110, 15)
            .fill(this.colors.warning);

        this.doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .fillColor('#FFFFFF')
            .text("INSTRUCTIONS", this.pageMargin + 15, boxY + 8);

        // Instructions
        const instructions = [
            "1. Use DARK pencil (HB/2B) or BLACK pen only",
            "2. Fill bubbles COMPLETELY - like this: [FILLED]",
            "3. Do NOT make stray marks outside bubbles",
            "4. Erase cleanly if you change an answer",
            "5. Fill ONLY ONE bubble per question"
        ];

        this.doc
            .fontSize(7.5)
            .font('Helvetica')
            .fillColor(this.colors.dark);

        instructions.forEach((instruction, index) => {
            this.doc.text(instruction, this.pageMargin + 10, boxY + 28 + (index * 8.5), {
                width: this.doc.page.width - this.pageMargin * 2 - 20
            });
        });

        this.doc.y = boxY + boxHeight + 12;
    }

    private addAnswerGrid() {
        // Section Title
        const titleY = this.doc.y;
        this.doc
            .rect(this.pageMargin - 5, titleY - 2, this.doc.page.width - (this.pageMargin * 2) + 10, 18)
            .fill(this.colors.primary);

        this.doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .fillColor('#FFFFFF')
            .text("ANSWER SECTION", this.pageMargin, titleY + 2);

        this.doc.moveDown(0.6);
        this.doc.fillColor(this.colors.dark);

        const gridStartY = this.doc.y;
        const questionsPerColumn = 15;
        const maxColumnsPerPage = 4;
        const totalQuestions = this.options.totalQuestions || 20;
        const totalColumns = Math.ceil(totalQuestions / questionsPerColumn);

        const bubbleRadius = 7.5; // Bigger bubbles for easier filling
        const rowHeight = 21;
        const questionNumWidth = 26;
        const optionsCount = this.options.options || 4;

        let currentPageIndex = 0;
        let startPageY = gridStartY;

        for (let i = 1; i <= totalQuestions; i++) {
            const globalColIndex = Math.floor((i - 1) / questionsPerColumn);
            const pageIndex = Math.floor(globalColIndex / maxColumnsPerPage);
            const colIndexOnPage = globalColIndex % maxColumnsPerPage;
            const rowIndex = (i - 1) % questionsPerColumn;

            if (pageIndex > currentPageIndex) {
                this.doc.addPage({
                    margins: { top: 30, bottom: 30, left: this.pageMargin, right: this.pageMargin },
                });
                currentPageIndex = pageIndex;
                startPageY = this.doc.y + 20;
            }

            const columnsOnThisPage = Math.min(maxColumnsPerPage, totalColumns - pageIndex * maxColumnsPerPage);
            const columnSpacing = 22;
            const columnWidth = (this.doc.page.width - this.pageMargin * 2 - columnSpacing * (columnsOnThisPage - 1)) / columnsOnThisPage;
            const optionCellWidth = (columnWidth - questionNumWidth) / optionsCount;

            const currentColumnX = this.pageMargin + colIndexOnPage * (columnWidth + columnSpacing);
            const currentY = startPageY + 18 + rowIndex * rowHeight;

            // Column headers
            if (rowIndex === 0) {
                this.doc
                    .rect(currentColumnX + questionNumWidth - 2, startPageY, optionCellWidth * optionsCount + 4, 14)
                    .fill(this.colors.light);

                for (let j = 0; j < optionsCount; j++) {
                    this.doc
                        .fillColor(this.colors.primary)
                        .fontSize(9)
                        .font('Helvetica-Bold')
                        .text(
                            String.fromCharCode(65 + j),
                            currentColumnX + questionNumWidth + j * optionCellWidth,
                            startPageY + 2,
                            { width: optionCellWidth, align: "center" }
                        );
                }
            }

            // Question number
            const qNumBgWidth = 20;
            this.doc
                .rect(currentColumnX, currentY - 2, qNumBgWidth, 15)
                .fill(i % 2 === 0 ? '#F9FAFB' : '#FFFFFF');

            this.doc
                .fillColor(this.colors.dark)
                .fontSize(9)
                .font('Helvetica-Bold')
                .text(`${i}`, currentColumnX + 2, currentY + 1, { width: qNumBgWidth - 4, align: "center" });

            // Answer bubbles
            for (let j = 0; j < optionsCount; j++) {
                const bubbleX = currentColumnX + questionNumWidth + j * optionCellWidth + optionCellWidth / 2;
                const bubbleY = currentY + bubbleRadius;

                this.doc
                    .circle(bubbleX, bubbleY, bubbleRadius)
                    .lineWidth(1.3)
                    .strokeColor('#4B5563')
                    .stroke();
            }
        }

        this.doc.fillColor(this.colors.dark);
    }

    private addFooter() {
        const range = this.doc.bufferedPageRange();
        const count = range.count;

        for (let i = 0; i < count; i++) {
            this.doc.switchToPage(i);

            const originalBottomMargin = this.doc.page.margins.bottom;
            this.doc.page.margins.bottom = 0;
            const footerY = this.doc.page.height - originalBottomMargin;

            // Footer line
            this.doc
                .strokeColor(this.colors.light)
                .lineWidth(1)
                .moveTo(this.pageMargin, footerY)
                .lineTo(this.doc.page.width - this.pageMargin, footerY)
                .stroke();

            // Footer text
            const footerText = `Page ${i + 1} of ${count} | ${this.options.schoolName} | Auto-generated OMR Sheet`;
            this.doc
                .fontSize(7)
                .fillColor(this.colors.medium)
                .font('Helvetica')
                .text(footerText, this.pageMargin, footerY + 5, {
                    width: this.doc.page.width - this.pageMargin * 2,
                    align: "center",
                });

            this.doc.page.margins.bottom = originalBottomMargin;
        }

        if (count > 0) {
            this.doc.switchToPage(count - 1);
        }
    }
}
