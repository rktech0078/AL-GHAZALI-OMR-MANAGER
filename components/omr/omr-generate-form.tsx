'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { saveOMRSheet } from '@/lib/actions/omr-actions';

const schema = z.object({
    examName: z.string().min(3, 'Exam name must be at least 3 characters'),
    schoolName: z.string().min(3, 'School name must be at least 3 characters'),
    totalQuestions: z.number().min(1).max(100),
    options: z.number().min(4).max(5),
    showKey: z.boolean(),
    answerKeyString: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function OMRGenerateForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [isPngLoading, setIsPngLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            examName: 'Mid Term Exam',
            schoolName: 'Al-Ghazali High School',
            totalQuestions: 20,
            options: 4,
            showKey: false,
            answerKeyString: '',
        },
    });

    const showKey = watch('showKey');

    const parseAnswerKey = (str?: string) => {
        if (!str) return undefined;
        return str.split(',').reduce((acc, pair) => {
            const [q, a] = pair.split('-');
            if (q && a) acc[q.trim()] = a.trim();
            return acc;
        }, {} as { [key: string]: string });
    };

    const generatePdfBlob = async (data: FormData) => {
        // 1. Save to Database
        const saveResult = await saveOMRSheet({
            examName: data.examName,
            schoolName: data.schoolName,
            totalQuestions: data.totalQuestions,
            options: data.options,
            showKey: data.showKey,
            answerKey: parseAnswerKey(data.answerKeyString),
        });

        if (!saveResult.success) {
            console.warn('Database save failed:', saveResult.error);
        }

        // 2. Generate PDF
        const queryParams = new URLSearchParams({
            examName: data.examName,
            schoolName: data.schoolName,
            questions: data.totalQuestions.toString(),
            options: data.options.toString(),
            showKey: data.showKey.toString(),
            answerKey: data.answerKeyString || '',
        });

        const response = await fetch(`/api/omr/generate?${queryParams.toString()}`);

        if (!response.ok) {
            throw new Error('Failed to generate PDF');
        }

        return await response.blob();
    };

    const onDownloadPdf = async (data: FormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const blob = await generatePdfBlob(data);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `omr-sheet-${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (err) {
            console.error(err);
            setError('An error occurred while generating the OMR sheet.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadPdfJs = async () => {
        if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.min.mjs';
            script.type = 'module';
            script.onload = () => {
                const pdfjs = (window as any).pdfjsLib;
                if (!pdfjs) {
                    reject(new Error("PDF.js loaded but object not found"));
                    return;
                }
                pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs';
                resolve(pdfjs);
            };
            script.onerror = () => reject(new Error("Failed to load PDF.js script"));
            document.head.appendChild(script);
        });
    };

    const onDownloadPng = async (data: FormData) => {
        setIsPngLoading(true);
        setError(null);

        try {
            console.log("Starting PNG generation...");
            const blob = await generatePdfBlob(data);
            console.log("PDF Blob generated, size:", blob.size);

            // Load PDF.js from CDN
            const pdfjs = await loadPdfJs();
            console.log("PDF.js loaded from CDN");

            // Convert PDF Blob to PNGs
            const arrayBuffer = await blob.arrayBuffer();
            const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            console.log("PDF document loaded, pages:", pdf.numPages);

            // Process each page
            for (let i = 1; i <= pdf.numPages; i++) {
                console.log(`Processing page ${i}...`);
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (!context) throw new Error('Canvas context not found');

                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                } as any).promise;

                // Convert to PNG and download
                const pngUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = `omr-sheet-${Date.now()}-page-${i}.png`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                console.log(`Page ${i} downloaded`);
            }

        } catch (err: any) {
            console.error("PNG Generation Error:", err);
            setError(`An error occurred: ${err.message || err}`);
        } finally {
            setIsPngLoading(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-gray-800">Generate OMR Sheet</h2>
                <p className="text-gray-500">Create custom OMR sheets for your exams</p>
            </div>

            <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Exam Name */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Exam Name</label>
                        <input
                            {...register('examName')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="e.g. Final Term 2024"
                        />
                        {errors.examName && <p className="text-red-500 text-xs">{errors.examName.message}</p>}
                    </div>

                    {/* School Name */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">School Name</label>
                        <input
                            {...register('schoolName')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                            placeholder="e.g. Al-Ghazali High School"
                        />
                        {errors.schoolName && <p className="text-red-500 text-xs">{errors.schoolName.message}</p>}
                    </div>

                    {/* Total Questions */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Total Questions</label>
                        <input
                            type="number"
                            {...register('totalQuestions', { valueAsNumber: true })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />
                        {errors.totalQuestions && <p className="text-red-500 text-xs">{errors.totalQuestions.message}</p>}
                    </div>

                    {/* Options per Question */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Options per Question</label>
                        <select
                            {...register('options', { valueAsNumber: true })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        >
                            <option value={4}>4 (A-D)</option>
                            <option value={5}>5 (A-E)</option>
                        </select>
                        {errors.options && <p className="text-red-500 text-xs">{errors.options.message}</p>}
                    </div>
                </div>

                {/* Answer Key Toggle */}
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <input
                        type="checkbox"
                        {...register('showKey')}
                        id="showKey"
                        className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="showKey" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Include Answer Key in PDF
                    </label>
                </div>

                {/* Dynamic Answer Key Input */}
                {showKey && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Answer Key (Format: 1-A,2-B,3-C)
                        </label>
                        <textarea
                            {...register('answerKeyString')}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all h-24"
                            placeholder="1-A, 2-B, 3-C..."
                        />
                        {errors.answerKeyString && <p className="text-red-500 text-xs">{errors.answerKeyString.message}</p>}
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={handleSubmit(onDownloadPdf)}
                        disabled={isLoading || isPngLoading}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating PDF...
                            </>
                        ) : (
                            'Download PDF'
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit(onDownloadPng)}
                        disabled={isPngLoading || isLoading}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isPngLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Generating PNG...
                            </>
                        ) : (
                            'Download PNG'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
