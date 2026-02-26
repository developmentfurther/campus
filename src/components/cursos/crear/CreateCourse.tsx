"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import Exercises, { Exercise } from "@/components/cursos/cursoItem/exercises/Exercises";
import LessonItem from "@/components/cursos/cursoItem/LessonItem";

// ─── Icons (inline SVG to avoid extra deps) ───────────────────────────────────
const Icon = {
  X: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
  ),
  Trash: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
  ),
  Save: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
  ),
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
  ),
  Upload: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
  ),
  ChevronRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  ),
  Layers: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
  ),
  Clipboard: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
  ),
  Flag: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
  ),
};

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockType = "title" | "description" | "theory" | "video" | "pdf" | "vocabulary" | "exercise";
type ContentItemType = "unit" | "final_exam" | "project" | "closing";

interface Block {
  type: BlockType;
  [key: string]: any;
}

interface Lesson {
  id: string;
  blocks: Block[];
}

interface Unit {
  id: string;
  titulo: string;
  descripcion: string;
  introVideo: string;
  lecciones: Lesson[];
  ejercicios: Exercise[];
  textoCierre: string;
  closing: Record<string, any>;
}

interface ContentItem {
  id: string;
  type: ContentItemType;
  refId?: string;
}

interface MaterialState {
  titulo: string;
  descripcion: string;
  nivel: string;
  idioma: string;
  publico: boolean;
  videoPresentacion: string;
  urlImagen: string;
  cursantes: string[];
  textoFinalCurso: string;
  textoFinalCursoVideoUrl: string;
  contentTimeline: ContentItem[];
}

interface FinalExam {
  introTexto: string;
  ejercicios: Exercise[];
}

