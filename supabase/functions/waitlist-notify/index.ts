// supabase/functions/waitlist-notify/index.ts
// Supabase Edge Function - Invoked on appointment cancellation
// Notifies waitlisted clients about freed slots

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_WHATSAPP_FROM = Deno.env.get("TWILIO_WHATSAPP_FROM") || "whatsapp:+14155238886";
const APP_URL = Deno.env.get("APP_URL") || "https://your-domain.com";

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

serve(async (req) => {
    try {
        const { citaId } = await req.json();
        if (!citaId) {
            return new Response(JSON.stringify({ error: "citaId required" }), { status: 400 });
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Get cancelled appointment
        const { data: cita } = await supabase
            .from("citas")
            .select("*, servicios(*)")
            .eq("id", citaId)
            .single();

        if (!cita) {
            return new Response(JSON.stringify({ error: "Cita not found" }), { status: 404 });
        }

        const citaDate = new Date(cita.fecha_hora);
        const fecha = citaDate.toISOString().split("T")[0];
        const hora = citaDate.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

        // Find matching waitlist entries
        const { data: waitlist } = await supabase
            .from("lista_espera")
            .select("*, clientes(*)")
            .eq("fecha", fecha)
            .eq("confirmado", false)
            .eq("notificado", false)
            .order("created_at", { ascending: true });

        if (!waitlist || waitlist.length === 0) {
            return new Response(JSON.stringify({ message: "No waitlist entries" }));
        }

        let notified = 0;
        for (const entry of waitlist) {
            const confirmUrl = `${APP_URL}/confirmar-espera?token=${entry.token}`;

            await sendWhatsApp(
                entry.clientes.whatsapp,
                `🔔 ¡Hola ${entry.clientes.nombre}! Se ha liberado un hueco hoy a las ${hora} en *Centro de Estética y Peluquería Keroal*.\n\n` +
                `¡Pulsa aquí para reservarlo antes que nadie! 👇\n${confirmUrl}`
            );

            await supabase
                .from("lista_espera")
                .update({ notificado: true })
                .eq("id", entry.id);

            notified++;
        }

        return new Response(JSON.stringify({ success: true, notified }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
