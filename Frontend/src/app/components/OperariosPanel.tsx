import React, { useState, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { AIRPORTS } from "../data/airports";
import {
  Search, Plus, Pencil, Trash2, X, ChevronLeft, ChevronRight,
  Eye, EyeOff, AlertTriangle, Users
} from "lucide-react";

export interface Operario {
  id: string;
  dni: string;
  nombre: string;
  correo: string;
  password: string;
  telefono: string;
  genero: "Masculino" | "Femenino" | "Otro";
  fechaNacimiento: string; // yyyy-mm-dd
  aeropuerto: string; // airport code
}

const STORAGE_KEY = "suitchase_operarios";

function loadOperarios(): Operario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getInitialOperarios();
  } catch {
    return getInitialOperarios();
  }
}

function saveOperarios(ops: Operario[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ops));
}

function getInitialOperarios(): Operario[] {
  return [
    { id: "op-001", dni: "70123456", nombre: "Carlos Mendoza", correo: "cmendoza@tasf.b2b", password: "operario", telefono: "+51 987 654 321", genero: "Masculino", fechaNacimiento: "1992-05-14", aeropuerto: "LIM" },
    { id: "op-002", dni: "70234567", nombre: "María García", correo: "mgarcia@tasf.b2b", password: "operario", telefono: "+54 911 234 5678", genero: "Femenino", fechaNacimiento: "1988-11-22", aeropuerto: "EZE" },
    { id: "op-003", dni: "70345678", nombre: "Ana Torres", correo: "atorres@tasf.b2b", password: "operario", telefono: "+55 11 98765 4321", genero: "Femenino", fechaNacimiento: "1995-03-08", aeropuerto: "GRU" },
    { id: "op-004", dni: "70456789", nombre: "Luis Fernández", correo: "lfernandez@tasf.b2b", password: "operario", telefono: "+34 612 345 678", genero: "Masculino", fechaNacimiento: "1990-07-30", aeropuerto: "MAD" },
    { id: "op-005", dni: "70567890", nombre: "Yuki Tanaka", correo: "ytanaka@tasf.b2b", password: "operario", telefono: "+81 90 1234 5678", genero: "Femenino", fechaNacimiento: "1993-01-17", aeropuerto: "NRT" },
    { id: "op-006", dni: "70678901", nombre: "Roberto Díaz", correo: "rdiaz@tasf.b2b", password: "operario", telefono: "+52 55 1234 5678", genero: "Masculino", fechaNacimiento: "1987-09-05", aeropuerto: "MEX" },
  ];
}

function genId() {
  return "op-" + Math.random().toString(36).slice(2, 9);
}

const ROWS_PER_PAGE = 8;

type ModalMode = "create" | "edit" | null;

interface FormData {
  dni: string;
  nombre: string;
  correo: string;
  password: string;
  telefono: string;
  genero: "Masculino" | "Femenino" | "Otro";
  fechaNacimiento: string;
  aeropuerto: string;
}

const emptyForm: FormData = {
  dni: "", nombre: "", correo: "", password: "", telefono: "",
  genero: "Masculino", fechaNacimiento: "", aeropuerto: "",
};

