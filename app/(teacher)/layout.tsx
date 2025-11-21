import TeacherSidebar from '@/components/teacher/TeacherSidebar';

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 pt-16">
            <TeacherSidebar />
            <div className="md:pl-64 flex flex-col flex-1">
                <main className="flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
