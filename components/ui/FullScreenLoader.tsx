import React from 'react';

interface FullScreenLoaderProps {
    text?: string;
}

export function FullScreenLoader({ text = 'Loading...' }: FullScreenLoaderProps) {
    return (
        <div className="fixed inset-0 z-loader flex items-center justify-center bg-white/80 backdrop-blur-md transition-opacity duration-300">
            <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white rounded-full"></div>
                    </div>
                </div>
                <p className="text-lg font-medium text-gray-700 animate-pulse">{text}</p>
            </div>
        </div>
    );
}
