"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  doc, getDoc, updateDoc, arrayUnion,
  Timestamp, serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Exercises, { Exercise } from "../cursoItem/exercises/Exercises";
import LessonItem from "../cursoItem/LessonItem";
import ContentTimelineEditor from "../cursoItem/Content/ContentTimeLineEditor";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  X: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Plus: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Save: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  Upload: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  ChevronDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  Layers: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Clipboard: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
  Flag: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>,
  Check: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  CheckCircle: () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Clock: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  ArrowRight: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Tag: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
};

// ─── UI Primitives — idénticos a CrearMaterial ────────────────────────────────

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${active ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
    >
      {children}
    </button>
  );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-slate-200 p-6 ${className}`}>{children}</div>;
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700 mb-1.5">{children}</label>;
}

function Input({ value, onChange, placeholder, type = "text", required }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} required={required}
      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition resize-none"
    />
  );
}

function Select({ value, onChange, children }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition bg-white"
    >
      {children}
    </select>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ContentItemType = "unit" | "final_exam" | "project" | "closing";

interface LessonBlock { type: "title"|"description"|"theory"|"video"|"pdf"|"vocabulary"|"exercise"; [key: string]: any; }
interface Leccion { id: string; blocks: LessonBlock[]; }
interface ContentItem { id: string; type: ContentItemType; refId?: string; }
interface Unidad { id: string; titulo: string; descripcion: string; introVideo?: string; urlImagen: string; ejercicios: Exercise[]; textoCierre: string; lecciones: Leccion[]; closing?: Record<string, any>; }
interface ExamenFinal { introTexto: string; ejercicios: Exercise[]; }
interface Capstone { videoUrl: string; instrucciones: string; checklist: string[]; }
interface Curso { titulo: string; descripcion: string; nivel: string; idioma: string; publico: boolean; videoPresentacion: string; urlImagen: string; cursantes: string[]; textoFinalCurso: string; textoFinalCursoVideoUrl: string; unidades?: Unidad[]; examenFinal?: ExamenFinal; capstone?: Capstone; contentTimeline?: ContentItem[]; createdAt?: Timestamp | null; updatedAt?: Timestamp | null; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const isValidUrl = (s: string) => { try { const u = new URL(s); return u.protocol === "http:" || u.protocol === "https:"; } catch { return false; } };
const defaultBlock = (type: string): LessonBlock => {
  if (type === "vocabulary") return { type: "vocabulary", entries: [] };
  if (type === "exercise") return { type: "exercise", exercise: null };
  if (type === "video" || type === "pdf") return { type, url: "" } as LessonBlock;
  return { type, value: "" } as LessonBlock;
};

// ─── TimelineItemBadge — igual que CrearMaterial ──────────────────────────────

function TimelineItemBadge({ item, isSelected, label, onSelect, onDelete }: {
  item: ContentItem; isSelected: boolean; label: string; onSelect: () => void; onDelete: () => void;
}) {
  const colors: Record<ContentItemType, string> = {
    unit: isSelected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
    final_exam: isSelected ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100",
    project: isSelected ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100",
    closing: isSelected ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  };
  return (
    <div className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-all cursor-pointer ${colors[item.type]}`}>
      <span onClick={onSelect} className="flex-1">{label}</span>
      <button type="button" onClick={e => { e.stopPropagation(); onDelete(); }} className="ml-1 opacity-50 hover:opacity-100 transition"><Icon.X /></button>
    </div>
  );
}

// ─── JsonSectionImport — mismo estilo que CrearMaterial ───────────────────────

