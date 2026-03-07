import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp } from "@/lib/whatsapp";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Webhook triggered when an appointment is cancelled
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { citaId } = body;

        if (!citaId) {
            return NextResponse.json({ error: "citaId requerido" }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Get the cancelled cita details
        const { data: cita } = await supabase
            .from("citas")
            .select("*, servicios(*)")
            .eq("id", citaId)
            .single();

        if (!cita) {
            return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
        }

        const citaDate = new Date(cita.fecha_hora);
        const fecha = format(citaDate, "yyyy-MM-dd");
        const hora = format(citaDate, "HH:mm");

        // Find waitlisted clients for that date
        const { data: waitlist } = await supabase
            .from("lista_espera")
            .select("*, clientes(*), servicios(*)")
            .eq("fecha", fecha)
            .eq("confirmado", false)
            .eq("notificado", false)
            .order("created_at", { ascending: true });

        if (!waitlist || waitlist.length === 0) {
            return NextResponse.json({ message: "No hay personas en lista de espera" });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        // Notify all matching waitlisted clients
        for (const entry of waitlist) {
            // Check if time range matches (if they specified a preference)
            if (entry.hora_inicio && entry.hora_fin) {
                const entryStart = entry.hora_inicio;
                const entryEnd = entry.hora_fin;
                if (hora < entryStart || hora > entryEnd) {
                    continue; // Skip – outside their preferred range
                }
            }

            const confirmUrl = `${appUrl}/confirmar-espera?token=${entry.token}`;

            try {
                await sendWhatsApp(
                    entry.clientes.whatsapp,
                    `🔔 ¡Hola ${entry.clientes.nombre}! Se ha liberado un hueco en *Centro de Estética y Peluquería Keroal*.\n\n` +
                    `📅 Fecha: ${format(citaDate, "EEEE d 'de' MMMM", { locale: es })}\n` +
                    `🕐 Hora: ${hora}\n\n` +
                    `¡Reserva ahora antes que nadie! 👇\n${confirmUrl}`
                );

                // Mark as notified
                await supabase
                    .from("lista_espera")
                    .update({ notificado: true })
                    .eq("id", entry.id);
            } catch (e) {
                console.error(`Error notifying waitlist client ${entry.id}:`, e);
            }
        }

        return NextResponse.json({ success: true, notified: waitlist.length });
    } catch (error) {
        console.error("Cancel webhook error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
