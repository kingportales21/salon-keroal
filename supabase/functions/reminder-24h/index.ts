// supabase/functions/reminder-24h/index.ts
// Supabase Edge Function - Cron: every hour
// Sends WhatsApp reminders to clients with appointments 24h from now

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM") || "whatsapp:+14155238886";

async function sendWhatsApp(to: string, message: string) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    const body = new URLSearchParams({
        To: toNumber,
        From: TWILIO_WHATSAPP_FROM,
        Body: message,
    });

    const response = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: "Basic " + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`),
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
    });

    return response.json();
}

serve(async () => {
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Find appointments between 23-25 hours from now
        const now = new Date();
        const from = new Date(now.getTime() + 23 * 60 * 60 * 1000);
        const to = new Date(now.getTime() + 25 * 60 * 60 * 1000);

        const { data: citas, error } = await supabase
            .from("citas")
            .select("*, clientes(*), servicios(*)")
            .gte("fecha_hora", from.toISOString())
            .lte("fecha_hora", to.toISOString())
            .in("estado", ["pendiente", "confirmado"]);

        if (error) throw error;

        let sent = 0;
        for (const cita of citas || []) {
            const fechaHora = new Date(cita.fecha_hora);
            const hora = fechaHora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
            const fecha = fechaHora.toLocaleDateString("es-ES", {
                weekday: "long",
                day: "numeric",
                month: "long",
            });

            await sendWhatsApp(
                cita.clientes.whatsapp,
                `📅 ¡Hola ${cita.clientes.nombre}! Te recordamos que mañana tienes cita en *Centro de Estética y Peluquería Keroal*.\n\n` +
                `📋 Servicio: ${cita.servicios.nombre}\n` +
                `🕐 Hora: ${hora}\n` +
                `📆 Fecha: ${fecha}\n\n` +
                `¡Te esperamos! 💖`
            );
            sent++;
        }

        return new Response(JSON.stringify({ success: true, sent }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