interface Capstone {
  videoUrl: string;
  instrucciones: string;
  checklist: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const defaultBlock = (type: BlockType): Block => {
  if (type === "vocabulary") return { type, entries: [] };
  if (type === "exercise") return { type, exercises: null };
  if (type === "video" || type === "pdf") return { type, url: "" };
  return { type, value: "" };
};

const defaultUnit = (): Unit => ({
  id: makeId(),
  titulo: "",
  descripcion: "",
  introVideo: "",
  lecciones: [],
  ejercicios: [],
  textoCierre: "",
  closing: {},
});

const defaultMaterial = (): MaterialState => ({
  titulo: "",
  descripcion: "",
  nivel: "",
  idioma: "",
  publico: true,
  videoPresentacion: "",
  urlImagen: "",
  cursantes: [],
  textoFinalCurso: "",
  textoFinalCursoVideoUrl: "",
  contentTimeline: [],
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-6 ${className}`}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700 mb-1.5">{children}</label>;
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition resize-none"
    />
  );
}

function Select({
  value,
  onChange,
  children,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition bg-white"
    >
      {children}
    </select>
  );
}

// ─── Timeline item badge ──────────────────────────────────────────────────────

function TimelineItemBadge({
  item,
  isSelected,
  label,
  onSelect,
  onDelete,
}: {
  item: ContentItem;
  isSelected: boolean;
  label: string;
  onSelect: () => void;
  onDelete: () => void;
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
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="ml-1 opacity-50 hover:opacity-100 transition"
      >
        <Icon.X />
      </button>
    </div>
  );
}

// ─── JSON Import panel ────────────────────────────────────────────────────────

function JsonImportPanel({
  onLoad,
  onExport,
}: {
  onLoad: (text: string) => void;
  onExport: () => void;
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-dashed border-slate-300 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-slate-50 hover:bg-slate-100 transition text-sm font-medium text-slate-600"
      >
        <span className="flex items-center gap-2">
          <Icon.Upload />
          Autocompletar desde JSON
        </span>
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>
          <Icon.ChevronRight />
        </span>
      </button>

      {open && (
        <div className="p-5 space-y-3 bg-white">
          <p className="text-xs text-slate-500">
            Pega el JSON del material para autocompletar todos los campos. Debe tener la estructura{" "}
            <code className="bg-slate-100 px-1 rounded">{"{ material, unidades, examenFinal, capstone }"}</code>
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            spellCheck={false}
            placeholder={'{\n  "material": { "titulo": "...", ... },\n  "unidades": [...]\n}'}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 transition resize-none"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { onLoad(text); setText(""); setOpen(false); }}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition"
            >
              Cargar datos
            </button>
            <button
              type="button"
              onClick={onExport}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition flex items-center gap-2"
            >
              <Icon.Download />
              Exportar actual
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Unit editor ──────────────────────────────────────────────────────────────

function UnitEditor({
  unit,
  onChange,
  onAddLesson,
  onDeleteLesson,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
}: {
  unit: Unit;
  onChange: (patch: Partial<Unit>) => void;
  onAddLesson: () => void;
  onDeleteLesson: (lIdx: number) => void;
  onAddBlock: (lIdx: number, type: BlockType) => void;
  onUpdateBlock: (lIdx: number, bIdx: number, val: Block) => void;
  onDeleteBlock: (lIdx: number, bIdx: number) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Unit metadata */}
      <SectionCard>
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Información de la unidad</h3>
        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input value={unit.titulo} onChange={(v) => onChange({ titulo: v })} placeholder="Ej: Unidad 1 – Presentaciones" />
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={unit.descripcion} onChange={(v) => onChange({ descripcion: v })} placeholder="¿Qué aprenderá el alumno en esta unidad?" />
          </div>
          <div>
            <Label>Video intro (Vimeo, opcional)</Label>
            <Input
              value={unit.introVideo}
              onChange={(v) => onChange({ introVideo: v })}
              placeholder="https://vimeo.com/..."
              type="url"
            />
          </div>
        </div>
      </SectionCard>

      {/* Lessons */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Secciones</h3>
          <button
            type="button"
            onClick={onAddLesson}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition"
          >
            <Icon.Plus /> Agregar sección
          </button>
        </div>

        {unit.lecciones.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">
            Sin secciones. Agrega una para comenzar.
          </p>
        )}

        {unit.lecciones.map((lesson, lIdx) => (
          <LessonItem
            key={lesson.id}
            unidadIdx={0} // dummy – we use callbacks
            leccion={lesson}
            leccionIdx={lIdx}
            updateBlock={(_u, lI, bI, val) => onUpdateBlock(lI, bI, val)}
            deleteBlock={(_u, lI, bI) => onDeleteBlock(lI, bI)}
            addBlock={(_u, lI, type) => onAddBlock(lI, type)}
            borrarLeccion={(_u, lI) => onDeleteLesson(lI)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Final Exam editor ────────────────────────────────────────────────────────

function FinalExamEditor({
  value,
  onChange,
}: {
  value: FinalExam;
  onChange: (v: FinalExam) => void;
}) {
  return (
    <SectionCard className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
        <Icon.Clipboard /> Examen Final
      </h3>
      <div>
        <Label>Introducción / instrucciones</Label>
        <Textarea
          value={value.introTexto}
          onChange={(v) => onChange({ ...value, introTexto: v })}
          placeholder="Describe las instrucciones del examen..."
          rows={3}
        />
      </div>
      <Exercises initial={value.ejercicios} onChange={(ex) => onChange({ ...value, ejercicios: ex })} />
    </SectionCard>
  );
}

// ─── Capstone editor ──────────────────────────────────────────────────────────

function CapstoneEditor({
  value,
  onChange,
}: {
  value: Capstone;
  onChange: (v: Capstone) => void;
}) {
  const addItem = () => onChange({ ...value, checklist: [...value.checklist, ""] });
  const updateItem = (i: number, v: string) => {
    const copy = [...value.checklist];
    copy[i] = v;
    onChange({ ...value, checklist: copy });
  };
  const removeItem = (i: number) =>
    onChange({ ...value, checklist: value.checklist.filter((_, idx) => idx !== i) });

  return (
    <SectionCard className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
        <Icon.Layers /> Proyecto Final (Capstone)
      </h3>
      <div>
        <Label>Video URL</Label>
        <Input value={value.videoUrl} onChange={(v) => onChange({ ...value, videoUrl: v })} placeholder="https://vimeo.com/..." type="url" />
      </div>
      <div>
        <Label>Instrucciones</Label>
        <Textarea value={value.instrucciones} onChange={(v) => onChange({ ...value, instrucciones: v })} rows={4} placeholder="Describe el proyecto..." />
      </div>
      <div>
        <Label>Checklist de entrega</Label>
        <div className="space-y-2">
          {value.checklist.map((item, i) => (
            <div key={i} className="flex gap-2">
              <Input value={item} onChange={(v) => updateItem(i, v)} placeholder={`Ítem ${i + 1}`} />
              <button type="button" onClick={() => removeItem(i)} className="text-slate-400 hover:text-red-500 transition">
                <Icon.Trash />
              </button>
            </div>
          ))}
          <button type="button" onClick={addItem} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 transition">
            <Icon.Plus /> Agregar ítem
          </button>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Closing editor ───────────────────────────────────────────────────────────

function ClosingEditor({
  textoFinalCurso,
  textoFinalCursoVideoUrl,
  onChange,
}: {
  textoFinalCurso: string;
  textoFinalCursoVideoUrl: string;
  onChange: (patch: { textoFinalCurso?: string; textoFinalCursoVideoUrl?: string }) => void;
}) {
  return (
    <SectionCard className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
        <Icon.Flag /> Cierre del material
      </h3>
      <div>
        <Label>Mensaje final</Label>
        <Textarea
          value={textoFinalCurso}
          onChange={(v) => onChange({ textoFinalCurso: v })}
          placeholder="Mensaje de cierre para el alumno..."
          rows={4}
        />
      </div>
      <div>
        <Label>Video de cierre (Vimeo, opcional)</Label>
        <Input
          value={textoFinalCursoVideoUrl}
          onChange={(v) => onChange({ textoFinalCursoVideoUrl: v })}
          placeholder="https://vimeo.com/..."
          type="url"
        />
      </div>
    </SectionCard>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CrearMaterial({ onClose }: { onClose?: () => void }) {
  const { firestore, reloadData, alumnos, alumnosRaw } = useAuth();
  const dbToUse = firestore || db;

  // Core state
  const [material, setMaterial] = useState<MaterialState>(defaultMaterial());
  const [units, setUnits] = useState<Unit[]>([]);
  const [finalExam, setFinalExam] = useState<FinalExam>({ introTexto: "", ejercicios: [] });
  const [capstone, setCapstone] = useState<Capstone>({ videoUrl: "", instrucciones: "", checklist: [] });

  // UI state
  const [tab, setTab] = useState<"general" | "content" | "students">("general");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  
  // Estados de filtro
const [filterNombre, setFilterNombre] = useState("");
const [filterCursoId, setFilterCursoId] = useState("");
const [filterIdioma, setFilterIdioma] = useState("");
const [filterNivel, setFilterNivel] = useState("");
const [alumnosPage, setAlumnosPage] = useState(0);
const PAGE_SIZE = 50;

  // ── Material helpers ─────────────────────────────────────────────────────────

  const setMat = (patch: Partial<MaterialState>) =>
    setMaterial((prev) => ({ ...prev, ...patch }));

  // ── Timeline ─────────────────────────────────────────────────────────────────

  const addUnit = () => {
    const unit = defaultUnit();
    const item: ContentItem = { id: `unit-${unit.id}`, type: "unit", refId: unit.id };
    setUnits((prev) => [...prev, unit]);
    setMat({ contentTimeline: [...material.contentTimeline, item] });
    setSelectedId(item.id);
  };

  const addSingleton = (type: ContentItemType) => {
    if (material.contentTimeline.some((i) => i.type === type)) {
      toast.error(`Ya existe un bloque de tipo "${type.replace("_", " ")}"`);
      return;
    }
    const id = makeId();
    const item: ContentItem = { id, type, refId: id };
    setMat({ contentTimeline: [...material.contentTimeline, item] });
    setSelectedId(id);
  };

  const deleteItem = (itemId: string) => {
    const item = material.contentTimeline.find((i) => i.id === itemId);
    if (!item) return;
    setMat({ contentTimeline: material.contentTimeline.filter((i) => i.id !== itemId) });
    if (item.type === "unit") setUnits((prev) => prev.filter((u) => u.id !== item.refId));
    if (selectedId === itemId) setSelectedId(null);
  };

  // ── Unit mutations ────────────────────────────────────────────────────────────

  const updateUnit = useCallback((unitId: string, patch: Partial<Unit>) => {
    setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, ...patch } : u)));
  }, []);

  const addLesson = (unitId: string) => {
    setUnits((prev) =>
      prev.map((u) =>
        u.id === unitId
          ? { ...u, lecciones: [...u.lecciones, { id: makeId(), blocks: [] }] }
          : u
      )
    );
  };

  const deleteLesson = (unitId: string, lIdx: number) => {
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id !== unitId) return u;
        const lecciones = [...u.lecciones];
        lecciones.splice(lIdx, 1);
        return { ...u, lecciones };
      })
    );
  };

  const addBlock = (unitId: string, lIdx: number, type: BlockType) => {
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id !== unitId) return u;
        const lecciones = structuredClone(u.lecciones);
        lecciones[lIdx].blocks.push(defaultBlock(type));
        return { ...u, lecciones };
      })
    );
  };

  const updateBlock = (unitId: string, lIdx: number, bIdx: number, val: Block) => {
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id !== unitId) return u;
        const lecciones = structuredClone(u.lecciones);
        lecciones[lIdx].blocks[bIdx] = val;
        return { ...u, lecciones };
      })
    );
  };

  const deleteBlock = (unitId: string, lIdx: number, bIdx: number) => {
    setUnits((prev) =>
      prev.map((u) => {
        if (u.id !== unitId) return u;
        const lecciones = structuredClone(u.lecciones);
        lecciones[lIdx].blocks.splice(bIdx, 1);
        return { ...u, lecciones };
      })
    );
  };

  // ── JSON import / export ──────────────────────────────────────────────────────

  const handleLoadJson = (text: string) => {
  if (!text.trim()) { toast.error("El campo está vacío"); return; }
  
  let data: any;
  
  // Paso 1: ¿parsea bien?
  try {
    data = JSON.parse(text);
    console.log("✅ JSON parseado:", data);
  } catch (e) {
    console.error("❌ Error de parseo:", e);
    toast.error("JSON inválido - error de sintaxis");
    return;
  }

  // Paso 2: ¿tiene la estructura mínima?
  console.log("🔍 data.material:", data.material);
  console.log("🔍 data.unidades:", data.unidades);
  console.log("🔍 data.examenFinal:", data.examenFinal);
  console.log("🔍 data.capstone:", data.capstone);

  if (!data.material) {
    toast.error("Falta el campo 'material'");
    return;
  }
  if (!Array.isArray(data.unidades)) {
    toast.error("'unidades' debe ser un array");
    return;
  }

  // Paso 3: setters uno por uno
  try {
    console.log("⏳ Seteando material...");
    setMaterial({
      titulo: data.material.titulo || "",
      descripcion: data.material.descripcion || "",
      nivel: data.material.nivel || "",
      idioma: data.material.idioma || "",
      publico: data.material.publico ?? true,
      videoPresentacion: data.material.videoPresentacion || "",
      urlImagen: data.material.urlImagen || "",
      cursantes: Array.isArray(data.material.cursantes) ? data.material.cursantes : [],
      textoFinalCurso: data.material.textoFinalCurso || "",
      textoFinalCursoVideoUrl: data.material.textoFinalCursoVideoUrl || "",
      contentTimeline: Array.isArray(data.material.contentTimeline) ? data.material.contentTimeline : [],
    });
    console.log("✅ material seteado");

    console.log("⏳ Seteando units...");
    setUnits(data.unidades);
    console.log("✅ units seteadas:", data.unidades.length);

    if (data.examenFinal) {
      console.log("⏳ Seteando examenFinal...");
      setFinalExam(data.examenFinal);
      console.log("✅ examenFinal seteado");
    }

    if (data.capstone) {
      console.log("⏳ Seteando capstone...");
      setCapstone(data.capstone);
      console.log("✅ capstone seteado");
    }

    toast.success("✅ Datos cargados correctamente");

    if (data.material.contentTimeline?.length > 0) {
      const firstId = data.material.contentTimeline[0].id;
      console.log("🎯 Seteando selectedId:", firstId);
      setSelectedId(firstId);
    }

  } catch (e) {
    console.error("❌ Error durante los setters:", e);
    toast.error(`Error interno: ${(e as Error).message}`);
  }
};

  const handleExportJson = () => {
    const data = { material, unidades: units, examenFinal: finalExam, capstone };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `material_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbToUse) return toast.error("DB no inicializada");
    if (!material.titulo.trim()) return toast.error("El título es obligatorio");

    try {
      setSaving(true);
      const payload = {
        ...material,
        unidades: units.map((u) => ({
          id: u.id,
          titulo: u.titulo || "",
          descripcion: u.descripcion || "",
          introVideo: u.introVideo || "",
          lecciones: u.lecciones,
          textoCierre: u.textoCierre || "",
          closing: u.closing || {},
        })),
        examenFinal: finalExam,
        capstone,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
        cursantes: material.cursantes.map((c) => c.toLowerCase().trim()),
      };

      const docRef = await addDoc(collection(dbToUse, "cursos"), payload);

      // Assign to students
      if (payload.cursantes.length > 0) {
        for (const email of payload.cursantes) {
          let found = false;
          for (let i = 1; i <= 10 && !found; i++) {
            const batchRef = doc(dbToUse, "alumnos", `batch_${i}`);
            const snap = await getDoc(batchRef);
            if (!snap.exists()) continue;
            const data = snap.data();
            const key = Object.keys(data).find(
              (k) => k.startsWith("user_") && data[k]?.email === email
            );
            if (key) {
              await updateDoc(batchRef, { [`${key}.cursosAdquiridos`]: arrayUnion(docRef.id) });
              found = true;
            }
          }
        }
        await updateDoc(doc(dbToUse, "cursos", docRef.id), {
          cursantes: arrayUnion(...payload.cursantes),
        });
      }

      toast.success("Material creado exitosamente 🎉");
      reloadData?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el material");
    } finally {
      setSaving(false);
    }
  };

