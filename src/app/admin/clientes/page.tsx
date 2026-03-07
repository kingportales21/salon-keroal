"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Search,
    User,
    Phone,
    Mail,
    FileText,
    Save,
    X,
    CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Cliente, CitaConDetalles } from "@/lib/types";

export default function ClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
    const [editNotas, setEditNotas] = useState("");
    const [saving, setSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [clienteCitas, setClienteCitas] = useState<CitaConDetalles[]>([]);

    const loadClientes = useCallback(async () => {
        const supabase = createClient();
        let query = supabase.from("clientes").select("*").order("nombre");

        if (search) {
            query = query.or(`nombre.ilike.%${search}%,whatsapp.ilike.%${search}%`);
        }

        const { data } = await query;
        setClientes((data || []) as Cliente[]);
        setLoading(false);
    }, [search]);

    useEffect(() => {
        const timeout = setTimeout(loadClientes, 300);
        return () => clearTimeout(timeout);
    }, [loadClientes]);

    const openClientDetail = async (cliente: Cliente) => {
        setSelectedCliente(cliente);
        setEditNotas(cliente.notas_historial || "");
        setDialogOpen(true);

        // Load client's appointment history
        const supabase = createClient();
        const { data } = await supabase
            .from("citas")
            .select("*, clientes(*), servicios(*)")
            .eq("id_cliente", cliente.id)
            .order("fecha_hora", { ascending: false })
            .limit(20);

        setClienteCitas((data || []) as unknown as CitaConDetalles[]);
    };

    const saveNotas = async () => {
        if (!selectedCliente) return;
        setSaving(true);

        const supabase = createClient();
        await supabase
            .from("clientes")
            .update({ notas_historial: editNotas })
            .eq("id", selectedCliente.id);

        setSelectedCliente({ ...selectedCliente, notas_historial: editNotas });
        setSaving(false);
        loadClientes();
    };

    const statusColors: Record<string, string> = {
        pendiente: "bg-amber-100 text-amber-700",
        confirmado: "bg-green-100 text-green-700",
        cancelado: "bg-red-100 text-red-700",
        finalizado: "bg-blue-100 text-blue-700",
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Clientes</h1>
                    <p className="text-muted-foreground">
                        Gestiona el historial de tus clientas
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre o teléfono..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 border-pink-200 focus:ring-pink-500"
                />
            </div>

            {/* Client List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            ) : clientes.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                    <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No se encontraron clientas</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {clientes.map((cliente) => (
                        <Card
                            key={cliente.id}
                            className="border-pink-100/50 hover:border-pink-200 hover:shadow-md transition-all cursor-pointer"
                            onClick={() => openClientDetail(cliente)}
                        >
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold">
                                    {cliente.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{cliente.nombre}</p>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-1 truncate">
                                            <Phone className="w-3.5 h-3.5" />
                                            {cliente.whatsapp}
                                        </span>
                                        {cliente.email && (
                                            <span className="hidden sm:flex items-center gap-1 truncate">
                                                <Mail className="w-3.5 h-3.5" />
                                                {cliente.email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {cliente.notas_historial && (
                                    <FileText className="w-4 h-4 text-pink-400 flex-shrink-0" />
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Client Detail Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold">
                                {selectedCliente?.nombre.charAt(0).toUpperCase()}
                            </div>
                            {selectedCliente?.nombre}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedCliente && (
                        <div className="space-y-6">
                            {/* Contact Info */}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span>{selectedCliente.whatsapp}</span>
                                </div>
                                {selectedCliente.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <span>{selectedCliente.email}</span>
                                    </div>
                                )}
                            </div>

                            {/* Notes / History */}
                            <div>
                                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-pink-500" />
                                    Notas e Historial
                                </h3>
                                <Textarea
                                    rows={5}
                                    value={editNotas}
                                    onChange={(e) => setEditNotas(e.target.value)}
                                    placeholder="Tintes usados, preferencias, alergias, observaciones..."
                                    className="border-pink-200"
                                />
                                <Button
                                    size="sm"
                                    onClick={saveNotas}
                                    disabled={saving}
                                    className="mt-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                                >
                                    <Save className="w-4 h-4 mr-1" />
                                    {saving ? "Guardando..." : "Guardar Notas"}
                                </Button>
                            </div>

                            {/* Appointment History */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-pink-500" />
                                    Historial de Citas
                                </h3>
                                {clienteCitas.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Sin citas registradas
                                    </p>
                                ) : (
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {clienteCitas.map((cita) => (
                                            <div
                                                key={cita.id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-pink-50/50"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {cita.servicios?.nombre}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(
                                                            new Date(cita.fecha_hora),
                                                            "d MMM yyyy · HH:mm",
                                                            { locale: es }
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold">
                                                        {cita.servicios?.precio}€
                                                    </span>
                                                    <Badge className={statusColors[cita.estado]} variant="secondary">
                                                        {cita.estado}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
