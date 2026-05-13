import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Briefcase, LogIn, Eye, EyeOff } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { api } from "../services/api";

const USERS_REDIRECT: Record<string, string> = {
  ADMIN:     "/",
  OPERARIO:  "/operario",
  AEROLINEA: "/aerolinea",
};

export function LoginPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const res = await api.login(user.trim(), pass);
      const redirect = USERS_REDIRECT[res.role] || "/";
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || "Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left – image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1771970574223-24e53a0c5a24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhaXJwb3J0JTIwbHVnZ2FnZSUyMGJhZ2dhZ2UlMjBjYXJvdXNlbHxlbnwxfHx8fDE3NzUxNjU3MzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Airport luggage"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1e]/80 to-[#0a0f1e]/40" />
        <div className="absolute bottom-10 left-10 right-10">
          <h2 className="text-white text-[28px]">Sistema de Gestión de Equipaje Extraviado</h2>
          <p className="text-white/60 text-[14px] mt-2">Planificación de rutas óptimas y rastreo en tiempo real a nivel global.</p>
        </div>
      </div>

      {/* Right – form */}
      <div className="flex-1 flex items-center justify-center bg-[#0a0f1e] px-6">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-8">
            <Briefcase className="w-8 h-8 text-blue-500" />
            <div>
              <div className="text-white text-[22px]">SUITChASE</div>
              <div className="text-[#94a3b8] text-[11px]">Gestión de Equipaje</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] text-[#94a3b8] mb-1.5">Usuario o Correo</label>
              <input
                type="text"
                value={user}
                onChange={e => { setUser(e.target.value); setError(""); }}
                placeholder="Ingrese su usuario o correo electrónico"
                className="w-full rounded-lg bg-[#1e293b] border border-[#334155] text-white text-[13px] px-3 py-2.5 placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] text-[#94a3b8] mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={pass}
                  onChange={e => { setPass(e.target.value); setError(""); }}
                  placeholder="Ingrese su contraseña"
                  className="w-full rounded-lg bg-[#1e293b] border border-[#334155] text-white text-[13px] px-3 py-2.5 pr-10 placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-[12px] bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[13px] transition-colors disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}