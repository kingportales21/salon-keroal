"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { Check, X, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function ConfirmarEsperaContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Enlace no válido. Falta el token de confirmación.");
            return;
        }

        fetch(`/api/waitlist/confirm?token=${token}`)
            .then(async (res) => {
                const data = await res.json();
                if (res.ok) {
                    setStatus("success");
                    setMessage("¡Tu cita ha sido confirmada con éxito!");
                } else {
                    setStatus("error");
                    setMessage(data.error || "No se pudo confirmar la cita.");
                }
            })
            .catch(() => {
                setStatus("error");
                setMessage("Error de conexión. Inténtalo de nuevo.");
            });
    }, [token]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-pink-100 shadow-xl">
                <CardContent className="p-8 text-center">
                    {status === "loading" && (
                        <>
                            <Loader2 className="w-16 h-16 text-pink-400 animate-spin mx-auto mb-4" />
                            <h2 className="text-xl font-bold mb-2">Confirmando tu cita...</h2>
                            <p className="text-muted-foreground">Espera un momento, por favor.</p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center animate-fade-in-up">
                                <Check className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 animate-fade-in-up stagger-1">
                                ¡Cita Confirmada! 🎉
                            </h2>
                            <p className="text-muted-foreground mb-6 animate-fade-in-up stagger-2">
                                {message} Recibirás un mensaje de confirmación por WhatsApp con todos los detalles.
                            </p>
                            <Link href="/">
                                <Button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Ir a la página principal
                                </Button>
                            </Link>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center animate-fade-in-up">
                                <X className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 animate-fade-in-up stagger-1">
                                No se pudo confirmar
                            </h2>
                            <p className="text-muted-foreground mb-6 animate-fade-in-up stagger-2">
                                {message}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Link href="/reservar">
                                    <Button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                                        Reservar nueva cita
                                    </Button>
                                </Link>
                                <Link href="/">
                                    <Button variant="outline" className="border-pink-200 text-pink-600">
                                        Ir al inicio
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function ConfirmarEsperaPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-pink-400 animate-spin" />
                </div>
            }
        >
            <ConfirmarEsperaContent />
        </Suspense>
    );
}
