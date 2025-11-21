import React from 'react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description?: string;
    trend?: {
        value: string;
        isPositive: boolean;
    };
    bgColor?: string;
}

export function StatsCard({
    title,
    value,
    icon,
    description,
    trend,
    bgColor = 'bg-indigo-100'
}: StatsCardProps) {
    return (
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex flex-col space-y-2 flex-1">
                    <dt className="text-sm font-medium text-gray-500">{title}</dt>
                    <dd className="text-3xl font-bold text-gray-900">{value}</dd>
                    {description && (
                        <p className="text-xs text-gray-500">{description}</p>
                    )}
                    {trend && (
                        <div className="flex items-center text-xs">
                            <span
                                className={`font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'
                                    }`}
                            >
                                {trend.isPositive ? '↑' : '↓'} {trend.value}
                            </span>
                            <span className="ml-1 text-gray-500">vs last month</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 ${bgColor} rounded-full`}>{icon}</div>
            </div>
        </div>
    );
}
