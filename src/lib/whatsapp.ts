import twilio from "twilio";

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
    if (!client) {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;

        if (!accountSid || !authToken || !accountSid.startsWith("AC")) {
            console.warn("Twilio credentials not configured. WhatsApp messages will be simulated.");
            return null;
        }

        client = twilio(accountSid, authToken);
    }
    return client;
}

export async function sendWhatsApp(to: string, message: string) {
    const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

    // Clean the number
    let cleanNumber = to.replace(/\s+/g, "");

    // If it's a Spanish mobile number without country code, add +34
    if (/^[67]\d{8}$/.test(cleanNumber)) {
        cleanNumber = `+34${cleanNumber}`;
    } else if (!cleanNumber.startsWith("+")) {
        // Fallback: assume +34 if no + is provided at all
        cleanNumber = `+34${cleanNumber}`;
    }

    const toNumber = `whatsapp:${cleanNumber}`;

    const twilioClient = getClient();

    if (!twilioClient) {
        console.log(`[WhatsApp SIMULATED] To: ${to}`);
        console.log(`[WhatsApp SIMULATED] Message: ${message}`);
        return { success: true, sid: "simulated" };
    }

    try {
        const result = await twilioClient.messages.create({
            body: message,
            from: whatsappFrom,
            to: toNumber,
        });
        console.log(`WhatsApp sent to ${to}: ${result.sid}`);
        return { success: true, sid: result.sid };
    } catch (error) {
        console.error(`WhatsApp error to ${to}:`, error);
        return { success: false, error };
    }
}
