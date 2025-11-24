'use client';

import { useState } from 'react';

export interface AIModel {
    id: string;
    name: string;
    description: string;
    type: 'opencv' | 'ai' | 'hybrid';
    provider?: string;
}

const AVAILABLE_MODELS: AIModel[] = [
    { id: 'auto', name: '🎯 Auto (Multi-Tier)', description: 'OpenCV → Groq → Gemini (Recommended)', type: 'hybrid' },
    { id: 'opencv', name: '📊 OpenCV Only', description: 'Fast library-based detection', type: 'opencv' },
    { id: 'groq', name: '🤖 Groq AI', description: 'Llama 3.2 Vision (Current)', type: 'ai', provider: 'Groq' },
    { id: 'gemini', name: '🛡️ Gemini 1.5 Flash', description: 'Google AI (Current)', type: 'ai', provider: 'Google' },
    { id: 'openrouter:x-ai/grok-beta', name: '⚡ Grok Beta', description: 'X.AI Vision Model', type: 'ai', provider: 'OpenRouter' },
    { id: 'openrouter:google/gemini-2.0-flash-exp:free', name: '🌟 Gemini 2.0 Flash', description: 'Latest Google Vision', type: 'ai', provider: 'OpenRouter' },
    { id: 'openrouter:qwen/qwen2.5-vl-32b-instruct:free', name: '🧠 Qwen Vision 32B', description: 'Qwen AI Model', type: 'ai', provider: 'OpenRouter' },
    { id: 'openrouter:meta-llama/llama-3.2-90b-vision-instruct:free', name: '🦙 Llama 3.2 Vision', description: 'Meta AI Model', type: 'ai', provider: 'OpenRouter' },
];

interface ModelSelectorProps {
    selectedModel: string;
    onModelChange: (modelId: string) => void;
    disabled?: boolean;
}

export function ModelSelector({ selectedModel, onModelChange, disabled }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    const selectedModelData = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Detection Method
                <span className="ml-2 text-xs text-gray-500">(Testing Purpose)</span>
            </label>

            <button
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white border-2 rounded-xl transition-all ${disabled
                        ? 'border-gray-200 cursor-not-allowed opacity-60'
                        : isOpen
                            ? 'border-indigo-500 ring-2 ring-indigo-100'
                            : 'border-gray-200 hover:border-indigo-300'
                    }`}
            >
                <div className="flex items-center gap-3">
                    <span className="text-xl">{selectedModelData.name.split(' ')[0]}</span>
                    <div className="text-left">
                        <p className="font-medium text-gray-900">{selectedModelData.name.substring(2)}</p>
                        <p className="text-xs text-gray-500">{selectedModelData.description}</p>
                    </div>
                </div>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-96 overflow-y-auto">
                        <div className="p-2 space-y-1">
                            {AVAILABLE_MODELS.map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        onModelChange(model.id);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg transition-all text-left ${selectedModel === model.id
                                            ? 'bg-indigo-50 border-2 border-indigo-500'
                                            : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-xl mt-0.5">{model.name.split(' ')[0]}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-gray-900">{model.name.substring(2)}</p>
                                            {model.provider && (
                                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                    {model.provider}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">{model.description}</p>
                                    </div>
                                    {selectedModel === model.id && (
                                        <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
