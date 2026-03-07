"use client";

import { useEffect, useState, useCallback } from "react";
import {
    DollarSign,
    TrendingUp,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Scissors,
    Users,
    BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import {
    format, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
    addMonths, subMonths, addWeeks, subWeeks, eachDayOfInterval,
} from "date-fns";
import { es } from "date-fns/locale";
import type { CitaConDetalles } from "@/lib/types";

export default function IngresosPage() {
    const [period, setPeriod] = useState<"week" | "month">("month");
    const [currentDate, setCurrentDate] = useState(new Date());
    const [citas, setCitas] = useState<CitaConDetalles[]>([]);
    const [loading, setLoading] = useState(true);

    const getRange = useCallback(() => {
        if (period === "week") {
            return { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
        }
        return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }, [period, currentDate]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const supabase = createClient();
            const { start, end } = getRange();
            const { data } = await supabase
                .from("citas").select("*, clientes(*), servicios(*)")
                .gte("fecha_hora", start.toISOString()).lte("fecha_hora", end.toISOString())
                .neq("estado", "cancelado").order("fecha_hora");
            setCitas((data || []) as unknown as CitaConDetalles[]);
            setLoading(false);
        };
        load();
    }, [getRange]);

    const nav = (d: number) => {
        setCurrentDate(period === "week" ? (d > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1)) : (d > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1)));
    };

    const rev = citas.filter(c => c.estado === "confirmado" || c.estado === "finalizado").reduce((s, c) => s + Number(c.servicios?.precio || 0), 0);
    const avg = citas.length > 0 ? rev / citas.length : 0;
    const clients = new Set(citas.map(c => c.id_cliente)).size;

    const byService: Record<string, { name: string; count: number; revenue: number }> = {};
    citas.forEach(c => {
        if (!c.servicios) return;
        const id = c.id_servicio;
        if (!byService[id]) byService[id] = { name: c.servicios.nombre, count: 0, revenue: 0 };
        byService[id].count++;
        if (c.estado === "confirmado" || c.estado === "finalizado") byService[id].revenue += Number(c.servicios.precio || 0);
    });
    const svcList = Object.values(byService).sort((a, b) => b.revenue - a.revenue);

    const { start, end } = getRange();
    const days = eachDayOfInterval({ start, end });
    const byDay = days.map(day => {
        const ds = format(day, "yyyy-MM-dd");
        const dc = citas.filter(c => format(new Date(c.fecha_hora), "yyyy-MM-dd") === ds);
        const dr = dc.filter(c => c.estado === "confirmado" || c.estado === "finalizado").reduce((s, c) => s + Number(c.servicios?.precio || 0), 0);
        return { day, ds, count: dc.length, rev: dr };
    });
    const maxR = Math.max(...byDay.map(d => d.rev), 1);

    return (
        <div>
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div><h1 className="text-2xl font-bold">Ingresos y Estadísticas</h1><p className="text-muted-foreground">Analiza el rendimiento del salón</p></div>
            </div>

            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <Tabs value={period} onValueChange={v => setPeriod(v as "week" | "month")}>
                    <TabsList className="bg-pink-50">
                        <TabsTrigger value="week" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Semanal</TabsTrigger>
                        <TabsTrigger value="month" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white">Mensual</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => nav(-1)} className="border-pink-200"><ChevronLeft className="w-4 h-4" /></Button>
                    <span className="text-sm font-medium min-w-[140px] text-center capitalize">
                        {period === "week" ? `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM yyyy", { locale: es })}` : format(currentDate, "MMMM yyyy", { locale: es })}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => nav(1)} className="border-pink-200"><ChevronRight className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="border-pink-200 text-pink-600 ml-1">Hoy</Button>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                <Card className="border-pink-100/50"><CardContent className="p-4 text-center"><DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-2" /><p className="text-2xl font-bold">{rev.toFixed(0)}€</p><p className="text-xs text-muted-foreground">Ingresos</p></CardContent></Card>
                <Card className="border-pink-100/50"><CardContent className="p-4 text-center"><CalendarDays className="w-5 h-5 text-pink-500 mx-auto mb-2" /><p className="text-2xl font-bold">{citas.length}</p><p className="text-xs text-muted-foreground">Citas</p></CardContent></Card>
                <Card className="border-pink-100/50"><CardContent className="p-4 text-center"><TrendingUp className="w-5 h-5 text-blue-500 mx-auto mb-2" /><p className="text-2xl font-bold">{avg.toFixed(0)}€</p><p className="text-xs text-muted-foreground">Ticket medio</p></CardContent></Card>
                <Card className="border-pink-100/50"><CardContent className="p-4 text-center"><Users className="w-5 h-5 text-purple-500 mx-auto mb-2" /><p className="text-2xl font-bold">{clients}</p><p className="text-xs text-muted-foreground">Clientas</p></CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <Card className="border-pink-100/50"><CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-pink-500" />Ingresos por día</h3>
                    {loading ? <div className="h-48 bg-muted rounded-xl animate-pulse" /> : (
                        <div className="flex items-end gap-1 h-48">
                            {byDay.map(d => (
                                <div key={d.ds} className="flex-1 flex flex-col items-center gap-1 group">
                                    <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{d.rev > 0 ? `${d.rev}€` : ""}</span>
                                    <div className="w-full rounded-t-md bg-gradient-to-t from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 transition-all min-h-[2px]" style={{ height: `${Math.max((d.rev / maxR) * 100, d.rev > 0 ? 5 : 1)}%` }} />
                                    <span className="text-[8px] text-muted-foreground">{format(d.day, period === "week" ? "EEE" : "d", { locale: es })}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent></Card>

                <Card className="border-pink-100/50"><CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2"><Scissors className="w-4 h-4 text-pink-500" />Por servicio</h3>
                    {loading ? <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />)}</div>
                        : svcList.length === 0 ? <p className="text-center text-muted-foreground py-12 text-sm">Sin datos</p>
                            : <div className="space-y-3">{svcList.map((s, i) => (
                                <div key={s.name} className="flex items-center gap-3">
                                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1"><span className="text-sm font-medium truncate">{s.name}</span><span className="text-sm font-bold text-pink-600">{s.revenue.toFixed(0)}€</span></div>
                                        <div className="w-full bg-pink-50 rounded-full h-2"><div className="bg-gradient-to-r from-pink-400 to-rose-500 h-full rounded-full" style={{ width: `${rev > 0 ? (s.revenue / rev) * 100 : 0}%` }} /></div>
                                    </div>
                                    <Badge variant="secondary" className="bg-pink-50 text-pink-600 text-[10px]">{s.count}</Badge>
                                </div>
                            ))}</div>}
                </CardContent></Card>
            </div>

            <Card className="border-pink-100/50"><CardContent className="p-5">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Desglose diario</h3>
                <div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead><tr className="border-b border-pink-100"><th className="text-left py-2 text-muted-foreground font-medium">Día</th><th className="text-center py-2 text-muted-foreground font-medium">Citas</th><th className="text-right py-2 text-muted-foreground font-medium">Ingresos</th></tr></thead>
                    <tbody>{byDay.filter(d => d.count > 0).map(d => (
                        <tr key={d.ds} className="border-b border-pink-50 hover:bg-pink-50/50"><td className="py-2.5 capitalize">{format(d.day, "EEEE d", { locale: es })}</td><td className="py-2.5 text-center"><Badge variant="secondary" className="bg-pink-50 text-pink-600">{d.count}</Badge></td><td className="py-2.5 text-right font-semibold">{d.rev.toFixed(0)}€</td></tr>
                    ))}{byDay.filter(d => d.count > 0).length === 0 && <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">Sin datos</td></tr>}</tbody>
                    <tfoot><tr className="border-t-2 border-pink-200"><td className="py-3 font-bold">Total</td><td className="py-3 text-center font-bold">{citas.length}</td><td className="py-3 text-right font-bold text-pink-600">{rev.toFixed(0)}€</td></tr></tfoot>
                </table></div>
            </CardContent></Card>
        </div>
    );
}
