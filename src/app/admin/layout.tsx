"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    Sparkles,
    LayoutDashboard,
    CalendarDays,
    Users,
    Scissors,
    BarChart3,
    ClipboardList,
    LogOut,
    Menu,
    X,
    Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
    { href: "/admin/clientes", label: "Clientes", icon: Users },
    { href: "/admin/servicios", label: "Servicios", icon: Scissors },
    { href: "/admin/ingresos", label: "Ingresos", icon: BarChart3 },
    { href: "/admin/lista-espera", label: "Lista de Espera", icon: ClipboardList },
];

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.push("/auth/login");
            } else {
                setLoading(false);
            }
        });
    }, [router]);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center animate-pulse-soft">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 border-r border-pink-100 bg-card p-6">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center shadow-md shadow-pink-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold gradient-text">Keroal</h1>
                        <p className="text-xs text-muted-foreground">Panel Admin</p>
                    </div>
                </div>

                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 px-3">
                    Gestión
                </p>
                <nav className="space-y-1 flex-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <div
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${isActive
                                            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20"
                                            : "text-muted-foreground hover:bg-pink-50 hover:text-pink-600"
                                        }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-pink-100 pt-4 mt-4 space-y-1">
                    <Link href="/" target="_blank">
                        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-pink-50 hover:text-pink-600 transition-all">
                            <Settings className="w-4 h-4" />
                            Ver web pública
                        </div>
                    </Link>
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full justify-start text-muted-foreground hover:text-red-500 hover:bg-red-50 px-4"
                    >
                        <LogOut className="w-4 h-4 mr-3" />
                        Cerrar Sesión
                    </Button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass border-b border-pink-100">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold gradient-text text-sm">Keroal Admin</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </Button>
                </div>
                {mobileMenuOpen && (
                    <div className="p-4 pt-0 space-y-1 animate-fade-in border-t border-pink-100">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href}>
                                <div
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${pathname === item.href
                                            ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                                            : "text-muted-foreground"
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </div>
                            </Link>
                        ))}
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="w-full justify-start text-muted-foreground mt-2"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Cerrar Sesión
                        </Button>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <main className="flex-1 lg:max-h-screen lg:overflow-y-auto">
                <div className="p-6 lg:p-8 pt-20 lg:pt-8">{children}</div>
            </main>
        </div>
    );
}
