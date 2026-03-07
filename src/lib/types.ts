export type Cliente = {
  id: string;
  nombre: string;
  whatsapp: string;
  email: string | null;
  notas_historial: string | null;
  created_at: string;
};

export type Servicio = {
  id: string;
  nombre: string;
  duracion_minutos: number;
  precio: number;
};

export type EstadoCita = 'pendiente' | 'confirmado' | 'cancelado' | 'finalizado';

export type Cita = {
  id: string;
  id_cliente: string;
  id_servicio: string;
  fecha_hora: string;
  estado: EstadoCita;
  created_at: string;
};

export type CitaConDetalles = Cita & {
  clientes: Cliente;
  servicios: Servicio;
};

export type ListaEspera = {
  id: string;
  id_cliente: string;
  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;
  id_servicio: string;
  notificado: boolean;
  token: string;
  created_at: string;
};

export type ListaEsperaConDetalles = ListaEspera & {
  clientes: Cliente;
  servicios: Servicio;
};

export type TimeSlot = {
  time: string;       // "09:00"
  available: boolean;
};
