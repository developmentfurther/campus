// MarkdownWYSIWYG.tsx
// Componente que renderiza Markdown respetando EXACTAMENTE los saltos de línea

function MarkdownWYSIWYG({ children }: { children: string }) {
  if (!children) return null;

  const processMarkdown = (text: string) => {
    // Procesar el texto línea por línea
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Headers
      if (line.startsWith('### ')) {
        elements.push(<h3 key={i} className="text-lg font-bold mt-3 mb-2">{processInline(line.slice(4))}</h3>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={i} className="text-xl font-bold mt-4 mb-2">{processInline(line.slice(3))}</h2>);
      } else if (line.startsWith('# ')) {
        elements.push(<h1 key={i} className="text-2xl font-bold mt-4 mb-2">{processInline(line.slice(2))}</h1>);
      }
      // Lista con viñetas
      else if (line.trim().startsWith('- ')) {
        elements.push(
          <div key={i} className="flex gap-2">
            <span>•</span>
            <span>{processInline(line.trim().slice(2))}</span>
          </div>
        );
      }
      // Lista numerada
      else if (/^\d+\.\s/.test(line.trim())) {
        const match = line.trim().match(/^(\d+)\.\s(.*)$/);
        if (match) {
          elements.push(
            <div key={i} className="flex gap-2">
              <span>{match[1]}.</span>
              <span>{processInline(match[2])}</span>
            </div>
          );
        }
      }
      // Línea vacía = espacio
      else if (line.trim() === '') {
        elements.push(<div key={i} className="h-4"></div>);
      }
      // Texto normal
      else {
        elements.push(<div key={i}>{processInline(line)}</div>);
      }
    }

    return elements;
  };

  const processInline = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    let current = text;
    let key = 0;

    while (current.length > 0) {
      // Bold **texto**
      const boldMatch = current.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(current.slice(0, boldMatch.index));
        }
        parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
        current = current.slice(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // Italic *texto*
      const italicMatch = current.match(/\*(.+?)\*/);
      if (italicMatch && italicMatch.index !== undefined) {
        if (italicMatch.index > 0) {
          parts.push(current.slice(0, italicMatch.index));
        }
        parts.push(<em key={key++}>{italicMatch[1]}</em>);
        current = current.slice(italicMatch.index + italicMatch[0].length);
        continue;
      }

      // Links [texto](url)
      const linkMatch = current.match(/\[(.+?)\]\((.+?)\)/);
      if (linkMatch && linkMatch.index !== undefined) {
        if (linkMatch.index > 0) {
          parts.push(current.slice(0, linkMatch.index));
        }
        parts.push(
          <a key={key++} href={linkMatch[2]} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
            {linkMatch[1]}
          </a>
        );
        current = current.slice(linkMatch.index + linkMatch[0].length);
        continue;
      }

      // No hay más matches, agregar el resto
      parts.push(current);
      break;
    }

    return parts;
  };

  return <div className="space-y-0">{processMarkdown(children)}</div>;
}

export default MarkdownWYSIWYG;