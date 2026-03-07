import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp } from "@/lib/whatsapp";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { nombre, whatsapp, email, serviceId, fechaHora, notas } = body;

        if (!nombre || !whatsapp || !serviceId || !fechaHora) {
            return NextResponse.json(
                { error: "Faltan campos obligatorios" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Get service details
        const { data: service } = await supabase
            .from("servicios")
            .select("*")
            .eq("id", serviceId)
            .single();

        if (!service) {
            return NextResponse.json(
                { error: "Servicio no encontrado" },
                { status: 404 }
            );
        }

        // Check if client exists by whatsapp
        let { data: cliente } = await supabase
            .from("clientes")
            .select("*")
            .eq("whatsapp", whatsapp)
            .single();

        if (!cliente) {
            // Create new client
            const { data: newCliente, error: clienteError } = await supabase
                .from("clientes")
                .insert({ nombre, whatsapp, email, notas_historial: notas || null })
                .select()
                .single();

            if (clienteError) {
                return NextResponse.json(
                    { error: "Error al crear cliente" },
                    { status: 500 }
                );
            }
            cliente = newCliente;
        }

        // Verify slot is still available (double-check for race conditions)
        const citaDate = new Date(fechaHora);
        const startOfDay = format(citaDate, "yyyy-MM-dd") + "T00:00:00";
        const endOfDay = format(citaDate, "yyyy-MM-dd") + "T23:59:59";

        const { data: existingCitas } = await supabase
            .from("citas")
            .select("fecha_hora, servicios(duracion_minutos)")
            .gte("fecha_hora", startOfDay)
            .lte("fecha_hora", endOfDay)
            .neq("estado", "cancelado");

        // Simple overlap check
        const hasConflict = (existingCitas || []).some((c: Record<string, unknown>) => {
            const cStart = new Date(c.fecha_hora as string).getTime();
            const cDuration = ((c.servicios as Record<string, unknown>)?.duracion_minutos as number) || 30;
            const cEnd = cStart + cDuration * 60000;

            const newStart = citaDate.getTime();
            const newEnd = newStart + service.duracion_minutos * 60000;

            return newStart < cEnd && cStart < newEnd;
        });

        if (hasConflict) {
            return NextResponse.json(
                { error: "Este horario ya no está disponible. Por favor, selecciona otro." },
                { status: 409 }
            );
        }

        // Create the appointment
        const { data: cita, error: citaError } = await supabase
            .from("citas")
            .insert({
                id_cliente: cliente.id,
                id_servicio: serviceId,
                fecha_hora: fechaHora,
                estado: "confirmado",
            })
            .select()
            .single();

        if (citaError) {
            return NextResponse.json(
                { error: "Error al crear la cita" },
                { status: 500 }
            );
        }

        // Send WhatsApp confirmation
        const fechaFormateada = format(citaDate, "EEEE d 'de' MMMM", { locale: es });
        const horaFormateada = format(citaDate, "HH:mm");

        try {
            await sendWhatsApp(
                whatsapp,
                `✨ ¡Hola ${nombre}! Tu cita en *Centro de Estética y Peluquería Keroal* ha sido confirmada.\n\n` +
                `📋 Servicio: ${service.nombre}\n` +
                `📅 Fecha: ${fechaFormateada}\n` +
                `🕐 Hora: ${horaFormateada}\n` +
                `💰 Precio: ${service.precio}€\n\n` +
                `Te esperamos. ¡Gracias por confiar en nosotras! 💖`
            );
        } catch (e) {
            console.error("Error sending WhatsApp:", e);
            // Don't fail the booking if WhatsApp fails
        }

        return NextResponse.json({
            success: true,
            cita,
            message: "Cita creada con éxito",
        });
    } catch (error) {
        console.error("Booking error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
