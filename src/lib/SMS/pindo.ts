import { PindoSMS, SMSPayload } from "pindo-sms";

const pindoToken = process.env.PINDO_API_TOKEN;

// Fallback logger if the system logger is not available
const log = {
    warn: (msg: string, context?: string, data?: any) => console.warn(`[${context || "PindoLib"}] ${msg}`, data || ""),
    error: (msg: string, context?: string, data?: any) => console.error(`[${context || "PindoLib"}] ${msg}`, data || ""),
    info: (msg: string, context?: string, data?: any) => console.info(`[${context || "PindoLib"}] ${msg}`, data || ""),
};

if (!pindoToken) {
    log.warn(
        "PINDO_API_TOKEN is not set in environment variables. SMS sending will be mocked.",
        "PindoLib"
    );
}

// Ensure constructor doesn't throw if token is missing
const pindo = pindoToken ? new PindoSMS(pindoToken) : null;

const formatPhoneForPindo = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!phone.startsWith("+")) {
        if (cleanPhone.startsWith("0")) {
            return "+250" + cleanPhone.substring(1);
        } else if (!cleanPhone.startsWith("250")) {
            return "+250" + cleanPhone;
        } else {
            return "+" + cleanPhone;
        }
    }
    return phone;
};

export const sendSMS = async (to: string, text: string) => {
    if (!pindoToken || !pindo) {
        log.warn(
            "[MOCK] SMS sending disabled due to missing PINDO_API_TOKEN",
            "PindoLib",
            { to, text }
        );
        return { status: "mocked" };
    }

    try {
        const formattedTo = formatPhoneForPindo(to);
        const payload: SMSPayload = {
            to: formattedTo,
            text,
            sender: "PindoTest", // Default sender ID
        };

        const response = await pindo.sendSMS(payload);
        return response;
    } catch (error: any) {
        log.error("Failed to send SMS", "PindoLib:sendSMS", { error, to, text });
        // We skip system log if it's not easily importable to prevent route crashes
        return { error: error.message || "Unknown error" };
    }
};
