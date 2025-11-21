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
    private pageMargin = 35;

    constructor(options: OMRGeneratorOptions = {}) {
        this.options = {
            totalQuestions: 20,
            options: 4,
            showKey: false,
            answerKey: {},
            schoolName: "Al-Ghazali High School",
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
        const fontPath = path.join(process.cwd(), "public", "fonts", "Roboto-Regular.ttf");
        if (fs.existsSync(fontPath)) {
            this.doc.registerFont("Roboto-Regular", fontPath);
        } else {
            // Fallback to standard font if custom font missing
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
            font: "Roboto-Regular",
            margins: { top: 30, bottom: 30, left: this.pageMargin, right: this.pageMargin },
        });

        const uniqueId = `OMR-${Date.now()}-${student.id.substring(0, 4)}`;

        // Update options for current student context
        this.options.studentName = student.name;
        this.options.studentId = student.id;
        this.options.rollNumber = student.rollNumber;
        this.options.studentClass = student.className;

        await this.addHeader(uniqueId);
        this.addStudentInfo();
        this.addAnswerGrid();
        this.addFooter();
    }

    private async addHeader(uniqueId: string) {
        const headerStartY = this.doc.y;
        // Logo (Left)
        if (this.options.logoBuffer) {
            this.doc.image(this.options.logoBuffer, this.pageMargin, headerStartY, { width: 50 });
        }

        // QR Code (Right) - Simple Exam ID + Student ID
        const qrCodeX = this.doc.page.width - this.pageMargin - 60;

        // JSON Data for QR: { e: ExamID, s: StudentID }
        // Compact keys to keep QR code simple and scannable
        const qrDataObj = {
            e: this.options.examId || 'NO_EXAM',
            s: this.options.studentId || 'NO_STUDENT'
        };
        const qrData = JSON.stringify(qrDataObj);

        this.doc
            .fontSize(7)
            .fillColor("#666666")
            .text(uniqueId, qrCodeX - 60, headerStartY, {
                width: 120,
                align: "right",
            });

        const qrCodeData = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: "M",
            margin: 1,
            width: 60,
        });
        this.doc.image(qrCodeData, qrCodeX, headerStartY + 12, { width: 60 });

        // Center Text (Exam Name & School Name) - Aligned with Logo/QR
        // Calculate center area
        const leftSafe = this.pageMargin + 60; // Margin + Logo + Padding
        const rightSafe = this.doc.page.width - this.pageMargin - 70; // Width - Margin - QR - Padding
        const centerWidth = rightSafe - leftSafe;

        // Move to top for text
        this.doc.y = headerStartY + 10; // Slight top padding to align with logo center visually

        this.doc
            .font("Roboto-Regular")
            .fontSize(18)
            .fillColor("#333333")
            .text(this.options.examName || "OMR Answer Sheet", leftSafe, this.doc.y, {
                width: centerWidth,
                align: "center",
            });

        this.doc.moveDown(0.3);

        this.doc
            .fontSize(10)
            .fillColor("#666666")
            .text(this.options.schoolName || "Al-Ghazali OMR Manager", leftSafe, this.doc.y, {
                width: centerWidth,
                align: "center",
            });

        // Set Y to the maximum height of the header elements (approx 75px from start)
        this.doc.y = headerStartY + 75;

        this.doc
            .strokeColor("#dddddd")
            .lineWidth(0.5)
            .moveTo(this.pageMargin, this.doc.y)
            .lineTo(this.doc.page.width - this.pageMargin, this.doc.y)
            .stroke();
        this.doc.moveDown(0.5);
    }

    private addStudentInfo() {
        this.doc
            .fontSize(12)
            .fillColor("#333333")
            .text("Student Information", this.pageMargin + 5, this.doc.y);
        this.doc.moveDown(0.5);

        // Define fields with their values (if available)
        const fields = [
            { label: "Name", value: this.options.studentName },
            { label: "Roll Number", value: this.options.rollNumber },
            { label: "Class", value: this.options.studentClass },
            { label: "Exam ID", value: this.options.examId }
        ];

        const fieldHeight = 20;

        fields.forEach((field) => {
            const currentY = this.doc.y;
            this.doc
                .fontSize(10)
                .fillColor("#555555")
                .text(`${field.label}:`, this.pageMargin, currentY + 5);

            // Draw box
            this.doc
                .rect(
                    this.pageMargin + 70,
                    currentY,
                    this.doc.page.width - this.pageMargin * 2 - 70,
                    fieldHeight,
                )
                .stroke();

            // Fill value if exists
            if (field.value) {
                this.doc
                    .fontSize(10)
                    .fillColor("#000000")
                    .text(
                        field.value,
                        this.pageMargin + 75,
                        currentY + 5,
                        { width: this.doc.page.width - this.pageMargin * 2 - 80 }
                    );
            }

            this.doc.y = currentY + fieldHeight + 5;
        });
        this.doc.moveDown(0.5);
    }

    private addAnswerGrid() {
        this.doc
            .fontSize(12)
            .fillColor("#333333")
            .text("Answers", this.pageMargin + 5, this.doc.y);
        this.doc.moveDown(0.2);

        const gridStartY = this.doc.y;
        const questionsPerColumn = 15;
        const maxColumnsPerPage = 4;
        const totalQuestions = this.options.totalQuestions || 20;

        // Calculate total columns needed
        const totalColumns = Math.ceil(totalQuestions / questionsPerColumn);

        const bubbleRadius = 6;
        const rowHeight = 19;
        const questionNumWidth = 25;
        const optionsCount = this.options.options || 4;

        // We need to track current page and position
        let currentPageIndex = 0;
        let startPageY = gridStartY;

        for (let i = 1; i <= totalQuestions; i++) {
            // Calculate which column this question belongs to (0-indexed globally)
            const globalColIndex = Math.floor((i - 1) / questionsPerColumn);
            // Calculate which page this column belongs to
            const pageIndex = Math.floor(globalColIndex / maxColumnsPerPage);
            // Calculate column index relative to the page
            const colIndexOnPage = globalColIndex % maxColumnsPerPage;
            // Calculate row index
            const rowIndex = (i - 1) % questionsPerColumn;

            // Check if we need to add a new page
            if (pageIndex > currentPageIndex) {
                this.doc.addPage({
                    font: "Roboto-Regular",
                    margins: {
                        top: 30,
                        bottom: 30,
                        left: this.pageMargin,
                        right: this.pageMargin,
                    },
                });
                currentPageIndex = pageIndex;
                startPageY = this.doc.y + 20; // Add some top margin for grid on new page
            }

            // Calculate column width for THIS page
            const columnsOnThisPage = Math.min(maxColumnsPerPage, totalColumns - pageIndex * maxColumnsPerPage);

            const columnSpacing = 30;
            const columnWidth =
                (this.doc.page.width - this.pageMargin * 2 - columnSpacing * (columnsOnThisPage - 1)) /
                columnsOnThisPage;
            const optionCellWidth = (columnWidth - questionNumWidth) / optionsCount;

            const currentColumnX =
                this.pageMargin + colIndexOnPage * (columnWidth + columnSpacing);

            // Use startPageY for the current page
            const currentY = startPageY + 15 + rowIndex * rowHeight;

            // Draw Headers (only for first row of each column)
            if (rowIndex === 0) {
                for (let j = 0; j < optionsCount; j++) {
                    this.doc
                        .fillColor("#333333")
                        .fontSize(9)
                        .text(
                            String.fromCharCode(65 + j),
                            currentColumnX + questionNumWidth + j * optionCellWidth,
                            startPageY, // Header at top of column
                            { width: optionCellWidth, align: "center" },
                        );
                }
            }

            // Draw Question Number and Bubbles
            this.doc
                .fillColor("#333333")
                .fontSize(9)
                .text(`${i}.`, currentColumnX, currentY, { width: questionNumWidth });

            for (let j = 0; j < optionsCount; j++) {
                this.doc
                    .circle(
                        currentColumnX +
                        questionNumWidth +
                        j * optionCellWidth +
                        optionCellWidth / 2,
                        currentY + bubbleRadius / 2,
                        bubbleRadius,
                    )
                    .lineWidth(0.8)
                    .stroke();
            }
        }
    }

    private addFooter() {
        const range = this.doc.bufferedPageRange();
        const count = range.count;

        for (let i = 0; i < count; i++) {
            this.doc.switchToPage(i);

            // Save original bottom margin and set to 0 to allow writing in footer area
            const originalBottomMargin = this.doc.page.margins.bottom;
            this.doc.page.margins.bottom = 0;

            const footerY = this.doc.page.height - originalBottomMargin;

            this.doc
                .strokeColor("#dddddd")
                .lineWidth(0.5)
                .moveTo(this.pageMargin, footerY)
                .lineTo(this.doc.page.width - this.pageMargin, footerY)
                .stroke();

            const footerText = `Page ${i + 1} of ${count} - This is a computer-generated document from the IT Department of ${this.options.schoolName}.`;
            this.doc
                .fontSize(8)
                .fillColor("#888888")
                .text(footerText, this.pageMargin, footerY + 5, {
                    width: this.doc.page.width - this.pageMargin * 2,
                    align: "center",
                });

            // Restore bottom margin
            this.doc.page.margins.bottom = originalBottomMargin;
        }
        // Switch back to last page
        if (count > 0) {
            this.doc.switchToPage(count - 1);
        }
    }

    private addAnswerKey() {
        this.doc.addPage({ font: "Roboto-Regular" });
        this.doc
            .font("Roboto-Regular")
            .fontSize(16)
            .text("Answer Key", { align: "center" });
        this.doc.moveDown();

        const answerKey = this.options.answerKey || {};
        const sortedKeys = Object.keys(answerKey).sort((a, b) => parseInt(a) - parseInt(b));

        const answersPerRow = 5;
        let text = "";

        sortedKeys.forEach((q, index) => {
            text += `Q${q}: ${answerKey[q]}   `;

            if ((index + 1) % answersPerRow === 0 && index < sortedKeys.length - 1) {
                text += "\n";
            }
        });

        this.doc.fontSize(11).text(text, {
            width: this.doc.page.width - this.pageMargin * 2,
            align: "left",
            lineGap: 5
        });
    }
}
