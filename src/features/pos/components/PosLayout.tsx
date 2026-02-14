import { Outlet, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, History, Settings, Wifi, WifiOff } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { usePowerSync } from "@powersync/react";
import { useEffect, useState } from "react";

export function PosLayout() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const db = usePowerSync();
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <div className="h-screen w-screen flex flex-col bg-slate-50 overflow-hidden">
            {/* POS Header */}
            <header className="h-14 bg-slate-900 text-white flex items-center justify-between px-4 shrink-0 shadow-md z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate({ to: "/" })}
                        className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                        <span className="font-medium">Dashboard</span>
                    </button>
                    <div className="h-6 w-px bg-slate-700 mx-2" />
                    <h1 className="text-lg font-bold tracking-tight">DigiStoq POS</h1>
                </div>

                <div className="flex items-center gap-4">
                    {/* Network Status */}
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                        <span>{isOnline ? "Online" : "Offline"}</span>
                    </div>

                    <div className="text-sm text-slate-400">
                        Cashier: <span className="text-white font-medium">{user?.user_metadata?.full_name || user?.email}</span>
                    </div>

                    <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Recent Transactions">
                        <History className="h-5 w-5" />
                    </button>
                    <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors" title="Settings">
                        <Settings className="h-5 w-5" />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden relative">
                <Outlet />
            </main>
        </div>
    );
}
