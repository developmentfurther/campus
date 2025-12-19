"use client";

import React, { useState } from "react";
import { FiChevronRight, FiTrash2 } from "react-icons/fi";
import BlockEditor from "./blocks/BlockEditor"; // Ajusta la ruta según tu estructura
import UnitBlockToolbar from "./blocks/UnitToolbar"; // Ajusta la ruta según tu estructura

interface LessonItemProps {
  unidadIdx: number;
  leccion: any;
  leccionIdx: number;
  updateBlock: (uIdx: number, lIdx: number, bIdx: number, val: any) => void;
  deleteBlock: (uIdx: number, lIdx: number, bIdx: number) => void;
  addBlock: (uIdx: number, lIdx: number, type: string) => void;
  borrarLeccion: (uIdx: number, lIdx: number) => void;
}

export default function LessonItem({
  unidadIdx,
  leccion,
  leccionIdx,
  updateBlock,
  deleteBlock,
  addBlock,
  borrarLeccion,
}: LessonItemProps) {
  // Por defecto colapsado (false). Si quieres que al crear aparezca abierto, ponlo en true.
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl bg-white mb-4 shadow-sm overflow-hidden transition-all">
      {/* HEADER (Click para abrir/cerrar) */}
      <div
        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`text-gray-500 transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            <FiChevronRight size={20} />
          </div>

          <h4 className="font-bold text-slate-700 select-none">
            Sección {String.fromCharCode(65 + leccionIdx)}
            <span className="ml-3 text-xs font-normal text-gray-400">
              ({leccion.blocks ? leccion.blocks.length : 0} bloques)
            </span>
          </h4>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation(); // Evita que se abra/cierre al borrar
            if (confirm("¿Borrar esta sección permanentemente?")) {
              borrarLeccion(unidadIdx, leccionIdx);
            }
          }}
          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
          title="Borrar sección"
          type="button"
        >
          <FiTrash2 size={18} />
        </button>
      </div>

      {/* BODY (Contenido) */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-100 animate-fadeIn">
          <div className="space-y-4">
            {/* Toolbar para agregar bloques */}
            <UnitBlockToolbar
              addBlock={(type: string) => addBlock(unidadIdx, leccionIdx, type)}
            />

            {/* Lista de bloques */}
            {(!leccion.blocks || leccion.blocks.length === 0) ? (
              <p className="text-center text-sm text-gray-400 py-4 italic">
                No hay contenido en esta sección aún.
              </p>
            ) : (
              leccion.blocks.map((block: any, bIdx: number) => (
                <div
                  key={bIdx}
                  className="bg-white p-4 border rounded-lg relative group"
                >
                  <div className="absolute -left-3 top-4 bg-slate-100 text-xs text-slate-400 px-1 rounded border">
                    #{bIdx + 1}
                  </div>
                  <BlockEditor
                    block={block}
                    onChange={(updated: any) =>
                      updateBlock(unidadIdx, leccionIdx, bIdx, updated)
                    }
                    onDelete={() => deleteBlock(unidadIdx, leccionIdx, bIdx)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}