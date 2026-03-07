"use client";

import Link from "next/link";
import {
  Scissors,
  Sparkles,
  Calendar,
  Clock,
  Star,
  Heart,
  ArrowRight,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const services = [
  { icon: Scissors, name: "Corte de Cabello", price: "25€", desc: "Diseñamos el corte perfecto para ti" },
  { icon: Sparkles, name: "Coloración Completa", price: "65€", desc: "Color vibrante y duradero" },
  { icon: Star, name: "Mechas / Balayage", price: "85€", desc: "Transiciones naturales y luminosas" },
  { icon: Heart, name: "Tratamiento Keratina", price: "80€", desc: "Cabello liso, suave y brillante" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight gradient-text">Keroal</h1>
              <p className="text-[10px] text-muted-foreground leading-none">Centro de Estética y Peluquería</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#servicios" className="hover:text-primary transition-colors">Servicios</a>
            <a href="#nosotras" className="hover:text-primary transition-colors">Nosotras</a>
            <a href="#contacto" className="hover:text-primary transition-colors">Contacto</a>
          </div>
          <Link href="/reservar">
            <Button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg shadow-pink-500/25 transition-all hover:shadow-pink-500/40 hover:scale-105">
              <Calendar className="w-4 h-4 mr-2" />
              Reservar Cita
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-pink-200/40 to-rose-300/30 rounded-full blur-3xl" />
          <div className="absolute top-20 -left-20 w-72 h-72 bg-gradient-to-br from-purple-200/30 to-pink-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-gradient-to-br from-amber-100/30 to-rose-100/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-50 border border-pink-100 text-pink-600 text-sm mb-8 animate-fade-in-up">
              <Sparkles className="w-4 h-4" />
              <span>Tu belleza, nuestra pasión</span>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in-up stagger-1">
              Centro de Estética y Peluquería{" "}
              <span className="gradient-text">Keroal</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-fade-in-up stagger-2">
              Descubre un espacio dedicado a realzar tu belleza natural.
              Tratamientos personalizados, productos de calidad y un equipo que
              te escucha.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-3">
              <Link href="/reservar">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-xl shadow-pink-500/25 text-lg px-8 py-6 transition-all hover:shadow-pink-500/40 hover:scale-105"
                >
                  Reserva tu Cita
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="tel:+34600000000">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-pink-200 text-pink-600 hover:bg-pink-50 text-lg px-8 py-6"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Llámanos
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-16 max-w-lg mx-auto animate-fade-in-up stagger-4">
              {[
                { value: "10+", label: "Años de experiencia" },
                { value: "5000+", label: "Clientas felices" },
                { value: "⭐ 4.9", label: "Valoración" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold gradient-text">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="servicios" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="text-sm text-pink-500 font-medium tracking-wider uppercase">
              Nuestros Servicios
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-3">
              Tratamientos <span className="gradient-text">a medida</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-lg mx-auto">
              Cada servicio está diseñado para ti. Desde un simple corte hasta
              una transformación completa.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, i) => (
              <Card
                key={service.name}
                className="group border-pink-100/50 hover:border-pink-200 hover:shadow-xl hover:shadow-pink-100/30 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-4 group-hover:from-pink-200 group-hover:to-rose-200 transition-colors">
                    <service.icon className="w-6 h-6 text-pink-500" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{service.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {service.desc}
                  </p>
                  <span className="text-2xl font-bold gradient-text">
                    {service.price}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/reservar">
              <Button
                variant="outline"
                size="lg"
                className="border-pink-200 text-pink-600 hover:bg-pink-50"
              >
                Ver todos los servicios
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About section */}
      <section id="nosotras" className="py-20 sm:py-28 bg-gradient-to-b from-pink-50/50 to-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-sm text-pink-500 font-medium tracking-wider uppercase">
                Sobre Nosotras
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-3 mb-6">
                Un espacio creado{" "}
                <span className="gradient-text">para ti</span>
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  En Centro de Estética y Peluquería Keroal creemos que cada
                  mujer merece un momento para cuidarse. Nuestro salón es un refugio
                  donde podrás relajarte y confiar en manos expertas.
                </p>
                <p>
                  Utilizamos productos de la más alta calidad y nos mantenemos
                  en constante formación para ofrecerte las últimas tendencias y
                  técnicas.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                {[
                  { icon: Clock, text: "Horario flexible" },
                  { icon: Star, text: "Productos premium" },
                  { icon: Heart, text: "Trato personalizado" },
                  { icon: Sparkles, text: "Últimas tendencias" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-pink-100 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-pink-500" />
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-pink-200 via-rose-200 to-purple-200 overflow-hidden shadow-2xl shadow-pink-200/30">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 text-white/60 mx-auto mb-4" />
                    <p className="text-white/80 text-xl font-semibold">Keroal</p>
                    <p className="text-white/60 text-sm">Tu belleza, nuestra pasión</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-amber-200 to-pink-200 rounded-2xl blur-sm opacity-50" />
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-sm opacity-50" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400 p-12 sm:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                ¿Lista para brillar?
              </h2>
              <p className="text-pink-100 text-lg mb-8 max-w-lg mx-auto">
                Reserva tu cita en segundos y déjate mimar por nuestro equipo de
                profesionales.
              </p>
              <Link href="/reservar">
                <Button
                  size="lg"
                  className="bg-white text-pink-600 hover:bg-pink-50 shadow-xl text-lg px-10 py-6 transition-all hover:scale-105"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Reservar Ahora
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contacto" className="border-t border-pink-100 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold gradient-text">Keroal</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Centro de Estética y Peluquería. Tu belleza, nuestra pasión.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Horario</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Lunes a Viernes: 9:00 - 19:00</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Sábado: 9:00 - 14:00</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Domingo: Cerrado</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contacto</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+34 600 000 000</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Dirección del salón</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-pink-100 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Centro de Estética y Peluquería Keroal. Todos los derechos
            reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
