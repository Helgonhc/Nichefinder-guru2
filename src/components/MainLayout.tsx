import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export const MainLayout = () => {
    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans antialiased">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden custom-scrollbar relative bg-slate-50">
                {/* Prestige Background Assets - Light Version */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-100/20 blur-[120px] -z-10 rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-50/30 blur-[100px] -z-10 rounded-full pointer-events-none" />

                <main className="flex-1 relative w-full max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
                    <Outlet />
                </main>

                <footer className="py-8 px-6 sm:px-10 border-t border-slate-200 relative z-10 w-full mt-auto bg-white/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em] text-center">
                            NicheFinder Guru &copy; 2026 // Vanguard SaaS Edition
                        </p>
                    </div>
                </footer>
            </div>
        </div>
    );
};
