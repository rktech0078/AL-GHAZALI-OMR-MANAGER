import React from 'react';

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 pt-16">
            {children}
        </div>
    );
}
