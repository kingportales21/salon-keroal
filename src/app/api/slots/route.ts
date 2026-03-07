import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailableSlots } from "@/lib/slots";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");

    if (!date || !serviceId) {
        return NextResponse.json(
            { error: "Se requieren los parámetros date y serviceId" },
            { status: 400 }
        );
    }

    const supabase = createAdminClient();

    // Get service duration
    const { data: service, error: serviceError } = await supabase
        .from("servicios")
        .select("duracion_minutos")
        .eq("id", serviceId)
        .single();

    if (serviceError || !service) {
        return NextResponse.json(
            { error: "Servicio no encontrado" },
            { status: 404 }
        );
    }

    // Get existing appointments for that date (non-cancelled)
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const { data: citas, error: citasError } = await supabase
        .from("citas")
        .select("fecha_hora, servicios(duracion_minutos)")
        .gte("fecha_hora", startOfDay)
        .lte("fecha_hora", endOfDay)
        .neq("estado", "cancelado");

    if (citasError) {
        return NextResponse.json(
            { error: "Error al obtener citas" },
            { status: 500 }
        );
    }

    const existingCitas = (citas || []).map((c: Record<string, unknown>) => ({
        fecha_hora: c.fecha_hora as string,
        duracion_minutos: (c.servicios as Record<string, unknown>)?.duracion_minutos as number || 30,
    }));

    const slots = getAvailableSlots(date, service.duracion_minutos, existingCitas);

    return NextResponse.json({ slots, serviceDuration: service.duracion_minutos });
}
