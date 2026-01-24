'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { ModelSelector } from '@/components/omr/ModelSelector';
import { useAuth } from '@/lib/context/AuthContext';

interface OMRUploadProps {
    examId: string;
    studentId?: string;
    onSuccess?: (result: any) => void;
    onError?: (error: string) => void;
}

interface Student {
    id: string;
    full_name: string;
    email: string;
    roll_no?: string;
}

export default function OMRUpload({ examId, studentId, onSuccess, onError }: OMRUploadProps) {
    const { profile } = useAuth();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    // Manual Student Selection State
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [studentSearch, setStudentSearch] = useState('');

    // Camera State
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Model Selection State
    const [selectedModel, setSelectedModel] = useState<string>('auto');

    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setCameraActive(false);
    }, [stream]);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const validateAndSetFile = (file: File) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Only JPEG and PNG are allowed.');
            return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            setError('File too large. Maximum size is 10MB.');
            return;
        }

        setSelectedFile(file);
        setError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const startCamera = async () => {
        try {
            setCameraError(null);
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setStream(mediaStream);
                setCameraActive(true);
            }
        } catch (err) {
            console.error('Camera error:', err);
            setCameraError('Could not access camera. Please check permissions.');
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], `omr-scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        validateAndSetFile(file);
                        stopCamera();
                    }
                }, 'image/jpeg', 0.95);
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setProgress(0);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('examId', examId);
            if (studentId) formData.append('studentId', studentId);
            if (selectedModel !== 'auto') formData.append('forceModel', selectedModel);

            const interval = setInterval(() => {
                setProgress(prev => Math.min(prev + 5, 90));
            }, 100);

            const response = await fetch('/api/omr/upload', {
                method: 'POST',
                body: formData
            });

            clearInterval(interval);
            setProgress(100);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422 && data.error === 'MISSING_STUDENT_ID') {
                    setError('Could not identify student from QR code.');
                    setShowStudentModal(true);
                    fetchStudents();
                    return;
                }
                throw new Error(data.error || 'Upload failed');
            }

            if (!data.success) throw new Error(data.error || 'Upload failed');
            setResult(data.result);
            if (onSuccess) onSuccess(data);
        } catch (err: any) {
            setError(err.message || 'Upload failed');
            if (onError) onError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const fetchStudents = async () => {
        if (students.length > 0 || !profile?.school_id) return;
        setLoadingStudents(true);
        try {
            const supabase = createSupabaseBrowserClient();
            const { data: studentsData } = await supabase
                .from('users')
                .select('id, full_name, email')
                .eq('role', 'student')
                .eq('school_id', profile.school_id)
                .order('full_name');
            if (studentsData) setStudents(studentsData);
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoadingStudents(false);
        }
    };

    const handleManualSubmit = () => {
        if (!selectedStudentId) return;
        setShowStudentModal(false);
        retryUploadWithStudent(selectedStudentId);
    };

    const retryUploadWithStudent = async (manualStudentId: string) => {
        if (!selectedFile) return;
        setUploading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('examId', examId);
            formData.append('studentId', manualStudentId);
            const response = await fetch('/api/omr/upload', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || 'Upload failed');
            setResult(data.result);
            if (onSuccess) onSuccess(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const handleReset = () => {
        setSelectedFile(null);
        setPreview(null);
        setResult(null);
        setError(null);
        setProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="w-full">
            {cameraActive && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col">
                    <div className="relative flex-1 bg-black overflow-hidden">
                        <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                            <div className="w-[85%] aspect-[3/4] border-2 border-white/50 rounded-lg relative">
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 -mt-1 -ml-1"></div>
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 -mt-1 -mr-1"></div>
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 -mb-1 -ml-1"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 -mb-1 -mr-1"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-white/80 text-sm font-medium bg-black/40 px-3 py-1 rounded-full">Align OMR Sheet Here</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-black/90 p-6 pb-10 flex items-center justify-between">
                        <button onClick={stopCamera} className="text-white p-4 rounded-full hover:bg-white/10 transition"><span className="text-sm font-medium">Cancel</span></button>
                        <button onClick={capturePhoto} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group"><div className="w-16 h-16 bg-white rounded-full group-hover:scale-90 transition-transform"></div></button>
                        <div className="w-16"></div>
                    </div>
                </div>
            )}

            <div className="space-y-8">
                {!selectedFile && (
                    <div className="mb-8 max-w-md">
                        <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} disabled={uploading} />
                    </div>
                )}

                {!selectedFile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] cursor-pointer group ${dragActive ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} >
                            <input ref={fileInputRef} type="file" className="hidden" accept="image/jpeg,image/jpg,image/png" onChange={handleFileSelect} />
                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Drop OMR Sheet Here</h3>
                            <p className="text-gray-500 mb-6">or click to browse from device</p>
                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Supports JPG, PNG</span>
                        </div>
                        <div onClick={startCamera} className="relative border-2 border-gray-200 rounded-3xl p-10 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[300px] cursor-pointer hover:border-indigo-400 hover:bg-gray-50 group">
                            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Use Camera</h3>
                            <p className="text-gray-500 mb-6">Scan directly using webcam or mobile</p>
                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Instant Capture</span>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="relative h-96 md:h-auto bg-gray-900 flex items-center justify-center">
                                {preview && <Image src={preview} alt="Preview" fill className="object-contain p-4" />}
                                <button onClick={handleReset} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition" disabled={uploading}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                            <div className="p-8 flex flex-col justify-center">
                                {!result ? (
                                    <>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Process</h3>
                                        <p className="text-gray-500 mb-8">Image captured successfully. Click below to start AI analysis.</p>
                                        {uploading ? (
                                            <div className="space-y-4">
                                                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden"><div className="bg-indigo-600 h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div></div>
                                                <p className="text-center text-sm font-medium text-indigo-600 animate-pulse">Analyzing bubbles & QR code...</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <Button onClick={handleUpload} className="w-full py-4 text-lg shadow-lg shadow-indigo-200">Process OMR Sheet</Button>
                                                <button onClick={handleReset} className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium">Retake / Choose Another</button>
                                            </div>
                                        )}
                                        {error && (
                                            <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3">
                                                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <span className="text-sm">{error}</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center animate-slide-up">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-1">Analysis Complete!</h3>
                                        <p className="text-gray-500 mb-6">OMR sheet processed successfully</p>
                                        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                            <div className="flex justify-between items-center"><span className="text-gray-600">Score</span><span className="text-xl font-bold text-gray-900">{result.obtainedMarks}/{result.totalMarks}</span></div>
                                            <div className="flex justify-between items-center"><span className="text-gray-600">Percentage</span><span className="text-lg font-bold text-indigo-600">{result.percentage}%</span></div>
                                            <div className="flex justify-between items-center"><span className="text-gray-600">Grade</span><span className={`text-lg font-bold ${result.status === 'pass' ? 'text-green-600' : 'text-red-600'}`}>{result.grade}</span></div>
                                            <div className="pt-2 mt-2 border-t border-gray-200">
                                                <div className="flex justify-between items-center"><span className="text-xs text-gray-500">Processing Method</span><span className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded-full">{result.processingMethod === 'library' ? '✓ Standard Scan' : result.processingMethod === 'hybrid' ? '⚡ Enhanced (AI)' : result.processingMethod === 'groq-ai' ? '🤖 AI (Groq)' : result.processingMethod === 'gemini-ai' ? '🛡️ AI (Gemini)' : 'AI'}</span></div>
                                                <div className="flex justify-between items-center mt-2"><span className="text-xs text-gray-500">Accuracy</span><span className="text-xs font-medium text-green-600">{Math.round(result.confidence * 100)}%</span></div>
                                            </div>
                                        </div>
                                        <button onClick={handleReset} className="mt-6 w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium transition-colors">Process Another Sheet</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            {showStudentModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-xl font-bold text-gray-900">Select Student</h3>
                            <p className="text-sm text-gray-500 mt-1">We couldn't read the QR code. Who does this paper belong to?</p>
                        </div>
                        <div className="p-4">
                            <input type="text" placeholder="Search student name..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" autoFocus />
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {loadingStudents ? (
                                    <div className="text-center py-8 text-gray-400">Loading...</div>
                                ) : filteredStudents.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">No students found</div>
                                ) : (
                                    filteredStudents.map(student => (
                                        <div key={student.id} onClick={() => setSelectedStudentId(student.id)} className={`p-3 rounded-xl cursor-pointer border transition-all ${selectedStudentId === student.id ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-gray-100 hover:bg-gray-50'}`} >
                                            <p className="font-bold text-gray-900">{student.full_name}</p>
                                            <p className="text-xs text-gray-500">{student.email}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
                            <button onClick={() => setShowStudentModal(false)} className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors">Cancel</button>
                            <Button onClick={handleManualSubmit} disabled={!selectedStudentId} className="flex-1">Confirm & Process</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
