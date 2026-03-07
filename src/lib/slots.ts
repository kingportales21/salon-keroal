import { format, addMinutes, parse, isBefore, isEqual } from "date-fns";
import type { Cita, Servicio } from "./types";

const BUSINESS_START = 9;  // 09:00
const BUSINESS_END = 19;   // 19:00
const SLOT_INTERVAL = 30;  // 30 minutes

export type SlotInfo = {
    time: string;       // "09:00"
    available: boolean;
};

/**
 * Generate all available time slots for a given date, service duration,
 * and existing appointments.
 */
export function getAvailableSlots(
    date: string,                    // "2026-03-05"
    serviceDuration: number,         // minutes
    existingCitas: Array<{
        fecha_hora: string;
        duracion_minutos: number;
    }>
): SlotInfo[] {
    const slots: SlotInfo[] = [];

    // Generate all possible slots in the day
    for (let hour = BUSINESS_START; hour < BUSINESS_END; hour++) {
        for (let min = 0; min < 60; min += SLOT_INTERVAL) {
            const slotTime = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
            const slotStart = parse(`${date} ${slotTime}`, "yyyy-MM-dd HH:mm", new Date());
            const slotEnd = addMinutes(slotStart, serviceDuration);

            // Check the slot doesn't extend beyond business hours
            const businessClose = parse(`${date} ${BUSINESS_END}:00`, "yyyy-MM-dd HH:mm", new Date());
            if (isBefore(businessClose, slotEnd) && !isEqual(businessClose, slotEnd)) {
                // Slot would go past closing time
                slots.push({ time: slotTime, available: false });
                continue;
            }

            // Check for overlaps with existing appointments
            const hasOverlap = existingCitas.some((cita) => {
                const citaStart = new Date(cita.fecha_hora);
                const citaEnd = addMinutes(citaStart, cita.duracion_minutos);

                // Overlap condition: slot starts before existing ends AND slot ends after existing starts
                return isBefore(slotStart, citaEnd) && isBefore(citaStart, slotEnd);
            });

            slots.push({ time: slotTime, available: !hasOverlap });
        }
    }

    return slots;
}
