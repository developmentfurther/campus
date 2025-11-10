"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiEye,
  FiUser,
  FiClock,
  FiMessageCircle,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";

export default function ProfesorEntregasPage() {
  const { user, allCursos } = useAuth();
  const [entregas, setEntregas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntrega, setSelectedEntrega] = useState<any | null>(null);

  /* =========================================================
     🔹 Cargar entregas de los cursos del profesor
     ========================================================= */
  useEffect(() => {
    const fetchEntregas = async () => {
      if (!user?.email || !Array.isArray(allCursos)) return;

      try {
        setLoading(true);

        // filtrar cursos del profesor
        const email = user.email.toLowerCase();
        const cursosProfesor = allCursos.filter((c: any) =>
          Array.isArray(c.profesores)
            ? c.profesores.map((p: string) => p.toLowerCase()).includes(email)
            : c.profesorId === user.uid
        );
        const idsCursos = cursosProfesor.map((c: any) => c.id);

        if (idsCursos.length === 0) {
          setEntregas([]);
          return;
        }

        const entregasRef = collection(db, "entregas");
        const q = query(entregasRef, where("cursoId", "in", idsCursos.slice(0, 10))); // Firestore limita a 10 valores por 'in'
        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setEntregas(data);
      } catch (err) {
        console.error("❌ Error cargando entregas:", err);
        toast.error("Error al cargar las entregas.");
      } finally {
        setLoading(false);
      }
    };

    fetchEntregas();
  }, [user?.email, allCursos]);

  /* =========================================================
     🔹 Manejar corrección
     ========================================================= */
  const handleCorregir = async (
    entregaId: string,
    nota: number,
    feedback: string,
    estado: "aprobado" | "rechazado"
  ) => {
    try {
      const ref = doc(db, "entregas", entregaId);
      await updateDoc(ref, {
        nota,
        feedback,
        estado,
        revisadoPor: user?.email,
        fechaRevision: new Date().toISOString(),
      });
      toast.success("✅ Entrega corregida");
      setSelectedEntrega(null);

      // actualizar localmente
      setEntregas((prev) =>
        prev.map((e) =>
          e.id === entregaId
            ? { ...e, nota, feedback, estado, revisadoPor: user?.email }
            : e
        )
      );
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar la corrección");
    }
  };

  /* =========================================================
     🔹 UI
     ========================================================= */
  if (loading)
    return (
      <div className="p-8 text-slate-500 bg-gray-50 min-h-screen flex items-center justify-center">
        Cargando entregas...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FiFileText className="text-blue-600" />
          Entregas de alumnos
        </h1>
        <p className="text-gray-500 mt-1">
          Revisá y calificá las entregas enviadas por tus alumnos.
        </p>
      </div>

      {/* LISTADO */}
      {entregas.length === 0 ? (
        <div className="border border-dashed border-gray-300 p-6 rounded-lg text-gray-400 text-center">
          No hay entregas para mostrar.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-sm font-semibold text-slate-600">Alumno</th>
                <th className="p-3 text-sm font-semibold text-slate-600">Curso</th>
                <th className="p-3 text-sm font-semibold text-slate-600">Fecha</th>
                <th className="p-3 text-sm font-semibold text-slate-600">Estado</th>
                <th className="p-3 text-sm font-semibold text-slate-600 text-right">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {entregas.map((e) => (
                <tr
                  key={e.id}
                  className="border-t border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="p-3 text-sm text-slate-700 flex items-center gap-2">
                    <FiUser className="text-slate-400" />
                    {e.alumno}
                  </td>
                  <td className="p-3 text-sm text-slate-600">{e.cursoId}</td>
                  <td className="p-3 text-sm text-slate-500 flex items-center gap-1">
                    <FiClock size={14} />
                    {e.fechaEntrega
                      ? new Date(
                          e.fechaEntrega.seconds * 1000
                        ).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3 text-sm">
                    <EstadoBadge estado={e.estado} />
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedEntrega(e)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <FiEye size={14} />
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DETALLE */}
      {selectedEntrega && (
        <EntregaModal
          entrega={selectedEntrega}
          onClose={() => setSelectedEntrega(null)}
          onSave={handleCorregir}
        />
      )}
    </div>
  );
}

/* =========================================================
   🔹 COMPONENTES AUXILIARES
   ========================================================= */
function EstadoBadge({ estado }: { estado?: string }) {
  if (estado === "aprobado")
    return (
      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full text-xs font-medium">
        <FiCheckCircle size={12} /> Aprobado
      </span>
    );
  if (estado === "rechazado")
    return (
      <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full text-xs font-medium">
        <FiXCircle size={12} /> Rechazado
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full text-xs font-medium">
      Pendiente
    </span>
  );
}

/* =========================================================
   🔹 MODAL DE REVISIÓN
   ========================================================= */
function EntregaModal({
  entrega,
  onClose,
  onSave,
}: {
  entrega: any;
  onClose: () => void;
  onSave: (
    entregaId: string,
    nota: number,
    feedback: string,
    estado: "aprobado" | "rechazado"
  ) => void;
}) {
  const [nota, setNota] = useState(entrega.nota || "");
  const [feedback, setFeedback] = useState(entrega.feedback || "");

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <FiFileText className="text-blue-600" /> Revisión de entrega
        </h2>

        <div className="space-y-2 text-sm">
          <p>
            <span className="font-semibold">Alumno:</span> {entrega.alumno}
          </p>
          <p>
            <span className="font-semibold">Curso:</span> {entrega.cursoId}
          </p>
          {entrega.archivoUrl && (
            <a
              href={entrega.archivoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1 mt-2"
            >
              <FiFileText /> Ver archivo adjunto
            </a>
          )}
          {entrega.respuestaTexto && (
            <div className="bg-gray-50 border rounded-lg p-3 mt-3 text-gray-700">
              <p className="text-sm whitespace-pre-line">
                {entrega.respuestaTexto}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Nota (0-10)
          </label>
          <input
            type="number"
            value={nota}
            onChange={(e) => setNota(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            min={0}
            max={10}
          />

          <label className="block text-sm font-medium text-gray-700">
            Feedback
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            placeholder="Escribí tus comentarios..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-between items-center pt-3">
          <Button variant="outline" onClick={onClose} className="text-gray-600">
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={() =>
                onSave(entrega.id, Number(nota), feedback, "rechazado")
              }
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Rechazar
            </Button>
            <Button
              onClick={() =>
                onSave(entrega.id, Number(nota), feedback, "aprobado")
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Aprobar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
