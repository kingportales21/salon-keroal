"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    User,
    Scissors,
    X,
    Check,
    AlertCircle,
    Plus,
    Phone,
    Loader2,
    Trash2,
    CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { createClient } from "@/lib/supabase/client";
import { format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import type { CitaConDetalles, EstadoCita, Servicio } from "@/lib/types";

const HOURS = Array.from({ length: 11 }, (_, i) => i + 9); // 9-19

const statusColors: Record<string, string> = {
    pendiente: "bg-amber-100 border-amber-300 text-amber-800",
    confirmado: "bg-green-100 border-green-300 text-green-800",
    cancelado: "bg-red-100 border-red-300 text-red-800",
    finalizado: "bg-blue-100 border-blue-300 text-blue-800",
};

const statusGradients: Record<string, string> = {
    pendiente: "from-amber-400 to-orange-400",
    confirmado: "from-green-400 to-emerald-500",
    cancelado: "from-red-400 to-rose-500",
    finalizado: "from-blue-400 to-indigo-500",
};

export default function AgendaPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [citas, setCitas] = useState<CitaConDetalles[]>([]);
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCita, setSelectedCita] = useState<CitaConDetalles | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);

    // New appointment state
    const [newDialogOpen, setNewDialogOpen] = useState(false);
    const [newForm, setNewForm] = useState({
        nombre: "",
        whatsapp: "",
        email: "",
        serviceId: "",
        hora: "09:00",
        fecha: new Date(),
    });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // Load services
    useEffect(() => {
        const supabase = createClient();
        supabase
            .from("servicios")
            .select("*")
            .eq("activo", true)
            .order("orden")
            .then(({ data }) => {
                if (data) setServicios(data);
            });
    }, []);

    const loadCitas = useCallback(async () => {
        setLoading(true);
        const supabase = createClient();
        const dateStr = format(selectedDate, "yyyy-MM-dd");

        const { data } = await supabase
            .from("citas")
            .select("*, clientes(*), servicios(*)")
            .gte("fecha_hora", `${dateStr}T00:00:00`)
            .lte("fecha_hora", `${dateStr}T23:59:59`)
            .order("fecha_hora");

        setCitas((data || []) as unknown as CitaConDetalles[]);
        setLoading(false);
    }, [selectedDate]);

    useEffect(() => {
        loadCitas();
    }, [loadCitas]);

    const updateStatus = async (citaId: string, newStatus: EstadoCita) => {
        const supabase = createClient();
        await supabase.from("citas").update({ estado: newStatus }).eq("id", citaId);

        // If cancelled, trigger waitlist notification
        if (newStatus === "cancelado") {
            try {
                await fetch("/api/webhooks/cancel", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ citaId }),
                });
            } catch (e) {
                console.error("Error triggering waitlist notification:", e);
            }
        }

        setDialogOpen(false);
        loadCitas();
    };

    const deleteCita = async (citaId: string) => {
        if (!confirm("¿Estás segura de que quieres eliminar esta cita?")) return;
        const supabase = createClient();
        await supabase.from("citas").delete().eq("id", citaId);
        setDialogOpen(false);
        loadCitas();
    };

    const handleCreateAppointment = async () => {
        if (!newForm.nombre || !newForm.whatsapp || !newForm.serviceId || !newForm.hora) {
            setCreateError("Rellena todos los campos obligatorios");
            return;
        }

        setCreating(true);
        setCreateError(null);

        const fechaHora = `${format(newForm.fecha, "yyyy-MM-dd")}T${newForm.hora}:00`;

        try {
            const res = await fetch("/api/booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre: newForm.nombre,
                    whatsapp: newForm.whatsapp,
                    email: newForm.email || null,
                    serviceId: newForm.serviceId,
                    fechaHora,
                    notas: null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setCreateError(data.error || "Error al crear la cita");
                return;
            }

            setNewDialogOpen(false);
            setNewForm({ nombre: "", whatsapp: "", email: "", serviceId: "", hora: "09:00", fecha: selectedDate });
            loadCitas();
        } catch {
            setCreateError("Error de conexión");
        } finally {
            setCreating(false);
        }
    };

    const getCitaPosition = (cita: CitaConDetalles) => {
        const citaDate = new Date(cita.fecha_hora);
        const hour = citaDate.getHours();
        const minutes = citaDate.getMinutes();
        const top = (hour - 9) * 80 + (minutes / 60) * 80;
        const height = ((cita.servicios?.duracion_minutos || 30) / 60) * 80;
        return { top, height };
    };

    // Generate time options
    const timeOptions = [];
    for (let h = 9; h < 19; h++) {
        for (let m = 0; m < 60; m += 30) {
            timeOptions.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
        }
    }

    const activeCitas = citas.filter((c) => c.estado !== "cancelado");

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Agenda</h1>
                    <p className="text-muted-foreground">
                        Gestiona las citas del día
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => setNewDialogOpen(true)}
                        className="bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25 hover:shadow-pink-500/40"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Cita
                    </Button>
                </div>
            </div>

            {/* Date Navigation with Calendar Picker */}
            <div className="flex items-center justify-center gap-2 mb-6">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                    className="border-pink-200"
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>

                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className="min-w-[260px] border-pink-200 hover:bg-pink-50 justify-center gap-2"
                        >
                            <CalendarIcon className="w-4 h-4 text-pink-500" />
                            <span className="capitalize font-semibold">
                                {format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="center">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                                if (date) {
                                    setSelectedDate(date);
                                    setCalendarOpen(false);
                                }
                            }}
                            locale={es}
                            className="rounded-xl"
                        />
                    </PopoverContent>
                </Popover>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                    className="border-pink-200"
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(new Date())}
                    className="border-pink-200 text-pink-600"
                >
                    Hoy
                </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground mb-6">
                {activeCitas.length} citas programadas
            </p>

            {/* Quick List View */}
            <Card className="border-pink-100/50 mb-6">
                <CardContent className="p-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                        Resumen del día
                    </h3>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
                        </div>
                    ) : activeCitas.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Scissors className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p>No hay citas para este día</p>
                            <Button
                                onClick={() => setNewDialogOpen(true)}
                                variant="outline"
                                className="mt-4 border-pink-200 text-pink-600"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Añadir cita
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {activeCitas.map((cita) => (
                                <button
                                    key={cita.id}
                                    onClick={() => {
                                        setSelectedCita(cita);
                                        setDialogOpen(true);
                                    }}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-pink-50 transition-colors text-left"
                                >
                                    <div className={`w-11 h-11 flex-shrink-0 rounded-xl bg-gradient-to-br ${statusGradients[cita.estado]} flex items-center justify-center text-white font-bold text-xs`}>
                                        {format(new Date(cita.fecha_hora), "HH:mm")}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                            {cita.clientes?.nombre || "Sin nombre"}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {cita.servicios?.nombre} · {cita.servicios?.duracion_minutos}min
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-sm font-semibold">{cita.servicios?.precio}€</span>
                                        <Badge
                                            variant="secondary"
                                            className={`text-xs ${statusColors[cita.estado]}`}
                                        >
                                            {cita.estado}
                                        </Badge>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Timeline View */}
            <Card className="border-pink-100/50 overflow-hidden">
                <CardContent className="p-0">
                    <div className="relative" style={{ height: `${11 * 80}px` }}>
                        {/* Hour lines */}
                        {HOURS.map((hour) => (
                            <div
                                key={hour}
                                className="absolute left-0 right-0 border-t border-pink-100/50"
                                style={{ top: `${(hour - 9) * 80}px` }}
                            >
                                <span className="absolute -top-3 left-2 text-xs text-muted-foreground bg-card px-1">
                                    {hour.toString().padStart(2, "0")}:00
                                </span>
                            </div>
                        ))}

                        {/* Appointments */}
                        {!loading &&
                            activeCitas.map((cita) => {
                                const { top, height } = getCitaPosition(cita);
                                return (
                                    <button
                                        key={cita.id}
                                        onClick={() => {
                                            setSelectedCita(cita);
                                            setDialogOpen(true);
                                        }}
                                        className={`absolute left-16 right-4 rounded-xl border p-3 text-left transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer ${statusColors[cita.estado]
                                            }`}
                                        style={{ top: `${top}px`, height: `${Math.max(height, 40)}px` }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm truncate">
                                                {format(new Date(cita.fecha_hora), "HH:mm")}
                                            </span>
                                            <span className="text-sm truncate">
                                                {cita.clientes?.nombre}
                                            </span>
                                        </div>
                                        {height > 50 && (
                                            <p className="text-xs mt-1 opacity-80 truncate">
                                                {cita.servicios?.nombre} · {cita.servicios?.duracion_minutos}min · {cita.servicios?.precio}€
                                            </p>
                                        )}
                                    </button>
                                );
                            })}

                        {/* Loading skeleton */}
                        {loading && (
                            <div className="absolute left-16 right-4 top-4 space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ============ NEW APPOINTMENT DIALOG ============ */}
            <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5 text-pink-500" />
                            Nueva Cita – {format(newForm.fecha, "d MMM yyyy", { locale: es })}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-nombre">
                                <User className="w-4 h-4 inline mr-1" />
                                Nombre de la clienta *
                            </Label>
                            <Input
                                id="new-nombre"
                                placeholder="Nombre completo"
                                value={newForm.nombre}
                                onChange={(e) => setNewForm({ ...newForm, nombre: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-whatsapp">
                                <Phone className="w-4 h-4 inline mr-1" />
                                WhatsApp *
                            </Label>
                            <Input
                                id="new-whatsapp"
                                placeholder="+34 612 345 678"
                                value={newForm.whatsapp}
                                onChange={(e) => setNewForm({ ...newForm, whatsapp: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>
                                <CalendarIcon className="w-4 h-4 inline mr-1" />
                                Fecha *
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start font-normal border-pink-200"
                                    >
                                        <CalendarIcon className="w-4 h-4 mr-2 text-pink-500" />
                                        <span className="capitalize">
                                            {format(newForm.fecha, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={newForm.fecha}
                                        onSelect={(date) => {
                                            if (date) setNewForm({ ...newForm, fecha: date });
                                        }}
                                        locale={es}
                                        className="rounded-xl"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                <Scissors className="w-4 h-4 inline mr-1" />
                                Servicio *
                            </Label>
                            <Select
                                value={newForm.serviceId}
                                onValueChange={(val) => setNewForm({ ...newForm, serviceId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un servicio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {servicios.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.nombre} ({s.duracion_minutos}min – {s.precio}€)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>
                                <Clock className="w-4 h-4 inline mr-1" />
                                Hora *
                            </Label>
                            <Select
                                value={newForm.hora}
                                onValueChange={(val) => setNewForm({ ...newForm, hora: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {timeOptions.map((t) => (
                                        <SelectItem key={t} value={t}>
                                            {t}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {createError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {createError}
                            </div>
                        )}

                        <Button
                            onClick={handleCreateAppointment}
                            disabled={creating}
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-5"
                        >
                            {creating ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Check className="w-4 h-4 mr-2" />
                            )}
                            Crear Cita
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ============ APPOINTMENT DETAIL DIALOG ============ */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detalles de la Cita</DialogTitle>
                    </DialogHeader>
                    {selectedCita && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${statusGradients[selectedCita.estado]} flex items-center justify-center text-white`}>
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="font-semibold">{selectedCita.clientes?.nombre}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedCita.clientes?.whatsapp}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Scissors className="w-4 h-4 text-muted-foreground" />
                                    <span>{selectedCita.servicios?.nombre}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-muted-foreground" />
                                    <span>
                                        {format(new Date(selectedCita.fecha_hora), "HH:mm")} ·{" "}
                                        {selectedCita.servicios?.duracion_minutos} min
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold gradient-text">
                                        {selectedCita.servicios?.precio}€
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Estado:</span>
                                <Badge className={statusColors[selectedCita.estado]}>
                                    {selectedCita.estado}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2">
                                <Button
                                    size="sm"
                                    onClick={() => updateStatus(selectedCita.id, "confirmado")}
                                    className="bg-green-500 hover:bg-green-600 text-white"
                                >
                                    <Check className="w-4 h-4 mr-1" />
                                    Confirmar
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => updateStatus(selectedCita.id, "finalizado")}
                                    className="bg-blue-500 hover:bg-blue-600 text-white"
                                >
                                    <Check className="w-4 h-4 mr-1" />
                                    Finalizar
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStatus(selectedCita.id, "pendiente")}
                                    className="border-amber-300 text-amber-700"
                                >
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    Pendiente
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateStatus(selectedCita.id, "cancelado")}
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancelar
                                </Button>
                            </div>

                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteCita(selectedCita.id)}
                                className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 mt-2"
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Eliminar cita
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
