"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    Scissors,
    Clock,
    DollarSign,
    Save,
    X,
    Check,
    Loader2,
    GripVertical,
    Eye,
    EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { Servicio } from "@/lib/types";

export default function ServiciosPage() {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        id: "",
        nombre: "",
        duracion_minutos: 30,
        precio: 0,
    });

    const loadServicios = useCallback(async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from("servicios")
            .select("*")
            .order("orden");
        setServicios((data || []) as Servicio[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadServicios();
    }, [loadServicios]);

    const openNew = () => {
        setForm({ id: "", nombre: "", duracion_minutos: 30, precio: 0 });
        setEditMode(false);
        setDialogOpen(true);
    };

    const openEdit = (s: Servicio) => {
        setForm({
            id: s.id,
            nombre: s.nombre,
            duracion_minutos: s.duracion_minutos,
            precio: s.precio,
        });
        setEditMode(true);
        setDialogOpen(true);
    };

    const handleSave = async () => {
        if (!form.nombre || form.duracion_minutos <= 0 || form.precio < 0) return;
        setSaving(true);

        const supabase = createClient();

        if (editMode && form.id) {
            await supabase
                .from("servicios")
                .update({
                    nombre: form.nombre,
                    duracion_minutos: form.duracion_minutos,
                    precio: form.precio,
                })
                .eq("id", form.id);
        } else {
            const maxOrden = servicios.length > 0 ? Math.max(...servicios.map((s) => (s as unknown as Record<string, number>).orden || 0)) + 1 : 1;
            await supabase.from("servicios").insert({
                nombre: form.nombre,
                duracion_minutos: form.duracion_minutos,
                precio: form.precio,
                orden: maxOrden,
            });
        }

        setSaving(false);
        setDialogOpen(false);
        loadServicios();
    };

    const toggleActive = async (s: Servicio) => {
        const supabase = createClient();
        const currentActive = (s as unknown as Record<string, boolean>).activo;
        await supabase
            .from("servicios")
            .update({ activo: !currentActive })
            .eq("id", s.id);
        loadServicios();
    };

    const deleteServicio = async (id: string) => {
        if (!confirm("¿Eliminar este servicio? Las citas existentes no se verán afectadas.")) return;
        const supabase = createClient();
        await supabase.from("servicios").delete().eq("id", id);
        loadServicios();
    };

    const totalMonthlyPotential = servicios.reduce((sum, s) => sum + s.precio, 0);

    return (
        <div>
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Servicios</h1>
                    <p className="text-muted-foreground">
                        Gestiona los servicios que ofreces en el salón
                    </p>
                </div>
                <Button
                    onClick={openNew}
                    className="bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Servicio
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                <Card className="border-pink-100/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                            <Scissors className="w-5 h-5 text-pink-500" />
                        </div>
                        <div>
                            <p className="text-xl font-bold">{servicios.length}</p>
                            <p className="text-xs text-muted-foreground">Servicios</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-pink-100/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xl font-bold">
                                {servicios.length > 0
                                    ? (servicios.reduce((s, v) => s + v.precio, 0) / servicios.length).toFixed(0)
                                    : 0}€
                            </p>
                            <p className="text-xs text-muted-foreground">Precio medio</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-pink-100/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xl font-bold">
                                {servicios.length > 0
                                    ? Math.round(servicios.reduce((s, v) => s + v.duracion_minutos, 0) / servicios.length)
                                    : 0} min
                            </p>
                            <p className="text-xs text-muted-foreground">Duración media</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Services List */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
                    ))}
                </div>
            ) : servicios.length === 0 ? (
                <Card className="border-pink-100/50">
                    <CardContent className="p-12 text-center text-muted-foreground">
                        <Scissors className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="mb-4">No hay servicios creados</p>
                        <Button onClick={openNew} className="bg-pink-500 hover:bg-pink-600 text-white">
                            <Plus className="w-4 h-4 mr-2" /> Crear primer servicio
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {servicios.map((s) => {
                        const isActive = (s as unknown as Record<string, boolean>).activo !== false;
                        return (
                            <Card
                                key={s.id}
                                className={`border-pink-100/50 transition-all hover:shadow-md ${!isActive ? "opacity-50" : ""}`}
                            >
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center">
                                        <Scissors className="w-5 h-5 text-pink-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold truncate">{s.nombre}</p>
                                            {!isActive && (
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[10px]">
                                                    Inactivo
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {s.duracion_minutos} min
                                            </span>
                                            <span className="font-bold text-pink-600 text-base">
                                                {s.precio}€
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleActive(s)}
                                            className="text-muted-foreground hover:text-pink-600"
                                            title={isActive ? "Desactivar" : "Activar"}
                                        >
                                            {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEdit(s)}
                                            className="text-muted-foreground hover:text-blue-600"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteServicio(s.id)}
                                            className="text-muted-foreground hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editMode ? "Editar Servicio" : "Nuevo Servicio"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="srv-nombre">Nombre del servicio *</Label>
                            <Input
                                id="srv-nombre"
                                placeholder="Ej: Corte de Cabello"
                                value={form.nombre}
                                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="srv-duracion">Duración (min) *</Label>
                                <Input
                                    id="srv-duracion"
                                    type="number"
                                    min={5}
                                    step={5}
                                    value={form.duracion_minutos}
                                    onChange={(e) => setForm({ ...form, duracion_minutos: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="srv-precio">Precio (€) *</Label>
                                <Input
                                    id="srv-precio"
                                    type="number"
                                    min={0}
                                    step={0.5}
                                    value={form.precio}
                                    onChange={(e) => setForm({ ...form, precio: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <Button
                            onClick={handleSave}
                            disabled={saving || !form.nombre}
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            {editMode ? "Guardar cambios" : "Crear servicio"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
