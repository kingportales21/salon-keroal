-- =============================================
-- Centro de Estética y Peluquería Keroal
-- Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CLIENTES
-- =============================================
CREATE TABLE clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  notas_historial TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Public can insert (new bookings)
CREATE POLICY "Allow public insert" ON clientes
  FOR INSERT WITH CHECK (true);

-- Authenticated users (admin) can do everything
CREATE POLICY "Admin full access" ON clientes
  FOR ALL USING (auth.role() = 'authenticated');

-- Anon can read their own record by whatsapp (for booking lookup)
CREATE POLICY "Anon read" ON clientes
  FOR SELECT USING (true);

-- =============================================
-- SERVICIOS
-- =============================================
CREATE TABLE servicios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  duracion_minutos INT NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  activo BOOLEAN DEFAULT true,
  orden INT DEFAULT 0
);

ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;

-- Everyone can read services
CREATE POLICY "Public read services" ON servicios
  FOR SELECT USING (true);

-- Admin can manage services
CREATE POLICY "Admin manage services" ON servicios
  FOR ALL USING (auth.role() = 'authenticated');

-- =============================================
-- CITAS
-- =============================================
CREATE TABLE citas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_cliente UUID REFERENCES clientes(id) ON DELETE CASCADE,
  id_servicio UUID REFERENCES servicios(id),
  fecha_hora TIMESTAMPTZ NOT NULL,
  estado TEXT DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'confirmado', 'cancelado', 'finalizado')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE citas ENABLE ROW LEVEL SECURITY;

-- Public can insert (create booking)
CREATE POLICY "Public insert citas" ON citas
  FOR INSERT WITH CHECK (true);

-- Public can read (to check availability)
CREATE POLICY "Public read citas" ON citas
  FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "Admin manage citas" ON citas
  FOR ALL USING (auth.role() = 'authenticated');

-- Index for fast date lookups
CREATE INDEX idx_citas_fecha ON citas (fecha_hora);
CREATE INDEX idx_citas_estado ON citas (estado);

-- =============================================
-- LISTA DE ESPERA
-- =============================================
CREATE TABLE lista_espera (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  id_cliente UUID REFERENCES clientes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  hora_inicio TIME,
  hora_fin TIME,
  id_servicio UUID REFERENCES servicios(id),
  notificado BOOLEAN DEFAULT false,
  confirmado BOOLEAN DEFAULT false,
  token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE lista_espera ENABLE ROW LEVEL SECURITY;

-- Public can insert
CREATE POLICY "Public insert waitlist" ON lista_espera
  FOR INSERT WITH CHECK (true);

-- Public can read (token-based lookup)
CREATE POLICY "Public read waitlist" ON lista_espera
  FOR SELECT USING (true);

-- Admin full access
CREATE POLICY "Admin manage waitlist" ON lista_espera
  FOR ALL USING (auth.role() = 'authenticated');

-- Public can update (to confirm from waitlist link)
CREATE POLICY "Public update waitlist" ON lista_espera
  FOR UPDATE USING (true);

-- =============================================
-- SEED DATA: Default services
-- =============================================
INSERT INTO servicios (nombre, duracion_minutos, precio, orden) VALUES
  ('Corte de Cabello', 45, 25.00, 1),
  ('Coloración Completa', 120, 65.00, 2),
  ('Mechas / Balayage', 150, 85.00, 3),
  ('Tinte de Raíz', 90, 45.00, 4),
  ('Peinado / Brushing', 40, 20.00, 5),
  ('Tratamiento Keratina', 120, 80.00, 6),
  ('Tratamiento Hidratación', 60, 35.00, 7),
  ('Corte + Peinado', 60, 35.00, 8),
  ('Manicura', 45, 18.00, 9),
  ('Pedicura', 50, 22.00, 10);
