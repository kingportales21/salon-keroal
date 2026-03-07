"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Sparkles,
    ArrowLeft,
    ArrowRight,
    Check,
    Clock,
    Calendar as CalendarIcon,
    User,
    Phone,
    Mail,
    MessageCircle,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Servicio } from "@/lib/types";
import type { SlotInfo } from "@/lib/slots";
import { format, addDays, isSunday, isBefore, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

const steps = [
    { id: 1, label: "Servicio", icon: Sparkles },
    { id: 2, label: "Fecha", icon: CalendarIcon },
    { id: 3, label: "Hora", icon: Clock },
    { id: 4, label: "Datos", icon: User },
];

export default function ReservarPage() {
    const [step, setStep] = useState(1);
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [selectedService, setSelectedService] = useState<Servicio | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [slots, setSlots] = useState<SlotInfo[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [formData, setFormData] = useState({
        nombre: "",
        whatsapp: "",
        email: "",
        notas: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [noSlots, setNoSlots] = useState(false);
    const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

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

    // Load slots when date changes
    const loadSlots = useCallback(async () => {
        if (!selectedDate || !selectedService) return;
        setSlotsLoading(true);
        setSelectedSlot(null);
        setNoSlots(false);

        const dateStr = format(selectedDate, "yyyy-MM-dd");
        try {
            const res = await fetch(
                `/api/slots?date=${dateStr}&serviceId=${selectedService.id}`
            );
            const data = await res.json();
            setSlots(data.slots || []);
            const available = (data.slots || []).filter(
                (s: SlotInfo) => s.available
            );
            setNoSlots(available.length === 0);
        } catch {
            setSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    }, [selectedDate, selectedService]);

    useEffect(() => {
        loadSlots();
    }, [loadSlots]);

    const handleSubmit = async () => {
        if (!selectedService || !selectedDate || !selectedSlot || !formData.nombre || !formData.whatsapp) return;

        setSubmitting(true);
        setError(null);

        const fechaHora = `${format(selectedDate, "yyyy-MM-dd")}T${selectedSlot}:00`;

        try {
            const res = await fetch("/api/booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    whatsapp: formData.whatsapp,
                    email: formData.email || null,
                    serviceId: selectedService.id,
                    fechaHora,
                    notas: formData.notas || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Error al crear la reserva");
                return;
            }

            setSuccess(true);
        } catch {
            setError("Error de conexión. Inténtalo de nuevo.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleWaitlist = async () => {
        if (!selectedService || !selectedDate || !formData.nombre || !formData.whatsapp) {
            setError("Por favor, rellena tu nombre y WhatsApp primero (paso 4).");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    whatsapp: formData.whatsapp,
                    email: formData.email || null,
                    serviceId: selectedService.id,
                    fecha: format(selectedDate, "yyyy-MM-dd"),
                    horaInicio: "09:00",
                    horaFin: "19:00",
                }),
            });

            if (res.ok) {
                setWaitlistSubmitted(true);
            }
        } catch {
            setError("Error al unirse a la lista de espera");
        } finally {
            setSubmitting(false);
        }
    };

    // Success screen
    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-pink-100 shadow-xl">
                    <CardContent className="p-8 text-center">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-fade-in-up">
                            <Check className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 animate-fade-in-up stagger-1">
                            ¡Reserva Confirmada! 🎉
                        </h2>
                        <p className="text-muted-foreground mb-6 animate-fade-in-up stagger-2">
                            Tu cita ha sido registrada con éxito. Recibirás un mensaje de
                            confirmación por WhatsApp.
                        </p>
                        <div className="bg-pink-50 rounded-xl p-4 mb-6 text-left animate-fade-in-up stagger-3">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Servicio:</span>
                                    <span className="font-medium">{selectedService?.nombre}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Fecha:</span>
                                    <span className="font-medium">
                                        {selectedDate &&
                                            format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Hora:</span>
                                    <span className="font-medium">{selectedSlot}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Precio:</span>
                                    <span className="font-medium">{selectedService?.precio}€</span>
                                </div>
                            </div>
                        </div>
                        <Link href="/">
                            <Button variant="outline" className="border-pink-200 text-pink-600">
                                Volver al inicio
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="border-b border-pink-100 glass fixed top-0 left-0 right-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm">Volver</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold gradient-text">Keroal</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold mb-2">Reserva tu Cita</h1>
                    <p className="text-muted-foreground">
                        Selecciona tu servicio y elige el horario que mejor te convenga
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-12">
                    {steps.map((s, i) => (
                        <div key={s.id} className="flex items-center">
                            <button
                                onClick={() => {
                                    if (s.id < step) setStep(s.id);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm ${step === s.id
                                        ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25"
                                        : step > s.id
                                            ? "bg-pink-100 text-pink-600"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                            >
                                <s.icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{s.label}</span>
                            </button>
                            {i < steps.length - 1 && (
                                <div
                                    className={`w-8 sm:w-12 h-0.5 mx-1 ${step > s.id ? "bg-pink-300" : "bg-muted"
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step 1: Service Selection */}
                {step === 1 && (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-semibold mb-6 text-center">
                            ¿Qué servicio necesitas?
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {servicios.map((s) => (
                                <Card
                                    key={s.id}
                                    className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${selectedService?.id === s.id
                                            ? "border-pink-400 ring-2 ring-pink-200 shadow-lg shadow-pink-100"
                                            : "border-pink-100/50 hover:border-pink-200"
                                        }`}
                                    onClick={() => {
                                        setSelectedService(s);
                                        setSelectedDate(undefined);
                                        setSelectedSlot(null);
                                    }}
                                >
                                    <CardContent className="p-5 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold">{s.nombre}</h3>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {s.duracion_minutos} min
                                                </span>
                                                <span className="text-lg font-bold gradient-text">
                                                    {s.precio}€
                                                </span>
                                            </div>
                                        </div>
                                        {selectedService?.id === s.id && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        {selectedService && (
                            <div className="text-center mt-8">
                                <Button
                                    onClick={() => setStep(2)}
                                    className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8"
                                >
                                    Continuar
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Date Selection */}
                {step === 2 && (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-semibold mb-6 text-center">
                            Elige una fecha
                        </h2>
                        <div className="flex justify-center">
                            <Card className="border-pink-100/50 inline-block">
                                <CardContent className="p-4">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => {
                                            setSelectedDate(date);
                                            if (date) setStep(3);
                                        }}
                                        disabled={(date) =>
                                            isBefore(date, startOfDay(new Date())) ||
                                            isSunday(date) ||
                                            isBefore(addDays(new Date(), 60), date)
                                        }
                                        locale={es}
                                        className="rounded-xl"
                                    />
                                </CardContent>
                            </Card>
                        </div>
                        <div className="text-center mt-4 text-sm text-muted-foreground">
                            <p>Horario: Lunes a Viernes 9:00 - 19:00 · Sábado 9:00 - 14:00</p>
                        </div>
                    </div>
                )}

                {/* Step 3: Time Slot Selection */}
                {step === 3 && (
                    <div className="animate-fade-in">
                        <h2 className="text-xl font-semibold mb-2 text-center">
                            Selecciona una hora
                        </h2>
                        <p className="text-center text-sm text-muted-foreground mb-6">
                            {selectedDate &&
                                format(selectedDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
                            {" · "}
                            {selectedService?.nombre} ({selectedService?.duracion_minutos} min)
                        </p>

                        {slotsLoading ? (
                            <div className="text-center py-12">
                                <Loader2 className="w-8 h-8 text-pink-400 animate-spin mx-auto mb-3" />
                                <p className="text-muted-foreground">Buscando horarios disponibles...</p>
                            </div>
                        ) : noSlots ? (
                            <div className="text-center py-8">
                                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">
                                    No hay huecos disponibles este día
                                </h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    Puedes unirte a la lista de espera y te avisaremos si se
                                    libera un hueco.
                                </p>

                                {!waitlistSubmitted ? (
                                    <div className="max-w-sm mx-auto space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="wl-nombre">Nombre *</Label>
                                            <Input
                                                id="wl-nombre"
                                                placeholder="Tu nombre"
                                                value={formData.nombre}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, nombre: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="wl-whatsapp">WhatsApp *</Label>
                                            <Input
                                                id="wl-whatsapp"
                                                placeholder="+34 612 345 678"
                                                value={formData.whatsapp}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, whatsapp: e.target.value })
                                                }
                                            />
                                        </div>
                                        <Button
                                            onClick={handleWaitlist}
                                            disabled={submitting || !formData.nombre || !formData.whatsapp}
                                            className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                                        >
                                            {submitting ? (
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            ) : (
                                                <MessageCircle className="w-4 h-4 mr-2" />
                                            )}
                                            Unirme a la Lista de Espera
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 max-w-sm mx-auto">
                                        <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                                        <p className="text-green-700 font-medium">
                                            ¡Te has apuntado a la lista de espera!
                                        </p>
                                        <p className="text-green-600 text-sm mt-1">
                                            Te avisaremos por WhatsApp si se libera un hueco.
                                        </p>
                                    </div>
                                )}

                                <div className="mt-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => setStep(2)}
                                        className="border-pink-200 text-pink-600"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Elegir otra fecha
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-w-2xl mx-auto">
                                    {slots
                                        .filter((s) => s.available)
                                        .map((slot) => (
                                            <button
                                                key={slot.time}
                                                onClick={() => setSelectedSlot(slot.time)}
                                                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${selectedSlot === slot.time
                                                        ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25 scale-105"
                                                        : "bg-pink-50 text-pink-700 hover:bg-pink-100 hover:shadow-md"
                                                    }`}
                                            >
                                                {slot.time}
                                            </button>
                                        ))}
                                </div>
                                {selectedSlot && (
                                    <div className="text-center mt-8">
                                        <Button
                                            onClick={() => setStep(4)}
                                            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8"
                                        >
                                            Continuar
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Step 4: Contact Form */}
                {step === 4 && (
                    <div className="animate-fade-in max-w-md mx-auto">
                        <h2 className="text-xl font-semibold mb-6 text-center">
                            Tus datos de contacto
                        </h2>

                        {/* Summary */}
                        <Card className="border-pink-100 mb-6">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between text-sm">
                                    <div>
                                        <Badge variant="secondary" className="bg-pink-100 text-pink-700 mb-2">
                                            {selectedService?.nombre}
                                        </Badge>
                                        <p className="text-muted-foreground">
                                            {selectedDate &&
                                                format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}{" "}
                                            a las {selectedSlot}
                                        </p>
                                    </div>
                                    <span className="text-xl font-bold gradient-text">
                                        {selectedService?.precio}€
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre">
                                    <User className="w-4 h-4 inline mr-1" />
                                    Nombre completo *
                                </Label>
                                <Input
                                    id="nombre"
                                    placeholder="Tu nombre"
                                    value={formData.nombre}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nombre: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="whatsapp">
                                    <Phone className="w-4 h-4 inline mr-1" />
                                    WhatsApp *
                                </Label>
                                <Input
                                    id="whatsapp"
                                    placeholder="+34 612 345 678"
                                    value={formData.whatsapp}
                                    onChange={(e) =>
                                        setFormData({ ...formData, whatsapp: e.target.value })
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Formato internacional (ej: +34612345678)
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    <Mail className="w-4 h-4 inline mr-1" />
                                    Email (opcional)
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="tu@email.com"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notas">
                                    <MessageCircle className="w-4 h-4 inline mr-1" />
                                    Notas (opcional)
                                </Label>
                                <Textarea
                                    id="notas"
                                    placeholder="¿Algo que debamos saber? (alergias, preferencias...)"
                                    rows={3}
                                    value={formData.notas}
                                    onChange={(e) =>
                                        setFormData({ ...formData, notas: e.target.value })
                                    }
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <Button
                                onClick={handleSubmit}
                                disabled={submitting || !formData.nombre || !formData.whatsapp}
                                className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white py-6 text-lg shadow-xl shadow-pink-500/25 transition-all hover:shadow-pink-500/40"
                            >
                                {submitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                ) : (
                                    <Check className="w-5 h-5 mr-2" />
                                )}
                                Confirmar Reserva
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
