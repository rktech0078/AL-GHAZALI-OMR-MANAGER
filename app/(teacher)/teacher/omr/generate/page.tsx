import { OMRGenerateForm } from "@/components/omr/omr-generate-form";

export default function OMRGeneratePage() {
    return (
        <div className="container mx-auto py-10 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">OMR Sheet Generator</h1>
                    <p className="text-gray-600 mt-2">
                        Design and download professional OMR sheets for your exams.
                    </p>
                </div>

                <OMRGenerateForm />
            </div>
        </div>
    );
}
