"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    CalendarDays,
    DollarSign,
    Users,
    Clock,
    TrendingUp,
    Sparkles,
    Plus,
    ArrowRight,
    AlertTriangle,
    Scissors,
    Star,
    UserPlus,
    Calendar,
    Timer,
    PhoneCall,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from "date-fns";
import { es } from "date-fns/locale";
import type { CitaConDetalles, Servicio, Cliente } from "@/lib/types";

export default function AdminDashboard() {
    const [todayCitas, setTodayCitas] = useState<CitaConDetalles[]>([]);
    const [weekCitas, setWeekCitas] = useState<CitaConDetalles[]>([]);
    const [monthCitas, setMonthCitas] = useState<CitaConDetalles[]>([]);
    const [totalClientes, setTotalClientes] = useState(0);
    const [newClientesMonth, setNewClientesMonth] = useState(0);
    const [popularService, setPopularService] = useState<string>("");
    const [upcomingCitas, setUpcomingCitas] = useState<CitaConDetalles[]>([]);
    const [loading, setLoading] = useState(true);
    const [dbError, setDbError] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const supabase = createClient();
            const now = new Date();
            const today = format(now, "yyyy-MM-dd");
            const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
            const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
            const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
            const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

            // Today's appointments
            const { data: todayData, error } = await supabase
                .from("citas")
                .select("*, clientes(*), servicios(*)")
                .gte("fecha_hora", `${today}T00:00:00`)
                .lte("fecha_hora", `${today}T23:59:59`)
                .neq("estado", "cancelado")
                .order("fecha_hora");

            if (error) {
                setDbError(true);
                setLoading(false);
                return;
            }

            setTodayCitas((todayData || []) as unknown as CitaConDetalles[]);

            // Week appointments
            const { data: weekData } = await supabase
                .from("citas")
                .select("*, clientes(*), servicios(*)")
                .gte("fecha_hora", `${weekStart}T00:00:00`)
                .lte("fecha_hora", `${weekEnd}T23:59:59`)
                .neq("estado", "cancelado");

            setWeekCitas((weekData || []) as unknown as CitaConDetalles[]);

            // Month appointments
            const { data: monthData } = await supabase
                .from("citas")
                .select("*, clientes(*), servicios(*)")
                .gte("fecha_hora", `${monthStart}T00:00:00`)
                .lte("fecha_hora", `${monthEnd}T23:59:59`)
                .neq("estado", "cancelado");

            setMonthCitas((monthData || []) as unknown as CitaConDetalles[]);

            // Total clients
            const { count: clientCount } = await supabase
                .from("clientes")
                .select("*", { count: "exact", head: true });

            setTotalClientes(clientCount || 0);

            // New clients this month
            const { count: newClients } = await supabase
                .from("clientes")
                .select("*", { count: "exact", head: true })
                .gte("created_at", `${monthStart}T00:00:00`);

            setNewClientesMonth(newClients || 0);

            // Most popular service this month
            const serviceCount: Record<string, { name: string; count: number }> = {};
            (monthData || []).forEach((c: Record<string, unknown>) => {
                const svc = c.servicios as Record<string, unknown> | null;
                if (svc) {
                    const id = svc.id as string;
                    if (!serviceCount[id]) {
                        serviceCount[id] = { name: svc.nombre as string, count: 0 };
                    }
                    serviceCount[id].count++;
                }
            });
            const sorted = Object.values(serviceCount).sort((a, b) => b.count - a.count);
            setPopularService(sorted[0]?.name || "—");

            // Upcoming (next 5 from now)
            const { data: upcomingData } = await supabase
                .from("citas")
                .select("*, clientes(*), servicios(*)")
                .gte("fecha_hora", now.toISOString())
                .in("estado", ["pendiente", "confirmado"])
                .order("fecha_hora")
                .limit(5);

            setUpcomingCitas((upcomingData || []) as unknown as CitaConDetalles[]);

            setLoading(false);
        };

        loadData();
    }, []);

    const calcRevenue = (citas: CitaConDetalles[]) =>
        citas
            .filter((c) => c.estado === "confirmado" || c.estado === "finalizado")
            .reduce((sum, c) => sum + Number(c.servicios?.precio || 0), 0);

    const todayRevenue = calcRevenue(todayCitas);
    const weekRevenue = calcRevenue(weekCitas);
    const monthRevenue = calcRevenue(monthCitas);
    const confirmed = todayCitas.filter((c) => c.estado === "confirmado").length;
    const pending = todayCitas.filter((c) => c.estado === "pendiente").length;
    const finalized = todayCitas.filter((c) => c.estado === "finalizado").length;

    // DB error
    if (dbError) {
        return (
            <div>
                <h1 className="text-2xl font-bold mb-6">Panel de Administración</h1>
                <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="p-8">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
                            <div>
                                <h2 className="text-lg font-bold text-amber-800 mb-2">Base de datos no configurada</h2>
                                <p className="text-amber-700 mb-4">Ejecuta el SQL en Supabase para crear las tablas:</p>
                                <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800 mb-4">
                                    <li>Supabase → <strong>SQL Editor</strong> → <strong>New query</strong></li>
                                    <li>Pega el contenido de <code className="bg-amber-100 px-1 rounded">001_initial_schema.sql</code></li>
                                    <li>Clic en <strong>Run</strong></li>
                                </ol>
                                <Button onClick={() => window.location.reload()} className="bg-pink-500 hover:bg-pink-600 text-white">
                                    Recargar
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const hora = new Date().getHours();
    const saludo = hora < 12 ? "Buenos días" : hora < 20 ? "Buenas tardes" : "Buenas noches";

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">
                        ¡{saludo}! <span className="gradient-text">✨</span>
                    </h1>
                    <p className="text-muted-foreground">
                        {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                </div>
                <Link href="/admin/agenda">
                    <Button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Cita
                    </Button>
                </Link>
            </div>

            {/* ============ ROW 1: TODAY'S STATS ============ */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                <Card className="border-pink-100/50">
                    <CardContent className="p-4 text-center">
                        <CalendarDays className="w-5 h-5 text-pink-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{todayCitas.length}</p>
                        <p className="text-xs text-muted-foreground">Citas hoy</p>
                    </CardContent>
                </Card>
                <Card className="border-pink-100/50">
                    <CardContent className="p-4 text-center">
                        <DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{todayRevenue.toFixed(0)}€</p>
                        <p className="text-xs text-muted-foreground">Hoy</p>
                    </CardContent>
                </Card>
                <Card className="border-pink-100/50">
                    <CardContent className="p-4 text-center">
                        <TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{weekRevenue.toFixed(0)}€</p>
                        <p className="text-xs text-muted-foreground">Esta semana</p>
                    </CardContent>
                </Card>
                <Card className="border-pink-100/50">
                    <CardContent className="p-4 text-center">
                        <BarChart className="w-5 h-5 text-purple-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{monthRevenue.toFixed(0)}€</p>
                        <p className="text-xs text-muted-foreground">Este mes</p>
                    </CardContent>
                </Card>
                <Card className="border-pink-100/50">
                    <CardContent className="p-4 text-center">
                        <Users className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{totalClientes}</p>
                        <p className="text-xs text-muted-foreground">Clientas total</p>
                    </CardContent>
                </Card>
                <Card className="border-pink-100/50">
                    <CardContent className="p-4 text-center">
                        <UserPlus className="w-5 h-5 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{newClientesMonth}</p>
                        <p className="text-xs text-muted-foreground">Nuevas este mes</p>
                    </CardContent>
                </Card>
            </div>

            {/* ============ ROW 2: STATUS + POPULAR + QUICK STATS ============ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Today's Status Breakdown */}
                <Card className="border-pink-100/50">
                    <CardContent className="p-5">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                            Estado de hoy
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                    <span className="text-sm">Confirmadas</span>
                                </div>
                                <span className="font-bold text-lg">{confirmed}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                                    <span className="text-sm">Pendientes</span>
                                </div>
                                <span className="font-bold text-lg">{pending}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                                    <span className="text-sm">Finalizadas</span>
                                </div>
                                <span className="font-bold text-lg">{finalized}</span>
                            </div>
                        </div>
                        {todayCitas.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-pink-100">
                                <div className="w-full bg-muted rounded-full h-3 flex overflow-hidden">
                                    {finalized > 0 && (
                                        <div className="bg-blue-400 h-full" style={{ width: `${(finalized / todayCitas.length) * 100}%` }} />
                                    )}
                                    {confirmed > 0 && (
                                        <div className="bg-green-400 h-full" style={{ width: `${(confirmed / todayCitas.length) * 100}%` }} />
                                    )}
                                    {pending > 0 && (
                                        <div className="bg-amber-400 h-full" style={{ width: `${(pending / todayCitas.length) * 100}%` }} />
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Popular Service */}
                <Card className="border-pink-100/50">
                    <CardContent className="p-5">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                            Servicio estrella del mes
                        </h3>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center">
                                <Star className="w-7 h-7 text-pink-500" />
                            </div>
                            <div>
                                <p className="font-bold text-lg">{popularService}</p>
                                <p className="text-sm text-muted-foreground">Más solicitado</p>
                            </div>
                        </div>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="bg-pink-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-pink-600">{monthCitas.length}</p>
                                <p className="text-[11px] text-muted-foreground">Citas del mes</p>
                            </div>
                            <div className="bg-pink-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-bold text-pink-600">
                                    {todayCitas.length > 0
                                        ? (todayCitas.reduce((s, c) => s + (c.servicios?.duracion_minutos || 0), 0) / 60).toFixed(1)
                                        : "0"
                                    }h
                                </p>
                                <p className="text-[11px] text-muted-foreground">Horas hoy</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-pink-100/50">
                    <CardContent className="p-5">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                            Acciones rápidas
                        </h3>
                        <div className="space-y-2">
                            <Link href="/admin/agenda" className="block">
                                <Button variant="outline" className="w-full justify-start border-pink-200 text-pink-600 hover:bg-pink-50">
                                    <Calendar className="w-4 h-4 mr-3" />
                                    Ver agenda de hoy
                                </Button>
                            </Link>
                            <Link href="/admin/clientes" className="block">
                                <Button variant="outline" className="w-full justify-start border-pink-200 text-pink-600 hover:bg-pink-50">
                                    <Users className="w-4 h-4 mr-3" />
                                    Buscar clienta
                                </Button>
                            </Link>
                            <Link href="/admin/servicios" className="block">
                                <Button variant="outline" className="w-full justify-start border-pink-200 text-pink-600 hover:bg-pink-50">
                                    <Scissors className="w-4 h-4 mr-3" />
                                    Gestionar servicios
                                </Button>
                            </Link>
                            <Link href="/admin/ingresos" className="block">
                                <Button variant="outline" className="w-full justify-start border-pink-200 text-pink-600 hover:bg-pink-50">
                                    <TrendingUp className="w-4 h-4 mr-3" />
                                    Ver ingresos
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ============ ROW 3: TODAY'S LIST + UPCOMING ============ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Today's Appointments */}
                <Card className="border-pink-100/50">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-pink-500" />
                                Citas de hoy
                            </h3>
                            <Link href="/admin/agenda">
                                <Button variant="ghost" size="sm" className="text-pink-600 text-xs">
                                    Ver agenda <ArrowRight className="w-3 h-3 ml-1" />
                                </Button>
                            </Link>
                        </div>

                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                                ))}
                            </div>
                        ) : todayCitas.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Sin citas hoy</p>
                                <Link href="/admin/agenda">
                                    <Button variant="outline" size="sm" className="mt-3 border-pink-200 text-pink-600">
                                        <Plus className="w-3 h-3 mr-1" /> Crear cita
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {todayCitas.map((cita) => (
                                    <div
                                        key={cita.id}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-pink-50/50 hover:bg-pink-50 transition-colors"
                                    >
                                        <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-xs">
                                            {format(new Date(cita.fecha_hora), "HH:mm")}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{cita.clientes?.nombre}</p>
                                            <p className="text-xs text-muted-foreground truncate">{cita.servicios?.nombre}</p>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={`text-[10px] ${cita.estado === "confirmado" ? "bg-green-100 text-green-700" :
                                                    cita.estado === "finalizado" ? "bg-blue-100 text-blue-700" :
                                                        "bg-amber-100 text-amber-700"
                                                }`}
                                        >
                                            {cita.estado}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming appointments */}
                <Card className="border-pink-100/50">
                    <CardContent className="p-5">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Timer className="w-4 h-4 text-pink-500" />
                            Próximas citas
                        </h3>

                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
                                ))}
                            </div>
                        ) : upcomingCitas.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Sin citas próximas</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {upcomingCitas.map((cita) => {
                                    const citaDate = new Date(cita.fecha_hora);
                                    const isToday = format(citaDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                                    return (
                                        <div
                                            key={cita.id}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-pink-50/50"
                                        >
                                            <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold leading-tight text-center">
                                                {isToday ? (
                                                    <span>{format(citaDate, "HH:mm")}</span>
                                                ) : (
                                                    <span>{format(citaDate, "d")}<br />{format(citaDate, "MMM", { locale: es })}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">{cita.clientes?.nombre}</p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {cita.servicios?.nombre} · {isToday ? format(citaDate, "HH:mm") : format(citaDate, "EEE d MMM HH:mm", { locale: es })}
                                                </p>
                                            </div>
                                            <span className="text-sm font-semibold text-pink-600">{cita.servicios?.precio}€</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function BarChart({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
        </svg>
    );
}