  // ── Attempt close ─────────────────────────────────────────────────────────────

  const handleAttemptClose = () => {
    const hasData = material.titulo || material.descripcion || units.length > 0;
    if (hasData) setShowExitConfirm(true);
    else onClose?.();
  };

  // ── Render selected content item ──────────────────────────────────────────────

  const renderContent = () => {
    if (!selectedId) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-sm">
          <Icon.Layers />
          <p className="mt-3">Selecciona un elemento del timeline para editar</p>
        </div>
      );
    }

    const item = material.contentTimeline.find((i) => i.id === selectedId);
    if (!item) return null;

    if (item.type === "unit") {
      const unit = units.find((u) => u.id === item.refId);
      if (!unit) return <p className="text-sm text-slate-400">Unidad no encontrada</p>;
      return (
        <UnitEditor
          unit={unit}
          onChange={(patch) => updateUnit(unit.id, patch)}
          onAddLesson={() => addLesson(unit.id)}
          onDeleteLesson={(lIdx) => deleteLesson(unit.id, lIdx)}
          onAddBlock={(lIdx, type) => addBlock(unit.id, lIdx, type)}
          onUpdateBlock={(lIdx, bIdx, val) => updateBlock(unit.id, lIdx, bIdx, val)}
          onDeleteBlock={(lIdx, bIdx) => deleteBlock(unit.id, lIdx, bIdx)}
        />
      );
    }

    if (item.type === "final_exam") {
      return <FinalExamEditor value={finalExam} onChange={setFinalExam} />;
    }

    if (item.type === "project") {
      return <CapstoneEditor value={capstone} onChange={setCapstone} />;
    }

    if (item.type === "closing") {
      return (
        <ClosingEditor
          textoFinalCurso={material.textoFinalCurso}
          textoFinalCursoVideoUrl={material.textoFinalCursoVideoUrl}
          onChange={(patch) => setMat(patch)}
        />
      );
    }

    return null;
  };

  // ── Timeline label helpers ────────────────────────────────────────────────────
