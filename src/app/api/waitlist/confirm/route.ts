import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp } from "@/lib/whatsapp";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
        return NextResponse.json({ error: "Token requerido" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get waitlist entry
    const { data: entry, error } = await supabase
        .from("lista_espera")
        .select("*, clientes(*), servicios(*)")
        .eq("token", token)
        .eq("confirmado", false)
        .single();

    if (error || !entry) {
        return NextResponse.json(
            { error: "Enlace inválido o ya utilizado" },
            { status: 404 }
        );
    }

    // Check if the slot is still available by looking for non-cancelled citas
    // in the same time range
    const fecha = entry.fecha;
    const startOfDay = `${fecha}T00:00:00`;
    const endOfDay = `${fecha}T23:59:59`;

    const { data: citas } = await supabase
        .from("citas")
        .select("fecha_hora, servicios(duracion_minutos)")
        .gte("fecha_hora", startOfDay)
        .lte("fecha_hora", endOfDay)
        .neq("estado", "cancelado");

    // Create the appointment at the freed slot time
    const horaReserva = entry.hora_inicio
        ? `${fecha}T${entry.hora_inicio}`
        : `${fecha}T09:00:00`;

    const citaDate = new Date(horaReserva);

    // Check for conflicts at that time
    const serviceDuration = entry.servicios?.duracion_minutos || 30;
    const hasConflict = (citas || []).some((c: Record<string, unknown>) => {
        const cStart = new Date(c.fecha_hora as string).getTime();
        const cDuration = ((c.servicios as Record<string, unknown>)?.duracion_minutos as number) || 30;
        const cEnd = cStart + cDuration * 60000;
        const newStart = citaDate.getTime();
        const newEnd = newStart + serviceDuration * 60000;
        return newStart < cEnd && cStart < newEnd;
    });

    if (hasConflict) {
        return NextResponse.json(
            { error: "Lo sentimos, este hueco ya ha sido ocupado por otra persona." },
            { status: 409 }
        );
    }

    // Create the appointment
    const { data: cita, error: citaError } = await supabase
        .from("citas")
        .insert({
            id_cliente: entry.id_cliente,
            id_servicio: entry.id_servicio,
            fecha_hora: horaReserva,
            estado: "confirmado",
        })
        .select()
        .single();

    if (citaError) {
        return NextResponse.json({ error: "Error al crear la cita" }, { status: 500 });
    }

    // Mark waitlist entry as confirmed
    await supabase
        .from("lista_espera")
        .update({ confirmado: true })
        .eq("id", entry.id);

    // Send WhatsApp confirmation
    const fechaFormateada = format(citaDate, "EEEE d 'de' MMMM", { locale: es });
    const horaFormateada = format(citaDate, "HH:mm");

    try {
        await sendWhatsApp(
            entry.clientes.whatsapp,
            `🎉 ¡Genial ${entry.clientes.nombre}! Tu cita desde la lista de espera ha sido *confirmada*.\n\n` +
            `📋 Servicio: ${entry.servicios.nombre}\n` +
            `📅 Fecha: ${fechaFormateada}\n` +
            `🕐 Hora: ${horaFormateada}\n\n` +
            `¡Te esperamos en Keroal! 💖`
        );
    } catch (e) {
        console.error("WhatsApp confirmation error:", e);
    }

    return NextResponse.json({ success: true, cita });
}
