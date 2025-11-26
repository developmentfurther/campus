"use client";

import React from "react";

export default function VocabularyEditor({ value, onChange }) {
  const entries = value?.entries || [];

  const updateEntry = (idx, patch) => {
    const newList = [...entries];
    newList[idx] = { ...newList[idx], ...patch };
    onChange({ entries: newList });
  };

  const addEntry = () => {
    onChange({
      entries: [
        ...entries,
        { term: "", translation: "", example: "" },
      ],
    });
  };

  const removeEntry = (idx) => {
    onChange({
      entries: entries.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-3">

      {/* FILAS */}
      {entries.map((e, idx) => (
        <div
          key={idx}
          className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-white border border-slate-200 rounded-lg"
        >
          {/* Term */}
          <input
            type="text"
            placeholder="Word"
            value={e.term}
            onChange={(ev) => updateEntry(idx, { term: ev.target.value })}
            className="border rounded-md p-2"
          />

          {/* Translation */}
          <input
            type="text"
            placeholder="Translation"
            value={e.translation}
            onChange={(ev) =>
              updateEntry(idx, { translation: ev.target.value })
            }
            className="border rounded-md p-2"
          />

          {/* Example */}
          <input
            type="text"
            placeholder="Example (optional)"
            value={e.example || ""}
            onChange={(ev) => updateEntry(idx, { example: ev.target.value })}
            className="border rounded-md p-2"
          />

          {/* Remove */}
          <button
            type="button"
            onClick={() => removeEntry(idx)}
            className="text-red-500 text-sm mt-1 hover:underline"
          >
            Delete
          </button>
        </div>
      ))}

      {/* ADD BUTTON */}
      <button
        type="button"
        onClick={addEntry}
        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100"
      >
        + Add vocabulary row
      </button>

    </div>
  );
}
