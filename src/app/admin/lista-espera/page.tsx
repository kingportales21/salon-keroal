"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ClipboardList,
    Clock,
    User,
    Phone,
    Scissors,
    CheckCircle2,
    XCircle,
    Bell,
    Trash2,
    Loader2,
    Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface WaitlistEntry {
    id: string;
    fecha: string;
    token: string;
    confirmado: boolean;
    notificado: boolean;
    created_at: string;
    clientes: { id: string; nombre: string; whatsapp: string } | null;
}

export default function ListaEsperaPage() {
    const [entries, setEntries] = useState<WaitlistEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        const { data } = await supabase
            .from("lista_espera")
            .select("*, clientes(*)")
            .order("created_at", { ascending: false })
            .limit(50);
        setEntries((data || []) as unknown as WaitlistEntry[]);
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const deleteEntry = async (id: string) => {
        if (!confirm("¿Eliminar esta entrada?")) return;
        const supabase = createClient();
        await supabase.from("lista_espera").delete().eq("id", id);
        load();
    };

    const pending = entries.filter(e => !e.confirmado && !e.notificado);
    const notified = entries.filter(e => e.notificado && !e.confirmado);
    const confirmed = entries.filter(e => e.confirmado);

    return (
        <div>
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Lista de Espera</h1>
                    <p className="text-muted-foreground">Clientas esperando un hueco</p>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                <Card className="border-pink-100/50">
                    <CardContent className="p-4 text-center">
                        <Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{pending.length}</p>
                        <p className="text-xs text-muted-foreground">Esperando</p>
                    </CardContent>
                </Card>
                <Card className="border-pink-100/50">
                    <CardContent className="p-4 text-center">
                        <Bell className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{notified.length}</p>
                        <p className="text-xs text-muted-foreground">Notificadas</p>
                    </CardContent>
                </Card>
                <Card className="border-pink-100/50">
                    <CardContent className="p-4 text-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-2" />
                        <p className="text-2xl font-bold">{confirmed.length}</p>
                        <p className="text-xs text-muted-foreground">Confirmadas</p>
                    </CardContent>
                </Card>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-pink-400 animate-spin" /></div>
            ) : entries.length === 0 ? (
                <Card className="border-pink-100/50">
                    <CardContent className="p-12 text-center text-muted-foreground">
                        <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>No hay entradas en la lista de espera</p>
                        <p className="text-sm mt-1">Las clientas pueden apuntarse desde la página de reservas cuando no hay disponibilidad</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {entries.map(entry => (
                        <Card key={entry.id} className={`border-pink-100/50 transition-all hover:shadow-md ${entry.confirmado ? "opacity-60" : ""}`}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center ${entry.confirmado ? "bg-green-100" : entry.notificado ? "bg-blue-100" : "bg-amber-100"
                                    }`}>
                                    {entry.confirmado ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        : entry.notificado ? <Bell className="w-5 h-5 text-blue-600" />
                                            : <Clock className="w-5 h-5 text-amber-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-sm truncate">{entry.clientes?.nombre || "Sin nombre"}</p>
                                        <Badge variant="secondary" className={`text-[10px] ${entry.confirmado ? "bg-green-100 text-green-700" : entry.notificado ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                                            }`}>
                                            {entry.confirmado ? "Confirmada" : entry.notificado ? "Notificada" : "Esperando"}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{entry.clientes?.whatsapp}</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{entry.fecha}</span>
                                        <span>{format(new Date(entry.created_at), "d MMM HH:mm", { locale: es })}</span>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => deleteEntry(entry.id)} className="text-muted-foreground hover:text-red-600 flex-shrink-0">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