export function OperariosPanel() {
  const { isDark } = useTheme();
  const [operarios, setOperarios] = useState<Operario[]>(loadOperarios);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<Operario | null>(null);

  const persist = (next: Operario[]) => { setOperarios(next); saveOperarios(next); };

  const filtered = useMemo(() => {
    if (!search.trim()) return operarios;
    const q = search.toLowerCase();
    return operarios.filter(o =>
      o.dni.toLowerCase().includes(q) ||
      o.nombre.toLowerCase().includes(q) ||
      o.correo.toLowerCase().includes(q) ||
      o.aeropuerto.toLowerCase().includes(q)
    );
  }, [operarios, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const pageData = filtered.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  // Validation
  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.dni.trim()) e.dni = "DNI es requerido";
    else if (!/^\d{7,12}$/.test(form.dni.trim())) e.dni = "DNI debe tener 7–12 dígitos";
    else {
      const dup = operarios.find(o => o.dni === form.dni.trim() && o.id !== editingId);
      if (dup) e.dni = "Este DNI ya está registrado";
    }
    if (!form.nombre.trim()) e.nombre = "Nombre es requerido";
    if (!form.correo.trim()) e.correo = "Correo es requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) e.correo = "Correo inválido";
    if (modalMode === "create" && !form.password.trim()) e.password = "Contraseña es requerida";
    if (!form.telefono.trim()) e.telefono = "Teléfono es requerido";
    if (!form.fechaNacimiento) e.fechaNacimiento = "Fecha de nacimiento es requerida";
    if (!form.aeropuerto) e.aeropuerto = "Aeropuerto es requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrors({});
    setShowPassword(false);
    setModalMode("create");
  };

  const openEdit = (op: Operario) => {
    setForm({
      dni: op.dni, nombre: op.nombre, correo: op.correo,
      password: "", telefono: op.telefono, genero: op.genero,
      fechaNacimiento: op.fechaNacimiento, aeropuerto: op.aeropuerto,
    });
    setEditingId(op.id);
    setErrors({});
    setShowPassword(false);
    setModalMode("edit");
  };

  const handleSave = () => {
    if (!validate()) return;
    if (modalMode === "create") {
      const newOp: Operario = { id: genId(), ...form, dni: form.dni.trim(), nombre: form.nombre.trim(), correo: form.correo.trim(), telefono: form.telefono.trim() };
      persist([...operarios, newOp]);
    } else if (modalMode === "edit" && editingId) {
      persist(operarios.map(o => o.id === editingId ? {
        ...o,
        dni: form.dni.trim(), nombre: form.nombre.trim(), correo: form.correo.trim(),
        telefono: form.telefono.trim(), genero: form.genero,
        fechaNacimiento: form.fechaNacimiento, aeropuerto: form.aeropuerto,
        ...(form.password.trim() ? { password: form.password.trim() } : {}),
      } : o));
    }
    setModalMode(null);
  };

  const handleDelete = (op: Operario) => { setDeleteConfirm(op); };
  const confirmDelete = () => {
    if (!deleteConfirm) return;
    persist(operarios.filter(o => o.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    const [y, m, day] = d.split("-");
    return `${day}-${m}-${y}`;
  };

  const getAirportLabel = (code: string) => {
    const ap = AIRPORTS.find(a => a.code === code);
    return ap ? `${ap.city} (${code})` : code;
  };

  // Styles
  const cardBg = isDark ? "bg-[#0f172a] border-[#1e293b]" : "bg-white border-[#cbd5e1]";
  const thBg = isDark ? "bg-[#1e293b]/60" : "bg-[#e2e8f0]";
  const rowHover = isDark ? "hover:bg-[#1e293b]/40" : "hover:bg-[#f1f5f9]";
  const textPrimary = isDark ? "text-white" : "text-[#0f172a]";
  const textSecondary = isDark ? "text-[#94a3b8]" : "text-[#64748b]";
  const inputCls = `w-full rounded-lg text-[13px] px-3 py-2 border transition-colors focus:outline-none ${
    isDark
      ? "bg-[#1e293b] border-[#334155] text-white placeholder:text-white/30 focus:border-cyan-500/50"
      : "bg-[#f8fafc] border-[#cbd5e1] text-[#0f172a] placeholder:text-[#94a3b8] focus:border-blue-500"
  }`;
  const labelCls = `block text-[12px] mb-1 ${textSecondary}`;
  const errorCls = "text-red-400 text-[11px] mt-0.5";
  const modalBg = isDark ? "bg-[#0f172a] border-[#1e293b]" : "bg-white border-[#cbd5e1]";
  const overlayBg = "bg-black/60";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className={`w-5 h-5 ${isDark ? "text-cyan-400" : "text-blue-700"}`} />
          <h1 className={`text-[20px] ${textPrimary}`}>Operarios Tasf.B2B</h1>
          <span className={`text-[12px] px-2 py-0.5 rounded-full ${isDark ? "bg-[#1e293b] text-[#94a3b8]" : "bg-[#e2e8f0] text-[#64748b]"}`}>
            {operarios.length} registrados
          </span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${textSecondary}`} />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              placeholder="Buscar por DNI, nombre, correo o aeropuerto..."
              className={`pl-8 pr-3 py-1.5 rounded-lg text-[12px] border w-full sm:w-72 ${
                isDark
                  ? "bg-[#1e293b] border-[#334155] text-white placeholder:text-white/30"
                  : "bg-white border-[#cbd5e1] text-[#0f172a] placeholder:text-[#94a3b8]"
              }`}
            />
          </div>
          <button
            onClick={openCreate}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-white transition-colors shrink-0 ${isDark ? "bg-cyan-600 hover:bg-cyan-500" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo Operario
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={`border rounded-xl overflow-hidden ${cardBg}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className={thBg}>
                <th className={`text-left px-3 py-2.5 ${textSecondary}`}>DNI</th>
                <th className={`text-left px-3 py-2.5 ${textSecondary}`}>Nombre</th>
                <th className={`text-left px-3 py-2.5 ${textSecondary} hidden md:table-cell`}>Correo</th>
                <th className={`text-left px-3 py-2.5 ${textSecondary} hidden lg:table-cell`}>Teléfono</th>
                <th className={`text-left px-3 py-2.5 ${textSecondary} hidden lg:table-cell`}>Género</th>
                <th className={`text-left px-3 py-2.5 ${textSecondary} hidden md:table-cell`}>Nacimiento</th>
                <th className={`text-left px-3 py-2.5 ${textSecondary}`}>Aeropuerto</th>
                <th className={`text-center px-3 py-2.5 ${textSecondary}`}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={8} className={`text-center py-12 ${textSecondary}`}>
                    {search ? "No se encontraron operarios" : "No hay operarios registrados"}
                  </td>
                </tr>
              ) : pageData.map(op => (
                <tr key={op.id} className={`border-t ${isDark ? "border-[#1e293b]" : "border-[#e2e8f0]"} ${rowHover} transition-colors`}>
                  <td className={`px-3 py-2.5 ${textPrimary} font-mono`}>{op.dni}</td>
                  <td className={`px-3 py-2.5 ${textPrimary}`}>{op.nombre}</td>
                  <td className={`px-3 py-2.5 ${textSecondary} hidden md:table-cell`}>{op.correo}</td>
                  <td className={`px-3 py-2.5 ${textSecondary} hidden lg:table-cell`}>{op.telefono}</td>
                  <td className={`px-3 py-2.5 hidden lg:table-cell`}>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                      op.genero === "Masculino"
                        ? isDark ? "bg-blue-500/15 text-blue-400" : "bg-blue-100 text-blue-700"
                        : op.genero === "Femenino"
                        ? isDark ? "bg-pink-500/15 text-pink-400" : "bg-pink-100 text-pink-700"
                        : isDark ? "bg-purple-500/15 text-purple-400" : "bg-purple-100 text-purple-700"
                    }`}>
                      {op.genero}
                    </span>
                  </td>
                  <td className={`px-3 py-2.5 ${textSecondary} hidden md:table-cell`}>{formatDate(op.fechaNacimiento)}</td>
                  <td className={`px-3 py-2.5`}>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${isDark ? "bg-cyan-500/10 text-cyan-400" : "bg-blue-600/10 text-blue-800"}`}>
                      {op.aeropuerto}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openEdit(op)}
                        title="Editar"
                        className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-[#334155] text-amber-400" : "hover:bg-[#e2e8f0] text-amber-600"}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(op)}
                        title="Eliminar"
                        className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-[#334155] text-red-400" : "hover:bg-[#e2e8f0] text-red-600"}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > ROWS_PER_PAGE && (
          <div className={`flex items-center justify-between px-3 py-2 border-t ${isDark ? "border-[#1e293b]" : "border-[#e2e8f0]"}`}>
            <span className={`text-[11px] ${textSecondary}`}>
              {page * ROWS_PER_PAGE + 1}–{Math.min((page + 1) * ROWS_PER_PAGE, filtered.length)} de {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className={`p-1 rounded transition-colors disabled:opacity-30 ${isDark ? "hover:bg-[#334155] text-white" : "hover:bg-[#e2e8f0] text-[#0f172a]"}`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className={`text-[11px] px-2 ${textSecondary}`}>{page + 1} / {totalPages}</span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className={`p-1 rounded transition-colors disabled:opacity-30 ${isDark ? "hover:bg-[#334155] text-white" : "hover:bg-[#e2e8f0] text-[#0f172a]"}`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalMode && (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center ${overlayBg}`} onClick={() => setModalMode(null)}>
          <div className={`border rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto ${modalBg}`} onClick={e => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-5 py-3.5 border-b ${isDark ? "border-[#1e293b]" : "border-[#e2e8f0]"}`}>
              <h2 className={`text-[15px] ${textPrimary}`}>
                {modalMode === "create" ? "Registrar Operario" : "Modificar Operario"}
              </h2>
              <button onClick={() => setModalMode(null)} className={`p-1 rounded-lg transition-colors ${isDark ? "hover:bg-[#334155] text-white/60" : "hover:bg-[#e2e8f0] text-[#64748b]"}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* DNI + Nombre */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>DNI *</label>
                  <input value={form.dni} onChange={e => setForm(f => ({ ...f, dni: e.target.value }))} placeholder="70123456" className={inputCls} />
                  {errors.dni && <p className={errorCls}>{errors.dni}</p>}
                </div>
                <div>
                  <label className={labelCls}>Nombre completo *</label>
                  <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Carlos Mendoza" className={inputCls} />
                  {errors.nombre && <p className={errorCls}>{errors.nombre}</p>}
                </div>
              </div>

              {/* Correo + Contraseña */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Correo electrónico *</label>
                  <input value={form.correo} onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} placeholder="usuario@tasf.b2b" className={inputCls} />
                  {errors.correo && <p className={errorCls}>{errors.correo}</p>}
                </div>
                <div>
                  <label className={labelCls}>Contraseña {modalMode === "create" ? "*" : "(dejar vacío para mantener)"}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder={modalMode === "edit" ? "••••••" : "Contraseña"}
                      className={inputCls}
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${textSecondary}`}>
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {errors.password && <p className={errorCls}>{errors.password}</p>}
                </div>
              </div>

              {/* Teléfono + Género */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Teléfono *</label>
                  <input value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+51 987 654 321" className={inputCls} />
                  {errors.telefono && <p className={errorCls}>{errors.telefono}</p>}
                </div>
                <div>
                  <label className={labelCls}>Género *</label>
                  <select
                    value={form.genero}
                    onChange={e => setForm(f => ({ ...f, genero: e.target.value as FormData["genero"] }))}
                    className={inputCls}
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Fecha nacimiento + Aeropuerto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Fecha de nacimiento *</label>
                  <input type="date" value={form.fechaNacimiento} onChange={e => setForm(f => ({ ...f, fechaNacimiento: e.target.value }))} className={inputCls} />
                  {errors.fechaNacimiento && <p className={errorCls}>{errors.fechaNacimiento}</p>}
                </div>
                <div>
                  <label className={labelCls}>Aeropuerto asignado *</label>
                  <select
                    value={form.aeropuerto}
                    onChange={e => setForm(f => ({ ...f, aeropuerto: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">Seleccionar...</option>
                    {AIRPORTS.map(a => (
                      <option key={a.code} value={a.code}>{a.city} ({a.code})</option>
                    ))}
                  </select>
                  {errors.aeropuerto && <p className={errorCls}>{errors.aeropuerto}</p>}
                </div>
              </div>
            </div>

            <div className={`flex items-center justify-end gap-2 px-5 py-3 border-t ${isDark ? "border-[#1e293b]" : "border-[#e2e8f0]"}`}>
              <button
                onClick={() => setModalMode(null)}
                className={`px-4 py-1.5 rounded-lg text-[12px] border transition-colors ${
                  isDark ? "border-[#334155] text-white/70 hover:bg-[#1e293b]" : "border-[#cbd5e1] text-[#64748b] hover:bg-[#f1f5f9]"
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className={`px-4 py-1.5 rounded-lg text-[12px] text-white transition-colors ${isDark ? "bg-cyan-600 hover:bg-cyan-500" : "bg-blue-600 hover:bg-blue-700"}`}
              >
                {modalMode === "create" ? "Registrar" : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className={`fixed inset-0 z-[60] flex items-center justify-center ${overlayBg}`} onClick={() => setDeleteConfirm(null)}>
          <div className={`border rounded-xl w-full max-w-sm mx-4 ${modalBg}`} onClick={e => e.stopPropagation()}>
            <div className="px-5 py-4 text-center">
              <div className={`mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-3 ${isDark ? "bg-red-500/15" : "bg-red-100"}`}>
                <AlertTriangle className={`w-5 h-5 ${isDark ? "text-red-400" : "text-red-600"}`} />
              </div>
              <h3 className={`text-[14px] mb-1 ${textPrimary}`}>Eliminar operario</h3>
              <p className={`text-[12px] ${textSecondary}`}>
                ¿Estás seguro de eliminar a <span className={textPrimary}>{deleteConfirm.nombre}</span> (DNI: {deleteConfirm.dni})?
              </p>
            </div>
            <div className={`flex items-center justify-center gap-2 px-5 py-3 border-t ${isDark ? "border-[#1e293b]" : "border-[#e2e8f0]"}`}>
              <button
                onClick={() => setDeleteConfirm(null)}
                className={`px-4 py-1.5 rounded-lg text-[12px] border transition-colors ${
                  isDark ? "border-[#334155] text-white/70 hover:bg-[#1e293b]" : "border-[#cbd5e1] text-[#64748b] hover:bg-[#f1f5f9]"
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1.5 rounded-lg text-[12px] bg-red-600 hover:bg-red-500 text-white transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
