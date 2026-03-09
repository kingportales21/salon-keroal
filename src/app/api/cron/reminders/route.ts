import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendWhatsApp } from "@/lib/whatsapp";

// Security: verify the request is from Vercel Cron or manual test
function verifyCron(request: Request): boolean {
    const cronSecret = process.env.CRON_SECRET;

    // If no CRON_SECRET is set, allow (for development)
    if (!cronSecret) return true;

    // Check Bearer token (Vercel Cron sends this automatically)
    const authHeader = request.headers.get("authorization");
    if (authHeader === `Bearer ${cronSecret}`) return true;

    // Check query param (for manual testing in browser)
    const url = new URL(request.url);
    if (url.searchParams.get("secret") === cronSecret) return true;

    return false;
}

// Admin Supabase client (service role)
function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function GET(request: Request) {
    // Verify cron authentication
    if (!verifyCron(request)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabase();
    const now = new Date();
    const results = {
        reminder24h: { sent: 0, errors: 0, details: [] as string[] },
        reminder2h: { sent: 0, errors: 0, details: [] as string[] },
        timestamp: now.toISOString(),
    };

    // ===================================================
    // 1. RECORDATORIOS DEL DÍA SIGUIENTE (Vercel cron diario)
    // ===================================================
    try {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(23, 59, 59, 999);

        const { data: citas24h } = await supabase
            .from("citas")
            .select("*, clientes(*), servicios(*)")
            .gte("fecha_hora", tomorrow.toISOString())
            .lte("fecha_hora", tomorrowEnd.toISOString())
            .in("estado", ["pendiente", "confirmado"])
            .is("recordatorio_24h", null);

        if (citas24h && citas24h.length > 0) {
            for (const cita of citas24h) {
                const cliente = cita.clientes;
                const servicio = cita.servicios;

                if (!cliente?.whatsapp) continue;

                const fechaCita = new Date(cita.fecha_hora);
                const hora = fechaCita.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Madrid",
                });
                const fecha = fechaCita.toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    timeZone: "Europe/Madrid",
                });

                const message =
                    `✨ *Recordatorio de Cita - Keroal*\n\n` +
                    `Hola ${cliente.nombre} 👋\n\n` +
                    `Te recordamos que tienes una cita *mañana*:\n\n` +
                    `📅 *Fecha:* ${fecha}\n` +
                    `🕐 *Hora:* ${hora}\n` +
                    `💇‍♀️ *Servicio:* ${servicio?.nombre || "Servicio"}\n` +
                    `💰 *Precio:* ${servicio?.precio || 0}€\n\n` +
                    `Si necesitas cancelar o cambiar la cita, avísanos lo antes posible.\n\n` +
                    `¡Te esperamos! 💕\n` +
                    `_Centro de Estética y Peluquería Keroal_`;

                const result = await sendWhatsApp(cliente.whatsapp, message);

                if (result.success) {
                    // Mark as notified so we don't send again
                    await supabase
                        .from("citas")
                        .update({ recordatorio_24h: now.toISOString() })
                        .eq("id", cita.id);

                    results.reminder24h.sent++;
                    results.reminder24h.details.push(`✅ ${cliente.nombre} (${hora})`);
                } else {
                    results.reminder24h.errors++;
                    results.reminder24h.details.push(`❌ ${cliente.nombre}: error`);
                }
            }
        }
    } catch (error) {
        console.error("Error in 24h reminders:", error);
        results.reminder24h.details.push(`❌ Error: ${String(error)}`);
    }

    // ===================================================
    // 2. RECORDATORIO 2 HORAS ANTES (cortesía)
    // ===================================================
    try {
        const in90min = new Date(now.getTime() + 90 * 60 * 1000); // 1.5h from now
        const in150min = new Date(now.getTime() + 150 * 60 * 1000); // 2.5h from now

        const { data: citas2h } = await supabase
            .from("citas")
            .select("*, clientes(*), servicios(*)")
            .gte("fecha_hora", in90min.toISOString())
            .lte("fecha_hora", in150min.toISOString())
            .in("estado", ["pendiente", "confirmado"])
            .is("recordatorio_2h", null);

        if (citas2h && citas2h.length > 0) {
            for (const cita of citas2h) {
                const cliente = cita.clientes;
                const servicio = cita.servicios;

                if (!cliente?.whatsapp) continue;

                const fechaCita = new Date(cita.fecha_hora);
                const hora = fechaCita.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Madrid",
                });

                const message =
                    `⏰ *¡Tu cita es en 2 horas!*\n\n` +
                    `Hola ${cliente.nombre} 👋\n\n` +
                    `Te esperamos a las *${hora}* para tu *${servicio?.nombre || "cita"}*.\n\n` +
                    `📍 Centro de Estética y Peluquería Keroal\n\n` +
                    `¡Hasta pronto! 💕`;

                const result = await sendWhatsApp(cliente.whatsapp, message);

                if (result.success) {
                    await supabase
                        .from("citas")
                        .update({ recordatorio_2h: now.toISOString() })
                        .eq("id", cita.id);

                    results.reminder2h.sent++;
                    results.reminder2h.details.push(`✅ ${cliente.nombre} (${hora})`);
                } else {
                    results.reminder2h.errors++;
                    results.reminder2h.details.push(`❌ ${cliente.nombre}: error`);
                }
            }
        }
    } catch (error) {
        console.error("Error in 2h reminders:", error);
        results.reminder2h.details.push(`❌ Error: ${String(error)}`);
    }

    console.log("Reminder cron completed:", JSON.stringify(results));

    return NextResponse.json({
        ok: true,
        ...results,
    });
}
