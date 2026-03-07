import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { nombre, whatsapp, email, serviceId, fecha, horaInicio, horaFin } = body;

        if (!nombre || !whatsapp || !serviceId || !fecha) {
            return NextResponse.json(
                { error: "Faltan campos obligatorios" },
                { status: 400 }
            );
        }

        const supabase = createAdminClient();

        // Check if client exists
        let { data: cliente } = await supabase
            .from("clientes")
            .select("*")
            .eq("whatsapp", whatsapp)
            .single();

        if (!cliente) {
            const { data: newCliente, error } = await supabase
                .from("clientes")
                .insert({ nombre, whatsapp, email })
                .select()
                .single();

            if (error) {
                return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 });
            }
            cliente = newCliente;
        }

        // Add to waitlist
        const { data: entry, error: waitError } = await supabase
            .from("lista_espera")
            .insert({
                id_cliente: cliente.id,
                fecha,
                hora_inicio: horaInicio || null,
                hora_fin: horaFin || null,
                id_servicio: serviceId,
            })
            .select()
            .single();

        if (waitError) {
            return NextResponse.json({ error: "Error al unirse a la lista de espera" }, { status: 500 });
        }

        // Send WhatsApp notification
        try {
            await sendWhatsApp(
                whatsapp,
                `⏳ ¡Hola ${nombre}! Te has apuntado a la *lista de espera* en Centro de Estética y Peluquería Keroal para el día ${fecha}.\n\n` +
                `Si se libera un hueco, te avisaremos de inmediato por WhatsApp. 💖`
            );
        } catch (e) {
            console.error("WhatsApp waitlist notification error:", e);
        }

        return NextResponse.json({ success: true, entry });
    } catch (error) {
        console.error("Waitlist error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
