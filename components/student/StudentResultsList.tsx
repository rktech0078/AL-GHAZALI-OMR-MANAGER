'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Result {
    id: string;
    percentage: number;
    grade: string;
    status: string;
    created_at: string;
    exam: {
        exam_name: string;
        exam_date: string | null;
    } | null;
}

interface StudentResultsListProps {
    initialResults: Result[];
}

export function StudentResultsList({ initialResults }: StudentResultsListProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredResults = initialResults.filter((result) =>
        result.exam?.exam_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                    Recent Results
                </h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search exams..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <svg
                        className="absolute w-4 h-4 text-gray-400 right-3 top-2.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>

            {filteredResults.length > 0 ? (
                <ul className="space-y-3">
                    {filteredResults.map((result) => (
                        <li
                            key={result.id}
                            className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Link href={`/student/results/${result.id}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                            {result.exam?.exam_name || 'Exam'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {result.exam?.exam_date
                                                ? new Date(result.exam.exam_date).toLocaleDateString()
                                                : 'Date not set'}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg font-bold text-indigo-600">
                                            {result.percentage}%
                                        </span>
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${result.status === 'pass'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {result.grade}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="py-8 text-center">
                    <p className="text-sm text-gray-500">
                        {searchTerm ? 'No exams found matching your search' : 'No results available yet'}
                    </p>
                    {!searchTerm && (
                        <p className="mt-1 text-xs text-gray-400">
                            Results will appear here after your exams are graded
                        </p>
                    )}
                </div>
            )}

            <div className="mt-4 text-center">
                <Link
                    href="/student/results"
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                    View all results →
                </Link>
            </div>
        </div>
    );
}
