"use client";

import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FiLayers, FiClipboard, FiFlag, FiCheckCircle, FiTrash2 } from "react-icons/fi";

interface ContentItem {
  id: string;
  type: "unit" | "final_exam" | "project" | "closing";
  refId?: string;
}

// ---- Item visual para cada bloque ----
function SortableItem({ 
  item, 
  isSelected, 
  onSelect,
  onDelete // 👈 NUEVO
}: { 
  item: ContentItem; 
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void; // 👈 NUEVO
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getLabel = () => {
    switch (item.type) {
      case "unit":
        return "Unit";
      case "final_exam":
        return "Final Exam";
      case "project":
        return "Project";
      case "closing":
        return "Closing";
    }
  };

  const getIcon = () => {
    switch (item.type) {
      case "unit":
        return <FiLayers className="w-4 h-4" />;
      case "final_exam":
        return <FiClipboard className="w-4 h-4" />;
      case "project":
        return <FiLayers className="w-4 h-4" />;
      case "closing":
        return <FiFlag className="w-4 h-4" />;
    }
  };

    return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={() => onSelect(item.id)}
      className={`
        flex items-center justify-between
        px-3 py-2 mb-2
        rounded-lg border-2 transition-all
        text-sm cursor-pointer
        ${isSelected 
          ? 'border-[#EE7203] bg-[#EE7203]/10' 
          : 'border-[#112C3E]/20 bg-white hover:border-[#EE7203]/50'
        }
      `}
    >
      <div className="flex items-center gap-2">
        {getIcon()}
        <span className="font-medium text-[#0C212D]">{getLabel()}</span>
        {isSelected && <FiCheckCircle className="w-4 h-4 text-[#EE7203]" />}
      </div>
      
      <div className="flex items-center gap-2">
        {/* 👇 BOTÓN ELIMINAR NUEVO */}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        )}
        
        <span 
          {...listeners}
          className="text-xs text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing px-2"
        >
          ⋮⋮
        </span>
      </div>
    </div>
  );

}

interface Props {
  items: ContentItem[];
  onChange: (next: ContentItem[]) => void;
  selectedItemId?: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void; // 👈 NUEVO

  onAddUnit: () => void;
  onAddFinalExam: () => void;
  onAddProject: () => void;
  onAddClosing: () => void;
}

export default function ContentTimelineEditor({
  items,
  onChange,
  selectedItemId,
  onSelect,
  onAddUnit,
  onAddFinalExam,
  onAddProject,
  onAddClosing,
  onDelete
}: Props) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onChange(arrayMove(items, oldIndex, newIndex));
  };

  const hasFinalExam = items.some(i => i.type === "final_exam");
  const hasProject = items.some(i => i.type === "project");
  const hasClosing = items.some(i => i.type === "closing");

  return (
    <section className="rounded-2xl border border-[#112C3E]/20 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-[#0C212D]">
          Course Content Timeline
        </h3>
        <span className="text-xs text-gray-500">
          Click to edit, drag ⋮⋮ to reorder
        </span>
      </div>

      {/* Botones para agregar bloques */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAddUnit}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#EE7203]/10 text-[#EE7203] hover:bg-[#EE7203]/20 transition"
        >
          + Add Unit
        </button>

        <button
          type="button"
          onClick={onAddFinalExam}
          disabled={hasFinalExam}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            hasFinalExam 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-[#0C212D]/5 text-[#0C212D] hover:bg-[#0C212D]/10'
          }`}
        >
          + Add Final Exam {hasFinalExam && '✓'}
        </button>

        <button
          type="button"
          onClick={onAddProject}
          disabled={hasProject}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            hasProject 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-[#0C212D]/5 text-[#0C212D] hover:bg-[#0C212D]/10'
          }`}
        >
          + Add Project {hasProject && '✓'}
        </button>

        <button
          type="button"
          onClick={onAddClosing}
          disabled={hasClosing}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            hasClosing 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-[#0C212D]/5 text-[#0C212D] hover:bg-[#0C212D]/10'
          }`}
        >
          + Add Closing {hasClosing && '✓'}
        </button>
      </div>

      {/* Lista draggable */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.length === 0 ? (
            <div className="text-xs text-gray-500 py-4 text-center border-2 border-dashed rounded-lg">
              No blocks yet. Start by adding a Unit, Final Exam, Project, or Closing.
            </div>
          ) : (
            items.map((item) => (
              <SortableItem 
                key={item.id} 
                item={item} 
                isSelected={selectedItemId === item.id}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))
          )}
        </SortableContext>
      </DndContext>
    </section>
  );
}