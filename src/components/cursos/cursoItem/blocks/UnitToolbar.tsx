"use client";

interface Props {
  addBlock: (type: string) => void;
}

export default function UnitBlockToolbar({ addBlock }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">

      <button
        type="button"
        onClick={() => addBlock("title")}
        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
      >
        + Title
      </button>

      <button
      type="button"
        onClick={() => addBlock("description")}
        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
      >
        + Description
      </button>

      <button
      type="button"
        onClick={() => addBlock("theory")}
        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
      >
        + Theory
      </button>

      <button
      type="button"
        onClick={() => addBlock("video")}
        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
      >
        + Video
      </button>

      <button
      type="button"
        onClick={() => addBlock("pdf")}
        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
      >
        + PDF
      </button>

      <button
      type="button"
        onClick={() => addBlock("vocabulary")}
        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
      >
        + Vocabulary
      </button>

      <button
      type="button"
        onClick={() => addBlock("exercise")}
        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
      >
        + Exercise
      </button>

    </div>
  );
}