// Lista filtrada (sin refetch, todo desde el context)
const filteredAlumnos = useMemo(() => {
  const list = Array.isArray(alumnos) ? alumnos : [];

  const matches = list.filter((a) => {
    const lang = a.learningLanguage || a.idioma || "";
    const lvl = a.learningLevel || a.nivel || "";
    const nombre = (a.nombre || a.email || "").toLowerCase();

    let tieneCurso = true;
    if (filterCursoId) {
      const raw = alumnosRaw?.find(
        (r: any) => r.email?.toLowerCase() === a.email?.toLowerCase()
      );
      tieneCurso = raw && Array.isArray(raw.cursosAsignados)
        ? raw.cursosAsignados.some((c: any) =>
            (c.curso || "").toLowerCase().includes(filterCursoId.toLowerCase())
          )
        : false;
    }

    return (
      (filterIdioma ? lang.toLowerCase() === filterIdioma.toLowerCase() : true) &&
      (filterNivel ? lvl.toLowerCase() === filterNivel.toLowerCase() : true) &&
      (filterNombre ? nombre.includes(filterNombre.toLowerCase()) : true) &&
      tieneCurso
    );
  });

  // Deduplicar por email
  const seen = new Set<string>();
  return matches.filter((a) => {
    const email = a.email?.toLowerCase().trim();
    if (!email || seen.has(email)) return false;
    seen.add(email);
    return true;
  });
}, [alumnos, alumnosRaw, filterIdioma, filterNivel, filterNombre, filterCursoId]);

