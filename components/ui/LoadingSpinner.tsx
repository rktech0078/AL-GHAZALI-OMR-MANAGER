import React from 'react';

interface LoadingSpinnerProps {
    variant?: 'inline' | 'page' | 'section';
    text?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({
    variant = 'inline',
    text = 'Loading...',
    size = 'md'
}: LoadingSpinnerProps) {

    // Size classes for the spinner
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4'
    };

    // Inline variant - small spinner for buttons
    if (variant === 'inline') {
        return (
            <div className="inline-flex items-center justify-center">
                <div className={`${sizeClasses[size]} border-white border-t-transparent rounded-full animate-spin`}></div>
            </div>
        );
    }

    // Page variant - full page loader
    if (variant === 'page') {
        return (
            <div className="fixed inset-0 z-loader flex items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-white rounded-full"></div>
                        </div>
                    </div>
                    {text && (
                        <p className="text-lg font-medium text-gray-700 animate-pulse">{text}</p>
                    )}
                </div>
            </div>
        );
    }

    // Section variant - section loader with text
    if (variant === 'section') {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                    <div className={`${sizeClasses[size]} border-indigo-200 border-t-indigo-600 rounded-full animate-spin`}></div>
                </div>
                {text && (
                    <p className="text-sm font-medium text-gray-600">{text}</p>
                )}
            </div>
        );
    }

    return null;
}