function JsonSectionImport({ hint, onLoad, validate }: {
  hint: string; onLoad: (data: any) => void; validate?: (data: any) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const handleLoad = () => {
    if (!text.trim()) { toast.error("El campo está vacío"); return; }
    try {
      const data = JSON.parse(text);
      if (validate && !validate(data)) { toast.error("Estructura JSON inválida para esta sección."); return; }
      onLoad(data); setText(""); setOpen(false);
      toast.success("✅ Sección actualizada desde JSON");
    } catch { toast.error("❌ JSON inválido. Revisá las comillas y llaves."); }
  };

  return (
    <div className="border border-dashed border-slate-300 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 transition text-xs font-medium text-slate-500"
      >
        <span className="flex items-center gap-2"><Icon.Upload /> Autocompletar desde JSON</span>
        <span className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}><Icon.ChevronDown /></span>
      </button>
      {open && (
        <div className="p-4 space-y-3 bg-white border-t border-slate-100">
          <p className="text-xs text-slate-400">
            Estructura esperada: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 text-[10px]">{hint}</code>
          </p>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={5} spellCheck={false}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 transition resize-none bg-slate-50"
          />
          <div className="flex gap-2">
            <button type="button" onClick={handleLoad} className="px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 transition">Aplicar</button>
            <button type="button" onClick={() => { setText(""); setOpen(false); }} className="px-4 py-1.5 border border-slate-200 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-50 transition">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function EditCourseForm({
  courseId, initialData, loading, onClose,
}: { courseId: string; initialData?: any; loading?: boolean; onClose?: () => void; }) {
  const { firestore, alumnos, reloadData, alumnosRaw, userProfile } = useAuth();

  const [curso, setCurso] = useState<Curso | null>(null);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [examenFinal, setExamenFinal] = useState<ExamenFinal>({ introTexto: "", ejercicios: [] });
  const [capstone, setCapstone] = useState<Capstone>({ videoUrl: "", instrucciones: "", checklist: [] });
  const [uploading, setUploading] = useState(false);

  const [tab, setTab] = useState<"general" | "content" | "students">("general");
  const [contentTimeline, setContentTimeline] = useState<ContentItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

const [filterIdioma, setFilterIdioma] = useState("");
const [filterNivel, setFilterNivel] = useState("");
const [filterNombre, setFilterNombre] = useState("");
const [filterCursoId, setFilterCursoId] = useState("");
const [emailInput, setEmailInput] = useState("");
const [alumnosPage, setAlumnosPage] = useState(0);
const PAGE_SIZE = 50;

  const [resumeItem, setResumeItem] = useState<{ id: string; name: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // ── Persistencia de posición ───────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId || !userProfile?.batchId || !userProfile?.userKey || !firestore) return;
    const t = setTimeout(async () => {
      try { await updateDoc(doc(firestore, "alumnos", userProfile.batchId), { [`${userProfile.userKey}.editingProgress.${courseId}`]: selectedId }); }
      catch (e) { console.error(e); }
    }, 1500);
    return () => clearTimeout(t);
  }, [selectedId, userProfile, firestore, courseId]);

  useEffect(() => {
    const check = async () => {
      if (!userProfile?.batchId || !userProfile?.userKey || !firestore || !contentTimeline.length) return;
      try {
        const snap = await getDoc(doc(firestore, "alumnos", userProfile.batchId));
        if (!snap.exists()) return;
        const lastId = (snap.data()[userProfile.userKey]?.editingProgress || {})[courseId];
        if (!lastId || lastId === selectedId) return;
        const found = contentTimeline.find(i => i.id === lastId);
        if (!found) return;
        let name = "Sección anterior";
        if (found.type === "unit") { const u = unidades.find(u => u.id === found.refId); if (u) name = `Unidad: ${u.titulo || "Sin título"}`; }
        else if (found.type === "final_exam") name = "Examen Final";
        else if (found.type === "project") name = "Proyecto Final";
        else if (found.type === "closing") name = "Cierre";
        setResumeItem({ id: lastId, name });
      } catch (e) { console.error(e); }
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentTimeline, userProfile?.batchId, courseId]);

  // ── Cargar datos ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!initialData) return;
    const safe = normalizeCourseData(initialData);
    setCurso(safe); setUnidades(safe.unidades || []);
    setExamenFinal(safe.examenFinal || { introTexto: "", ejercicios: [] });
    setCapstone(safe.capstone || { videoUrl: "", instrucciones: "", checklist: [] });
    setContentTimeline(safe.contentTimeline || []);
    if (safe.contentTimeline?.length) setSelectedId(safe.contentTimeline[0].id);
  }, [initialData]);

  // ── Timeline ───────────────────────────────────────────────────────────────
  const agregarUnidad = () => {
    const nueva: Unidad = { id: makeId(), titulo: "", descripcion: "", introVideo: "", urlImagen: "", ejercicios: [], textoCierre: "", lecciones: [] };
    setUnidades(p => [...p, nueva]);
    const tId = `unit-${nueva.id}`;
    setContentTimeline(p => [...p, { id: tId, type: "unit", refId: nueva.id }]);
    setTimeout(() => setSelectedId(tId), 50);
  };

  const addSingleton = (type: ContentItemType) => {
    if (contentTimeline.some(i => i.type === type)) { toast.error(`Ya existe un bloque "${type}"`); return; }
    const id = makeId();
    setContentTimeline(p => [...p, { id, refId: id, type }]);
    setSelectedId(id);
  };

  const deleteItem = (itemId: string) => {
    const item = contentTimeline.find(i => i.id === itemId);
    if (!item || !confirm(`Delete this ${item.type.replace("_", " ")}?`)) return;
    setContentTimeline(p => p.filter(i => i.id !== itemId));
    setCurso(p => p ? { ...p, contentTimeline: p.contentTimeline?.filter(i => i.id !== itemId) } : p);
    if (item.type === "unit") setUnidades(p => p.filter(u => u.id !== item.refId));
    if (selectedId === itemId) setSelectedId(null);
  };

  // ── Unit mutations ─────────────────────────────────────────────────────────
  const updateUnidad = useCallback((idx: number, patch: Partial<Unidad>) => {
    setUnidades(p => { const c = [...p]; c[idx] = { ...c[idx], ...patch }; return c; });
  }, []);

  const agregarLeccion = (uIdx: number) => setUnidades(p => p.map((u, i) => i === uIdx ? { ...u, lecciones: [...u.lecciones, { id: makeId(), blocks: [] }] } : u));
  const borrarLeccion = (uIdx: number, lIdx: number) => setUnidades(p => p.map((u, i) => i === uIdx ? { ...u, lecciones: u.lecciones.filter((_, j) => j !== lIdx) } : u));
  const updateBlock = (uIdx: number, lIdx: number, bIdx: number, val: LessonBlock) => { setUnidades(p => { const c = structuredClone(p); c[uIdx].lecciones[lIdx].blocks[bIdx] = val; return c; }); };
  const deleteBlock = (uIdx: number, lIdx: number, bIdx: number) => { setUnidades(p => { const c = structuredClone(p); c[uIdx].lecciones[lIdx].blocks.splice(bIdx, 1); return c; }); };
  const addBlock = (uIdx: number, lIdx: number, type: LessonBlock["type"]) => { setUnidades(p => { const c = structuredClone(p); c[uIdx].lecciones[lIdx].blocks.push(defaultBlock(type)); return c; }); };

  // ── JSON import handlers ───────────────────────────────────────────────────
  const handleImportUnit = (idx: number) => (data: any) => {
  const raw = data.unidad ?? data;

  setUnidades(prev => {
    const copy = structuredClone(prev);
    const u = copy[idx];

    // Campos de texto: solo aplica si viene un valor no vacío (no pisa con "")
    if (raw.titulo && typeof raw.titulo === "string") u.titulo = raw.titulo;
    if (raw.descripcion && typeof raw.descripcion === "string") u.descripcion = raw.descripcion;
    if (raw.introVideo && typeof raw.introVideo === "string") u.introVideo = raw.introVideo;
    if (raw.textoCierre && typeof raw.textoCierre === "string") u.textoCierre = raw.textoCierre;

    // Lecciones: APPEND, no reemplazo
    // Las lecciones existentes se conservan; las nuevas se agregan al final
    if (Array.isArray(raw.lecciones) && raw.lecciones.length > 0) {
      const newLessons = raw.lecciones.map((l: any) => ({
        id: makeId(), // ID nuevo siempre para evitar colisiones
        blocks: Array.isArray(l.blocks) ? l.blocks : [],
      }));
      u.lecciones = [...u.lecciones, ...newLessons];
    }

    return copy;
  });
};
  const handleImportFinalExam = (data: any) => {
  const raw = data.examenFinal ?? data;

  setExamenFinal(prev => ({
    // introTexto: solo pisa si viene string no vacío
    introTexto: raw.introTexto && typeof raw.introTexto === "string"
      ? raw.introTexto
      : prev.introTexto,

    // ejercicios: APPEND al array existente
    ejercicios: Array.isArray(raw.ejercicios) && raw.ejercicios.length > 0
      ? [...prev.ejercicios, ...raw.ejercicios]
      : prev.ejercicios,
  }));
};
  const handleImportCapstone = (data: any) => {
  const raw = data.capstone ?? data;

  setCapstone(prev => ({
    // videoUrl: solo pisa si viene string no vacío
    videoUrl: raw.videoUrl && typeof raw.videoUrl === "string"
      ? raw.videoUrl
      : prev.videoUrl,

    // instrucciones: solo pisa si viene string no vacío
    instrucciones: raw.instrucciones && typeof raw.instrucciones === "string"
      ? raw.instrucciones
      : prev.instrucciones,

    // checklist: APPEND al existente
    checklist: Array.isArray(raw.checklist) && raw.checklist.length > 0
      ? [...prev.checklist, ...raw.checklist]
      : prev.checklist,
  }));
};
  const handleImportClosing = (data: any) => {
  const raw = data.closing ?? data;

  // Solo toca textoFinalCurso y textoFinalCursoVideoUrl del estado `curso`
  // Nunca toca titulo, descripcion, nivel, idioma, cursantes, etc.
  setCurso(prev => {
    if (!prev) return prev;
    return {
      ...prev,
      textoFinalCurso:
        raw.textoFinalCurso && typeof raw.textoFinalCurso === "string"
          ? raw.textoFinalCurso
          : prev.textoFinalCurso,
      textoFinalCursoVideoUrl:
        raw.textoFinalCursoVideoUrl && typeof raw.textoFinalCursoVideoUrl === "string"
          ? raw.textoFinalCursoVideoUrl
          : prev.textoFinalCursoVideoUrl,
      // Todo lo demás del objeto `curso` se preserva intacto con ...prev
    };
  });
};

  // ── Label helpers ──────────────────────────────────────────────────────────
  const getLabel = (item: ContentItem, idx: number) => {
    if (item.type === "unit") { const u = unidades.find(u => u.id === item.refId); return u?.titulo ? `Unidad: ${u.titulo}` : `Unidad ${idx + 1}`; }
    if (item.type === "final_exam") return "Examen Final";
    if (item.type === "project") return "Proyecto Final";
    if (item.type === "closing") return "Cierre";
    return item.type;
  };

  const unitCount = contentTimeline.filter(i => i.type === "unit").length;
  const hasFinalExam = contentTimeline.some(i => i.type === "final_exam");
  const hasProject = contentTimeline.some(i => i.type === "project");
  const hasClosing = contentTimeline.some(i => i.type === "closing");

  // ── Render content panels ──────────────────────────────────────────────────
  const renderContent = () => {
    if (!selectedId) return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm">
        <Icon.Layers />
        <p className="mt-3">Seleccioná un elemento del timeline para editar</p>
      </div>
    );
    const item = contentTimeline.find(i => i.id === selectedId);
    if (!item) return null;

    if (item.type === "unit") {
      const idx = unidades.findIndex(u => u.id === item.refId);
      if (idx === -1) return <p className="text-sm text-red-400">Unidad no encontrada</p>;
      const u = unidades[idx];
      return (
        <div className="space-y-5">
          <SectionCard className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Icon.Layers /> Información de la unidad</h3>
            <JsonSectionImport
              hint={`"titulo": "...", "descripcion": "...", "introVideo": "...", "lecciones": [...]`}
              validate={d => typeof (d.unidad ?? d) === "object"}
              onLoad={handleImportUnit(idx)}
            />
            <div><Label>Título</Label><Input value={u.titulo} onChange={v => updateUnidad(idx, { titulo: v })} placeholder="Título de la unidad" /></div>
            <div><Label>Descripción</Label><Textarea value={u.descripcion} onChange={v => updateUnidad(idx, { descripcion: v })} placeholder="¿Qué aprenderá el alumno?" /></div>
            <div>
              <Label>Video intro (Vimeo, opcional)</Label>
              <Input value={u.introVideo || ""} onChange={v => updateUnidad(idx, { introVideo: v })} placeholder="https://vimeo.com/..." type="url" />
              {u.introVideo && isValidUrl(u.introVideo) && u.introVideo.includes("vimeo") && (
                <div className="aspect-video rounded-xl overflow-hidden border bg-gray-100 mt-2">
                  <iframe src={u.introVideo.replace("vimeo.com", "player.vimeo.com/video")} className="w-full h-full" allowFullScreen />
                </div>
              )}
            </div>
          </SectionCard>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">Secciones</h3>
              <button type="button" onClick={() => agregarLeccion(idx)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition"
              >
                <Icon.Plus /> Agregar sección
              </button>
            </div>
            {u.lecciones.length === 0 && <p className="text-sm text-slate-400 text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">Sin secciones. Agregá una para comenzar.</p>}
            {u.lecciones.map((l, lIdx) => (
              <LessonItem key={l.id} unidadIdx={idx} leccion={l} leccionIdx={lIdx}
                updateBlock={updateBlock} deleteBlock={deleteBlock} addBlock={addBlock} borrarLeccion={borrarLeccion}
              />
            ))}
          </div>
        </div>
      );
    }

    if (item.type === "final_exam") return (
      <SectionCard className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Icon.Clipboard /> Examen Final</h3>
        <JsonSectionImport hint={`"introTexto": "...", "ejercicios": [...]`} validate={d => typeof (d.examenFinal ?? d) === "object"} onLoad={handleImportFinalExam} />
        <div><Label>Instrucciones del examen</Label><Textarea value={examenFinal.introTexto} onChange={v => setExamenFinal(p => ({ ...p, introTexto: v }))} rows={3} /></div>
        <Exercises initial={examenFinal.ejercicios} onChange={ex => setExamenFinal(p => ({ ...p, ejercicios: ex }))} />
      </SectionCard>
    );

    if (item.type === "project") return (
      <SectionCard className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Icon.Layers /> Proyecto Final (Capstone)</h3>
        <JsonSectionImport hint={`"videoUrl": "...", "instrucciones": "...", "checklist": ["item1"]`} validate={d => typeof (d.capstone ?? d) === "object"} onLoad={handleImportCapstone} />
        <div>
          <Label>Video URL</Label>
          <Input value={capstone.videoUrl} onChange={v => setCapstone(p => ({ ...p, videoUrl: v }))} placeholder="https://vimeo.com/..." type="url" />
          {capstone.videoUrl && isValidUrl(capstone.videoUrl) && <div className="aspect-video mt-2 rounded-xl border overflow-hidden"><iframe src={capstone.videoUrl} className="w-full h-full" allowFullScreen /></div>}
        </div>
        <div><Label>Instrucciones</Label><Textarea value={capstone.instrucciones} onChange={v => setCapstone(p => ({ ...p, instrucciones: v }))} rows={4} /></div>
        <div>
          <Label>Checklist de entrega</Label>
          <div className="space-y-2">
            {capstone.checklist.map((ci, i) => (
              <div key={i} className="flex gap-2">
                <Input value={ci} onChange={v => { const c = [...capstone.checklist]; c[i] = v; setCapstone(p => ({ ...p, checklist: c })); }} placeholder={`Ítem ${i + 1}`} />
                <button type="button" onClick={() => setCapstone(p => ({ ...p, checklist: p.checklist.filter((_, idx) => idx !== i) }))} className="text-slate-400 hover:text-red-500 transition"><Icon.Trash /></button>
              </div>
            ))}
            <button type="button" onClick={() => setCapstone(p => ({ ...p, checklist: [...p.checklist, ""] }))} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 transition"><Icon.Plus /> Agregar ítem</button>
          </div>
        </div>
      </SectionCard>
    );

    if (item.type === "closing") return (
      <SectionCard className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Icon.Flag /> Cierre del material</h3>
        <JsonSectionImport
          hint={`"textoFinalCurso": "...", "textoFinalCursoVideoUrl": "https://vimeo.com/..."`}
          validate={d => { const r = d.closing ?? d; return typeof r === "object" && (r.textoFinalCurso !== undefined || r.textoFinalCursoVideoUrl !== undefined); }}
          onLoad={handleImportClosing}
        />
        <div><Label>Mensaje final</Label><Textarea value={curso?.textoFinalCurso || ""} onChange={v => setCurso(p => p ? { ...p, textoFinalCurso: v } : p)} rows={4} /></div>
        <div><Label>Video de cierre (Vimeo, opcional)</Label><Input value={curso?.textoFinalCursoVideoUrl || ""} onChange={v => setCurso(p => p ? { ...p, textoFinalCursoVideoUrl: v } : p)} placeholder="https://vimeo.com/..." type="url" /></div>
      </SectionCard>
    );

    return null;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !curso) return toast.error("Sistema no listo");
    setUploading(true);
    try {
      const unidadesToSave = unidades.map(u => ({ id: u.id, titulo: u.titulo || "", descripcion: u.descripcion || "", introVideo: u.introVideo || "", urlImagen: u.urlImagen || "", textoCierre: u.textoCierre || "", lecciones: u.lecciones.map(l => ({ id: l.id, blocks: l.blocks || [] })), closing: u.closing || {} }));
      const cursantes = curso.cursantes?.map(e => e.toLowerCase().trim()).filter(Boolean) || [];
      await updateDoc(doc(firestore, "cursos", courseId), { ...curso, unidades: unidadesToSave, examenFinal, capstone, contentTimeline, cursantes, updatedAt: serverTimestamp() });
      for (const email of cursantes) {
        let found = false;
        for (let i = 1; i <= 10 && !found; i++) {
          const bRef = doc(firestore, "alumnos", `batch_${i}`);
          const snap = await getDoc(bRef);
          if (!snap.exists()) continue;
          const d = snap.data();
          const key = Object.keys(d).find(k => k.startsWith("user_") && d[k]?.email === email);
          if (key) { await updateDoc(bRef, { [`${key}.cursosAdquiridos`]: arrayUnion(courseId) }); found = true; }
        }
      }
      await reloadData?.();
      setUploading(false);
      setShowSuccessModal(true);
    } catch (err) { console.error(err); setUploading(false); toast.error("Error al guardar"); }
  };

  // ── Students ───────────────────────────────────────────────────────────────
  const filteredAlumnos = useMemo(() => {
    const list = Array.isArray(alumnos) ? alumnos : [];
    const matches = list.filter(a => {
      const lang = a.learningLanguage || a.idioma || ""; const lvl = a.learningLevel || a.nivel || "";
      const nombre = (a.displayName || a.nombre || "").toLowerCase();
      let tieneCurso = true;
      if (filterCursoId) { const raw = alumnosRaw?.find((r: any) => r.email?.toLowerCase() === a.email?.toLowerCase()); tieneCurso = raw && Array.isArray(raw.cursosAsignados) ? raw.cursosAsignados.some((c: any) => (c.curso || "").toLowerCase().includes(filterCursoId.toLowerCase())) : false; }
      return (!filterIdioma || lang.toLowerCase() === filterIdioma.toLowerCase()) && (!filterNivel || lvl.toLowerCase() === filterNivel.toLowerCase()) && (!filterNombre || nombre.includes(filterNombre.toLowerCase())) && tieneCurso;
    });
    const seen = new Set<string>(); const out: any[] = [];
    matches.forEach(a => { const e = a.email?.toLowerCase().trim(); if (e && !seen.has(e)) { seen.add(e); out.push(a); } });
    return out;
  }, [alumnos, alumnosRaw, filterIdioma, filterNivel, filterNombre, filterCursoId]);

  const toggleCursante = (email: string) => setCurso(p => { if (!p) return p; const s = new Set(p.cursantes || []); s.has(email) ? s.delete(email) : s.add(email); return { ...p, cursantes: Array.from(s) }; });
  const addEmailManual = () => { const email = emailInput.trim().toLowerCase(); if (!email) return; if (curso?.cursantes.includes(email)) { toast.error("Ya está en la lista"); return; } setCurso(p => p ? { ...p, cursantes: [...(p.cursantes || []), email] } : p); setEmailInput(""); };

  // ── ESC ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (showSuccessModal) { onClose?.(); return; }
      if (showExitModal) { setShowExitModal(false); return; }
      setShowExitModal(true);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = "auto"; };
  }, [onClose, showSuccessModal, showExitModal]);

  if (loading || !curso) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-10 text-center shadow-2xl">
        <div className="w-14 h-14 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500 font-medium">Cargando material...</p>
      </div>
    </div>
  );

  const niveles = ["A1","A2","B1","B2","B2.5","C1","C2"];
  const idiomas = [{ v: "es", l: "Español" }, { v: "en", l: "Inglés" }, { v: "pt", l: "Portugués" }, { v: "fr", l: "Francés" }, { v: "it", l: "Italiano" }];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40  p-4">
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-slate-50 rounded-3xl shadow-2xl overflow-hidden border border-slate-200">

        {/* Header — igual a CrearMaterial */}
        <div className="flex items-center justify-between px-7 py-5 bg-white border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Editar Material Académico</h2>
            <p className="text-xs text-slate-400 mt-0.5">{curso.titulo || "Sin título"} · {curso.nivel} · {curso.idioma?.toUpperCase()}</p>
          </div>
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
            <TabButton active={tab === "general"} onClick={() => setTab("general")}>General</TabButton>
            <TabButton active={tab === "content"} onClick={() => setTab("content")}>Contenido</TabButton>
            <TabButton active={tab === "students"} onClick={() => setTab("students")}>Alumnos</TabButton>
          </div>
          <button type="button" onClick={() => setShowExitModal(true)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"><Icon.X /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <form id="edit-form" onSubmit={handleSubmit}>

            {/* ─ GENERAL ─ */}
            {tab === "general" && (
              <div className="p-7 space-y-5 max-w-2xl">
                <SectionCard className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2"><Label>Título del material *</Label><Input value={curso.titulo} onChange={v => setCurso(p => p ? { ...p, titulo: v } : p)} placeholder="Ej: Inglés para Negocios B2" required /></div>
                    <div className="col-span-2"><Label>Descripción</Label><Textarea value={curso.descripcion} onChange={v => setCurso(p => p ? { ...p, descripcion: v } : p)} rows={3} placeholder="¿Qué aprenderá el alumno?" /></div>
                    <div><Label>Idioma</Label><Select value={curso.idioma} onChange={v => setCurso(p => p ? { ...p, idioma: v } : p)}>{idiomas.map(i => <option key={i.v} value={i.v}>{i.l}</option>)}</Select></div>
                    <div><Label>Nivel</Label><Select value={curso.nivel} onChange={v => setCurso(p => p ? { ...p, nivel: v } : p)}>{niveles.map(n => <option key={n} value={n}>{n}</option>)}</Select></div>
                    <div><Label>Video de presentación (Vimeo)</Label><Input value={curso.videoPresentacion} onChange={v => setCurso(p => p ? { ...p, videoPresentacion: v } : p)} placeholder="https://vimeo.com/..." type="url" /></div>
                    <div><Label>Imagen de portada (URL)</Label><Input value={curso.urlImagen} onChange={v => setCurso(p => p ? { ...p, urlImagen: v } : p)} placeholder="https://..." type="url" /></div>
                    <div className="col-span-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div onClick={() => setCurso(p => p ? { ...p, publico: !p.publico } : p)} className={`relative w-10 h-5 rounded-full transition-colors ${curso.publico ? "bg-slate-900" : "bg-slate-300"}`}>
                          <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${curso.publico ? "translate-x-5" : ""}`} />
                        </div>
                        <span className="text-sm text-slate-700 font-medium">Material público</span>
                      </label>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ─ CONTENT ─ */}
            {tab === "content" && (
              <div className="p-7 space-y-5">
                {/* Banner retomar */}
                {resumeItem && resumeItem.id !== selectedId && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white text-blue-600 rounded-lg border border-blue-100"><Icon.Clock /></div>
                      <div>
                        <p className="text-sm text-blue-900 font-bold">¿Continuar donde lo dejaste?</p>
                        <p className="text-xs text-blue-700">Edición reciente en: <span className="font-semibold underline">{resumeItem.name}</span></p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setResumeItem(null)} className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 rounded-lg transition">Descartar</button>
                      <button type="button" onClick={() => { setSelectedId(resumeItem.id); setResumeItem(null); }} className="flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">Ir allí <Icon.ArrowRight /></button>
                    </div>
                  </div>
                )}

                {/* Timeline + editor */}
                <div className="grid grid-cols-3 gap-5 min-h-[400px]">
                  <div className="col-span-1">
                    <SectionCard className="space-y-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Timeline</p>
                      <div className="flex flex-col gap-1.5">
                        <button type="button" onClick={agregarUnidad} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-lg hover:border-slate-500 hover:text-slate-900 transition"><Icon.Plus /> Agregar unidad</button>
                        <button type="button" onClick={() => addSingleton("final_exam")} disabled={hasFinalExam} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 border border-dashed border-amber-200 rounded-lg hover:border-amber-400 transition disabled:opacity-40 disabled:cursor-not-allowed"><Icon.Plus /> Examen Final {hasFinalExam && "✓"}</button>
                        <button type="button" onClick={() => addSingleton("project")} disabled={hasProject} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 border border-dashed border-blue-200 rounded-lg hover:border-blue-400 transition disabled:opacity-40 disabled:cursor-not-allowed"><Icon.Plus /> Proyecto Final {hasProject && "✓"}</button>
                        <button type="button" onClick={() => addSingleton("closing")} disabled={hasClosing} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 border border-dashed border-emerald-200 rounded-lg hover:border-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed"><Icon.Plus /> Cierre {hasClosing && "✓"}</button>
                      </div>
                      {contentTimeline.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Sin elementos</p>}
                      <div className="space-y-1.5">
                        {contentTimeline.map((item, idx) => (
                          <TimelineItemBadge key={item.id} item={item} isSelected={selectedId === item.id} label={getLabel(item, idx)} onSelect={() => setSelectedId(item.id)} onDelete={() => deleteItem(item.id)} />
                        ))}
                      </div>
                      {contentTimeline.length > 0 && <p className="text-xs text-slate-400 pt-1 border-t border-slate-100">{unitCount} unidad{unitCount !== 1 ? "es" : ""} · {contentTimeline.length} elemento{contentTimeline.length !== 1 ? "s" : ""}</p>}
                    </SectionCard>
                  </div>
                  <div className="col-span-2 overflow-y-auto">{renderContent()}</div>
                </div>
              </div>
            )}

            {/* ─ STUDENTS ─ */}
            {tab === "students" && (
              <div className="p-7 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <SectionCard className="space-y-4">
                    <h3 className="text-sm font-semibold text-slate-900">Buscar y agregar alumnos</h3>
                    <div className="flex gap-2">
                      <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addEmailManual())} placeholder="alumno@email.com"
                        className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
                      />
                      <button type="button" onClick={addEmailManual} className="px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-700 transition flex items-center gap-1.5"><Icon.Plus /> Agregar</button>
                    </div>
                    <div className="space-y-2">
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon.Search /></span><input type="text" value={filterNombre} onChange={e => { setFilterNombre(e.target.value); setAlumnosPage(0); }} placeholder="Buscar por nombre..." className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition" /></div>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon.Tag /></span><input type="text" value={filterCursoId} onChange={e => { setFilterCursoId(e.target.value); setAlumnosPage(0); }} placeholder="Filtrar por ID de curso..." className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 transition" /></div>
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={filterIdioma} onChange={v => { setFilterIdioma(v); setAlumnosPage(0); }}><option value="">Todos los idiomas</option>{idiomas.map(i => <option key={i.v} value={i.v}>{i.l}</option>)}</Select>
                        <Select value={filterNivel} onChange={v => { setFilterNivel(v); setAlumnosPage(0); }}><option value="">Todos los niveles</option>{niveles.map(n => <option key={n} value={n}>{n}</option>)}</Select>
                      </div>
                      {(filterNombre || filterCursoId || filterIdioma || filterNivel) && (
                        <button type="button" onClick={() => { setFilterNombre(""); setFilterCursoId(""); setFilterIdioma(""); setFilterNivel("");setAlumnosPage(0); }} className="w-full flex items-center justify-center gap-2 py-2 text-xs text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-50 transition"><Icon.X /> Limpiar filtros</button>
                      )}
                    </div>
                    <div className="space-y-1">
  <div className="flex items-center justify-between pb-1">
    <p className="text-xs text-slate-400">
      {filteredAlumnos.length} alumno{filteredAlumnos.length !== 1 ? "s" : ""}
      {filteredAlumnos.length > PAGE_SIZE && (
        <span className="ml-1 text-slate-300">
          · mostrando {alumnosPage * PAGE_SIZE + 1}–{Math.min((alumnosPage + 1) * PAGE_SIZE, filteredAlumnos.length)}
        </span>
      )}
    </p>
  </div>

  <div className="max-h-52 overflow-y-auto space-y-1">
    {filteredAlumnos
      .slice(alumnosPage * PAGE_SIZE, (alumnosPage + 1) * PAGE_SIZE)
      .map(a => (
        <div key={a.email} onClick={() => toggleCursante(a.email)} className="flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition">
          <span className="text-sm text-slate-700">{a.displayName || a.nombre || a.email}</span>
          <input type="checkbox" readOnly checked={curso.cursantes?.includes(a.email) || false} className="accent-slate-900" />
        </div>
      ))
    }
  </div>

  {filteredAlumnos.length > PAGE_SIZE && (
    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
      <button
        type="button"
        onClick={() => setAlumnosPage(p => Math.max(0, p - 1))}
        disabled={alumnosPage === 0}
        className="px-3 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        ← Anterior
      </button>
      <span className="text-xs text-slate-400">
        Página {alumnosPage + 1} de {Math.ceil(filteredAlumnos.length / PAGE_SIZE)}
      </span>
      <button
        type="button"
        onClick={() => setAlumnosPage(p => Math.min(Math.ceil(filteredAlumnos.length / PAGE_SIZE) - 1, p + 1))}
        disabled={alumnosPage >= Math.ceil(filteredAlumnos.length / PAGE_SIZE) - 1}
        className="px-3 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        Siguiente →
      </button>
    </div>
  )}
</div>
                    <button type="button" onClick={() => { const emails = filteredAlumnos.map(a => a.email); setCurso(p => { if (!p) return p; const s = new Set([...(p.cursantes || []), ...emails]); return { ...p, cursantes: Array.from(s) }; }); }} className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-300 text-slate-600 text-sm rounded-xl hover:bg-slate-50 transition"><Icon.Plus /> Agregar todos los filtrados</button>
                  </SectionCard>

                  <SectionCard className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><Icon.Check /> Alumnos asignados ({curso.cursantes?.length || 0})</h3>
                    </div>
                    {!curso.cursantes?.length
                      ? <p className="text-sm text-slate-400 text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">Sin alumnos asignados</p>
                      : <div className="max-h-64 overflow-y-auto space-y-1.5">{curso.cursantes.map(email => (
                          <div key={email} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-700">
                            <span>{email}</span>
                            <button type="button" onClick={() => toggleCursante(email)} className="text-slate-400 hover:text-red-500 transition"><Icon.Trash /></button>
                          </div>
                        ))}</div>
                    }
                    {!!curso.cursantes?.length && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-xs text-slate-400">{curso.cursantes.length} alumno{curso.cursantes.length !== 1 ? "s" : ""}</span>
                        <button type="button" onClick={() => setCurso(p => p ? { ...p, cursantes: [] } : p)} className="text-xs text-red-500 hover:text-red-700 transition">Eliminar todos</button>
                      </div>
                    )}
                  </SectionCard>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-7 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">{unitCount} unidad{unitCount !== 1 ? "es" : ""} · {curso.cursantes?.length || 0} alumno{curso.cursantes?.length !== 1 ? "s" : ""}</span>
          <button type="submit" form="edit-form" disabled={uploading} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition shadow-sm">
            <Icon.Save /> {uploading ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>

      {/* Modal éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 text-emerald-500"><Icon.CheckCircle /></div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">¡Cambios guardados!</h3>
            <p className="text-sm text-slate-500 mb-6">El material ha sido actualizado correctamente.</p>
            <button type="button" onClick={() => { setShowSuccessModal(false); onClose?.(); }} className="w-full py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition">Cerrar</button>
          </div>
        </div>
      )}

      {/* Modal salida */}
      {showExitModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">¿Salir sin guardar?</h3>
            <p className="text-sm text-slate-500">Se perderán los cambios no guardados.</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowExitModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition">Cancelar</button>
              <button type="button" onClick={() => { setShowExitModal(false); onClose?.(); }} className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition">Salir y descartar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Normalización ────────────────────────────────────────────────────────────
const normalizeCourseData = (legacyData: any): Curso => {
  const normalizedUnits: Unidad[] = (legacyData.unidades || []).map((u: any) => {
    const unitId = u.id || makeId();
    const lessons: Leccion[] = (u.lecciones || []).map((l: any) => {
      if (l.blocks?.length) return l;
      const blocks: LessonBlock[] = [];
      if (l.titulo) blocks.push({ type: "title", value: l.titulo });
      if (l.descripcion) blocks.push({ type: "description", value: l.descripcion });
      if (l.urlVideo?.trim()) blocks.push({ type: "video", url: l.urlVideo });
      if (l.teoria) blocks.push({ type: "theory", value: l.teoria });
      if (l.pdfUrl?.trim()) blocks.push({ type: "pdf", url: l.pdfUrl });
      if (l.vocabulary?.entries) blocks.push({ type: "vocabulary", entries: l.vocabulary.entries });
      if (Array.isArray(l.ejercicios)) l.ejercicios.forEach((ex: any) => blocks.push({ type: "exercise", exercise: ex }));
      return { id: l.id || makeId(), blocks };
    });
    return { id: unitId, titulo: u.titulo || "", descripcion: u.descripcion || "", introVideo: u.introVideo || "", urlImagen: u.urlImagen || "", ejercicios: [], textoCierre: u.textoCierre || "", lecciones: lessons, closing: u.closing || {} };
  });

  const tl: ContentItem[] = legacyData.contentTimeline || [];
  if (!tl.length) {
    normalizedUnits.forEach(u => tl.push({ id: `unit-${u.id}`, type: "unit", refId: u.id }));
    if (legacyData.examenFinal?.introTexto || legacyData.examenFinal?.ejercicios?.length) { const id = makeId(); tl.push({ id, type: "final_exam", refId: id }); }
    if (legacyData.capstone?.videoUrl || legacyData.capstone?.instrucciones) { const id = makeId(); tl.push({ id, type: "project", refId: id }); }
    if (legacyData.textoFinalCurso || legacyData.textoFinalCursoVideoUrl) { const id = makeId(); tl.push({ id, type: "closing", refId: id }); }
  }

  return {
    titulo: legacyData.titulo || "", descripcion: legacyData.descripcion || "", nivel: legacyData.nivel || "", idioma: legacyData.idioma || "",
    publico: legacyData.publico || false, videoPresentacion: legacyData.videoPresentacion || "", urlImagen: legacyData.urlImagen || "",
    cursantes: legacyData.cursantes || [], textoFinalCurso: legacyData.textoFinalCurso || "", textoFinalCursoVideoUrl: legacyData.textoFinalCursoVideoUrl || "",
    unidades: normalizedUnits, examenFinal: legacyData.examenFinal || { introTexto: "", ejercicios: [] },
    capstone: legacyData.capstone || { videoUrl: "", instrucciones: "", checklist: [] },
    contentTimeline: tl, createdAt: legacyData.createdAt || null, updatedAt: legacyData.updatedAt || null,
  };
};