// Helper para agregar todos los filtrados
const addAllFiltered = (emails: string[]) => {
  setMat({
    cursantes: Array.from(new Set([...material.cursantes, ...emails.filter(Boolean)])),
  });
};

// toggleCursante para el click en la lista
const toggleCursante = (email: string) => {
  const normalized = email?.toLowerCase().trim();
  if (!normalized) return;
  const already = material.cursantes.includes(normalized);
  setMat({
    cursantes: already
      ? material.cursantes.filter((e) => e !== normalized)
      : [...material.cursantes, normalized],
  });
};
  const getLabel = (item: ContentItem, index: number) => {
    if (item.type === "unit") {
      const unit = units.find((u) => u.id === item.refId);
      return unit?.titulo ? `Unidad: ${unit.titulo}` : `Unidad ${index + 1}`;
    }
    if (item.type === "final_exam") return "Examen Final";
    if (item.type === "project") return "Proyecto Final";
    if (item.type === "closing") return "Cierre";
    return item.type;
  };

  const unitCount = material.contentTimeline.filter((i) => i.type === "unit").length;
  const hasFinalExam = material.contentTimeline.some((i) => i.type === "final_exam");
  const hasProject = material.contentTimeline.some((i) => i.type === "project");
  const hasClosing = material.contentTimeline.some((i) => i.type === "closing");

  // ── Students tab ──────────────────────────────────────────────────────────────

  const [emailInput, setEmailInput] = useState("");

  const addEmailManual = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    if (material.cursantes.includes(email)) {
      toast.error("Este email ya está en la lista");
      return;
    }
    setMat({ cursantes: [...material.cursantes, email] });
    setEmailInput("");
  };

  // 3. Filtrar mientras tipea
