'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import Image from 'next/image';

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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Manual Student Selection State
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [studentSearch, setStudentSearch] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [stream, setStream] = useState<MediaStream | null>(null);

    const router = useRouter();

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    // Validate and set file
    const validateAndSetFile = (file: File) => {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Only JPEG and PNG are allowed.');
            return;
        }

        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('File too large. Maximum size is 10MB.');
            return;
        }

        setSelectedFile(file);
        setError(null);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    // Start camera
    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera on mobile
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setStream(mediaStream);
                setCameraActive(true);
                setError(null);
            }
        } catch (err) {
            console.error('Camera error:', err);
            setError('Failed to access camera. Please check permissions.');
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setCameraActive(false);
        }
    };

    // Capture photo from camera
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
                        const file = new File([blob], `omr-${Date.now()}.jpg`, { type: 'image/jpeg' });
                        validateAndSetFile(file);
                        stopCamera();
                    }
                }, 'image/jpeg', 0.95);
            }
        }
    };

    // Upload and process OMR
    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select an image first');
            return;
        }

        setUploading(true);
        setProgress(0);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('image', selectedFile);
            formData.append('examId', examId);
            if (studentId) {
                formData.append('studentId', studentId);
            }

            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const response = await fetch('/api/omr/upload', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);
            setProgress(100);

            const data = await response.json();

            if (!response.ok) {
                // Handle specific errors
                if (response.status === 422 && data.error === 'MISSING_STUDENT_ID') {
                    setError('Could not identify student from QR code. Please select manually.');
                    setShowStudentModal(true);
                    fetchStudents();
                    return;
                }
                throw new Error(data.error || 'Upload failed');
            }

            if (!data.success) {
                throw new Error(data.error || 'Upload failed');
            }

            setResult(data.result);

            if (onSuccess) {
                onSuccess(data);
            }

            // Redirect to result page after 2 seconds
            setTimeout(() => {
                router.push(`/student/results/${data.resultId}`);
            }, 2000);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed';
            setError(errorMessage);

            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setUploading(false);
        }
    };


    // Fetch students for manual selection
    const fetchStudents = async () => {
        if (students.length > 0) return;

        setLoadingStudents(true);
        try {
            const supabase = createSupabaseBrowserClient();

            // Get current user's school
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userData } = await supabase
                .from('users')
                .select('school_id')
                .eq('id', user.id)
                .single();

            if (userData?.school_id) {
                const { data: studentsData } = await supabase
                    .from('users')
                    .select('id, full_name, email')
                    .eq('role', 'student')
                    .eq('school_id', userData.school_id)
                    .order('full_name');

                if (studentsData) {
                    setStudents(studentsData);
                }
            }
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoadingStudents(false);
        }
    };

    // Handle manual student submission
    const handleManualSubmit = () => {
        if (!selectedStudentId) return;
        setShowStudentModal(false);
        // Retry upload with selected student ID
        // We need to modify handleUpload to accept an override ID or update the prop? 
        // Props are read-only. We can call a modified version of the upload logic.
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

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Upload failed');
            }

            setResult(data.result);
            if (onSuccess) onSuccess(data);

            setTimeout(() => {
                router.push(`/student/results/${data.resultId}`);
            }, 2000);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Upload failed';
            setError(errorMessage);
            if (onError) onError(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(studentSearch.toLowerCase())
    );

    // Reset form
    const handleReset = () => {
        setSelectedFile(null);
        setPreview(null);
        setResult(null);
        setError(null);
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-800">Upload OMR Sheet</h2>

                {/* Camera Section */}
                {!selectedFile && (
                    <div className="mb-6">
                        {!cameraActive ? (
                            <button
                                onClick={startCamera}
                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Open Camera
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full rounded-lg bg-black"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={capturePhoto}
                                        className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition"
                                    >
                                        Capture Photo
                                    </button>
                                    <button
                                        onClick={stopCamera}
                                        className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                )}

                {/* File Upload Section */}
                {!cameraActive && !selectedFile && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Or choose from gallery
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            onChange={handleFileSelect}
                            className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                cursor-pointer"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            Supported formats: JPEG, PNG (Max 10MB)
                        </p>
                    </div>
                )}

                {/* Preview Section */}
                {preview && selectedFile && !result && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preview
                        </label>
                        <Image
                            src={preview}
                            alt="OMR Preview"
                            width={0}
                            height={0}
                            className="w-full h-auto rounded-lg border-2 border-gray-300"
                            style={{ objectFit: 'contain' }}
                            sizes="100vw"
                        />
                        <div className="mt-4 flex gap-3">
                            <button
                                onClick={handleUpload}
                                disabled={uploading}
                                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {uploading ? 'Processing...' : 'Upload & Process'}
                            </button>
                            <button
                                onClick={handleReset}
                                disabled={uploading}
                                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition disabled:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Progress Bar */}
                {uploading && (
                    <div className="mb-6">
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div
                                className="bg-blue-600 h-full transition-all duration-300 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-center mt-2 text-sm text-gray-600">
                            Processing OMR sheet... {progress}%
                        </p>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        <p className="font-medium">Error</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Success Result */}
                {result && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-xl font-bold text-green-800">Processing Complete!</h3>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Marks Obtained:</span>
                                <span className="font-semibold">{result.obtainedMarks}/{result.totalMarks}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Percentage:</span>
                                <span className="font-semibold">{result.percentage}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Grade:</span>
                                <span className="font-semibold text-lg">{result.grade}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className={`font-semibold ${result.status === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                                    {result.status.toUpperCase()}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Confidence:</span>
                                <span className="font-semibold">{Math.round(result.confidence * 100)}%</span>
                            </div>
                        </div>

                        <p className="mt-4 text-xs text-gray-500">
                            Redirecting to detailed results...
                        </p>
                    </div>
                )}
            </div>

            {/* Manual Student Selection Modal */}
            {
                showStudentModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900">Select Student</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    The system couldn't identify the student automatically. Please select who this paper belongs to.
                                </p>
                            </div>

                            <div className="p-4">
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
                                />

                                <div className="max-h-60 overflow-y-auto space-y-2">
                                    {loadingStudents ? (
                                        <div className="text-center py-4 text-gray-500">Loading students...</div>
                                    ) : filteredStudents.length === 0 ? (
                                        <div className="text-center py-4 text-gray-500">No students found</div>
                                    ) : (
                                        filteredStudents.map(student => (
                                            <div
                                                key={student.id}
                                                onClick={() => setSelectedStudentId(student.id)}
                                                className={`p-3 rounded-lg cursor-pointer border transition-colors ${selectedStudentId === student.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <p className="font-medium text-gray-900">{student.full_name}</p>
                                                <p className="text-xs text-gray-500">{student.email}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 flex gap-3 bg-gray-50">
                                <button
                                    onClick={() => setShowStudentModal(false)}
                                    className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleManualSubmit}
                                    disabled={!selectedStudentId}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                >
                                    Confirm & Process
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