const handleEmailInputChange = (value: string) => {
  setEmailInput(value);
  if (value.length < 2) {
    setSuggestions([]);
    return;
  }
  const filtered = alumnos.filter(
    (a) =>
      a.email?.toLowerCase().includes(value.toLowerCase()) &&
      !material.cursantes.includes(a.email?.toLowerCase())
  );
  setSuggestions(filtered.slice(0, 5));
};

// 4. Seleccionar sugerencia
const selectSuggestion = (alumno: any) => {
  const email = alumno.email.toLowerCase().trim();
  if (!material.cursantes.includes(email)) {
    setMat({ cursantes: [...material.cursantes, email] });
  }
  setEmailInput("");
  setSuggestions([]);
};

  const removeEmail = (email: string) =>
    setMat({ cursantes: material.cursantes.filter((e) => e !== email) });

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40  p-4">
      <div className="relative w-full max-w-5xl max-h-[94vh] flex flex-col bg-slate-50 rounded-3xl shadow-2xl overflow-hidden border border-slate-200">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-7 py-5 bg-white border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Crear Material Académico</h2>
            <p className="text-xs text-slate-400 mt-0.5">Define la estructura y contenido del nuevo material</p>
          </div>

          {/* Tabs */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5">
            <TabButton active={tab === "general"} onClick={() => setTab("general")}>General</TabButton>
            <TabButton active={tab === "content"} onClick={() => setTab("content")}>Contenido</TabButton>
            <TabButton active={tab === "students"} onClick={() => setTab("students")}>Alumnos</TabButton>
          </div>

          <button
            type="button"
            onClick={handleAttemptClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
          >
            <Icon.X />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          <form id="material-form" onSubmit={handleSubmit}>

            {/* ─ GENERAL TAB ─ */}
            {tab === "general" && (
              <div className="p-7 space-y-5 max-w-2xl">
                <SectionCard className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Título del material *</Label>
                      <Input
                        value={material.titulo}
                        onChange={(v) => setMat({ titulo: v })}
                        placeholder="Ej: Inglés para Negocios B2"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>Descripción *</Label>
                      <Textarea
                        value={material.descripcion}
                        onChange={(v) => setMat({ descripcion: v })}
                        placeholder="¿Qué aprenderá el alumno? ¿Para quién es este material?"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Idioma *</Label>
                      <Select value={material.idioma} onChange={(v) => setMat({ idioma: v })} required>
                        <option value="" disabled>Seleccionar...</option>
                        <option value="es">Español</option>
                        <option value="en">Inglés</option>
                        <option value="pt">Portugués</option>
                        <option value="fr">Francés</option>
                        <option value="it">Italiano</option>
                      </Select>
                    </div>

                    <div>
                      <Label>Nivel *</Label>
                      <Select value={material.nivel} onChange={(v) => setMat({ nivel: v })} required>
                        <option value="" disabled>Seleccionar...</option>
                        {["A1","A2","B1","B2","B2.5","C1","C2"].map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </Select>
                    </div>

                    <div>
                      <Label>Video de presentación (Vimeo)</Label>
                      <Input
                        value={material.videoPresentacion}
                        onChange={(v) => setMat({ videoPresentacion: v })}
                        placeholder="https://vimeo.com/..."
                        type="url"
                      />
                    </div>

                    <div>
                      <Label>Imagen de portada (URL)</Label>
                      <Input
                        value={material.urlImagen}
                        onChange={(v) => setMat({ urlImagen: v })}
                        placeholder="https://..."
                        type="url"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <div
                          onClick={() => setMat({ publico: !material.publico })}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            material.publico ? "bg-slate-900" : "bg-slate-300"
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              material.publico ? "translate-x-5" : ""
                            }`}
                          />
                        </div>
                        <span className="text-sm text-slate-700 font-medium">Material público</span>
                      </label>
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ─ CONTENT TAB ─ */}
            {tab === "content" && (
              <div className="p-7 space-y-5">
                {/* JSON import */}
                <JsonImportPanel onLoad={handleLoadJson} onExport={handleExportJson} />

                {/* Timeline + editor split */}
                <div className="grid grid-cols-3 gap-5 min-h-[400px]">

                  {/* Left: timeline */}
                  <div className="col-span-1 space-y-3">
                    <SectionCard className="space-y-3">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Timeline</p>

                      {/* Add buttons */}
                      <div className="flex flex-col gap-1.5">
                        <button
                          type="button"
                          onClick={addUnit}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 border border-dashed border-slate-300 rounded-lg hover:border-slate-500 hover:text-slate-900 transition"
                        >
                          <Icon.Plus /> Agregar unidad
                        </button>
                        <button
                          type="button"
                          onClick={() => addSingleton("final_exam")}
                          disabled={hasFinalExam}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 border border-dashed border-amber-200 rounded-lg hover:border-amber-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Icon.Plus /> Examen Final {hasFinalExam && "✓"}
                        </button>
                        <button
                          type="button"
                          onClick={() => addSingleton("project")}
                          disabled={hasProject}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 border border-dashed border-blue-200 rounded-lg hover:border-blue-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Icon.Plus /> Proyecto Final {hasProject && "✓"}
                        </button>
                        <button
                          type="button"
                          onClick={() => addSingleton("closing")}
                          disabled={hasClosing}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 border border-dashed border-emerald-200 rounded-lg hover:border-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Icon.Plus /> Cierre {hasClosing && "✓"}
                        </button>
                      </div>

                      {/* Items */}
                      {material.contentTimeline.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-4">Sin elementos aún</p>
                      )}
                      <div className="space-y-1.5">
                        {material.contentTimeline.map((item, idx) => (
                          <TimelineItemBadge
                            key={item.id}
                            item={item}
                            isSelected={selectedId === item.id}
                            label={getLabel(item, idx)}
                            onSelect={() => setSelectedId(item.id)}
                            onDelete={() => deleteItem(item.id)}
                          />
                        ))}
                      </div>

                      {/* Stats */}
                      {material.contentTimeline.length > 0 && (
                        <p className="text-xs text-slate-400 pt-1 border-t border-slate-100">
                          {unitCount} unidad{unitCount !== 1 ? "es" : ""} · {material.contentTimeline.length} elemento{material.contentTimeline.length !== 1 ? "s" : ""}
                        </p>
                      )}
                    </SectionCard>
                  </div>

                  {/* Right: editor */}
                  <div className="col-span-2 overflow-y-auto">
                    {renderContent()}
                  </div>
                </div>
              </div>
            )}

 {/* ─ STUDENTS TAB ─ */}
{tab === "students" && (
  <div className="p-7 space-y-5">
    <SectionCard className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900">Alumnos asignados</h3>

      <div className="grid grid-cols-2 gap-6">

        {/* ── COLUMNA IZQUIERDA: Filtros + Lista ── */}
        <div className="space-y-4">

          {/* Buscar por nombre */}
          <div>
            <Label>Buscar por nombre</Label>
            <input
              type="text"
              placeholder="Nombre del alumno..."
              value={filterNombre}
              onChange={(e) => { setFilterNombre(e.target.value); setAlumnosPage(0); }}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
            />
          </div>

          {/* Filtrar por ID de curso */}
          <div>
            <Label>Filtrar por ID de curso</Label>
            <input
              type="text"
              placeholder="Ej: ADM006"
              value={filterCursoId}
              onChange={(e) => { setFilterCursoId(e.target.value); setAlumnosPage(0); }}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900 transition"
            />
          </div>

          {/* Idioma + Nivel */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Idioma</Label>
              <select
                value={filterIdioma}
                onChange={(e) => { setFilterIdioma(e.target.value); setAlumnosPage(0); }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition bg-white"
              >
                <option value="">Todos</option>
                <option value="es">Español</option>
                <option value="en">Inglés</option>
                <option value="pt">Portugués</option>
                <option value="fr">Francés</option>
                <option value="it">Italiano</option>
              </select>
            </div>
            <div>
              <Label>Nivel</Label>
              <select
                value={filterNivel}
                onChange={(e) => { setFilterNivel(e.target.value); setAlumnosPage(0); }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 transition bg-white"
              >
                <option value="">Todos</option>
                {["A1","A2","B1","B2","B2.5","C1","C2"].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Limpiar filtros */}
          {(filterNombre || filterCursoId || filterIdioma || filterNivel) && (
            <button
              type="button"
              onClick={() => {
                setFilterNombre("");
                setFilterCursoId("");
                setFilterIdioma("");
                setFilterNivel("");
                setAlumnosPage(0); // 👈 agregar esto
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 text-sm hover:bg-slate-100 transition"
            >
              <Icon.X /> Limpiar filtros
            </button>
          )}

          {/* Lista filtrada */}
<div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2 space-y-0.5">
  {filteredAlumnos.length === 0 ? (
    <p className="text-center text-slate-400 py-6 text-sm">
      {alumnos.length === 0 ? "⏳ Cargando alumnos..." : "Sin resultados"}
    </p>
  ) : (
    <>
      <div className="flex items-center justify-between px-2 pb-1">
        <p className="text-xs text-slate-400">
          {filteredAlumnos.length} alumno{filteredAlumnos.length !== 1 ? "s" : ""}
          {filteredAlumnos.length > PAGE_SIZE && (
            <span className="ml-1 text-slate-300">
              · mostrando {alumnosPage * PAGE_SIZE + 1}–{Math.min((alumnosPage + 1) * PAGE_SIZE, filteredAlumnos.length)}
            </span>
          )}
        </p>
      </div>

      <div className="max-h-72 overflow-y-auto space-y-0.5">
        {filteredAlumnos
          .slice(alumnosPage * PAGE_SIZE, (alumnosPage + 1) * PAGE_SIZE)
          .map((a) => (
            <div
              key={a.email}
              onClick={() => toggleCursante(a.email)}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-100 cursor-pointer transition"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-slate-800 truncate">
                  {a.nombre || a.email}
                </span>
                <span className="text-xs text-slate-400 truncate">{a.email}</span>
              </div>
              <input
                type="checkbox"
                readOnly
                checked={material.cursantes.includes(a.email?.toLowerCase().trim())}
                className="ml-2 h-4 w-4 accent-slate-900 shrink-0"
              />
            </div>
          ))}
      </div>

      {/* Paginación */}
      {filteredAlumnos.length > PAGE_SIZE && (
        <div className="flex items-center justify-between pt-2 px-1 border-t border-slate-200 mt-1">
          <button
            type="button"
            onClick={() => setAlumnosPage((p) => Math.max(0, p - 1))}
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
            onClick={() => setAlumnosPage((p) => Math.min(Math.ceil(filteredAlumnos.length / PAGE_SIZE) - 1, p + 1))}
            disabled={alumnosPage >= Math.ceil(filteredAlumnos.length / PAGE_SIZE) - 1}
            className="px-3 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Siguiente →
          </button>
        </div>
      )}
    </>
  )}
</div>

          {/* Agregar todos los filtrados */}
          <button
            type="button"
            onClick={() => addAllFiltered(filteredAlumnos.map((a) => a.email?.toLowerCase().trim()))}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-400 text-slate-600 text-sm font-medium hover:bg-slate-100 transition"
          >
            <Icon.Plus /> Agregar todos los filtrados
          </button>
        </div>

        {/* ── COLUMNA DERECHA: Seleccionados ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">
              Seleccionados ({material.cursantes.length})
            </h4>
            {material.cursantes.length > 0 && (
              <button
                type="button"
                onClick={() => setMat({ cursantes: [] })}
                className="text-xs text-red-500 hover:text-red-700 transition"
              >
                Eliminar todos
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2 space-y-0.5">
            {material.cursantes.length === 0 ? (
              <p className="text-center text-slate-400 py-6 text-sm">
                Sin alumnos seleccionados
              </p>
            ) : (
              material.cursantes.map((email) => {
                const alumno = alumnos.find(
                  (a) => a.email?.toLowerCase().trim() === email
                );
                return (
                  <div
                    key={email}
                    className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-100 hover:border-red-200 hover:bg-red-50 transition group"
                  >
                    <div className="flex flex-col min-w-0">
                      {alumno?.nombre && (
                        <span className="text-xs font-medium text-slate-700 truncate">
                          {alumno.nombre}
                        </span>
                      )}
                      <span className="text-xs text-slate-500 truncate">{email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      className="ml-2 text-slate-300 group-hover:text-red-500 transition shrink-0"
                    >
                      <Icon.Trash />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </SectionCard>
  </div>
)}

          </form>
        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 px-7 py-4 bg-white border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {units.length} unidad{units.length !== 1 ? "es" : ""} · {material.cursantes.length} alumno{material.cursantes.length !== 1 ? "s" : ""}
          </span>
          <button
            type="submit"
            form="material-form"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition shadow-sm"
          >
            <Icon.Save />
            {saving ? "Guardando..." : "Crear material"}
          </button>
        </div>
      </div>

      {/* ── Exit confirm modal ── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">¿Salir sin guardar?</h3>
            <p className="text-sm text-slate-500">Perderás todos los cambios realizados.</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => { setShowExitConfirm(false); onClose?.(); }}
                className="px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition"
              >
                Salir y descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}