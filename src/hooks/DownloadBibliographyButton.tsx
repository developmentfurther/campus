import { useState } from "react";
import { FiDownload, FiLoader, FiChevronRight } from "react-icons/fi";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

/**
 * 🔧 SANITIZACIÓN ULTRA-ROBUSTA
 */
const sanitizeForPDF = (text) => {
  if (!text) return "";
  
  // Convertir a string y normalizar
  let cleaned = String(text)
    // Caracteres acentuados
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover diacríticos
    // Mapeo manual para casos especiales
    .replace(/ñ/g, 'n').replace(/Ñ/g, 'N')
    // Comillas y símbolos tipográficos
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—−]/g, '-')
    .replace(/…/g, '...')
    .replace(/•/g, '- ')
    // Símbolos especiales
    .replace(/¿/g, '')
    .replace(/¡/g, '')
    .replace(/[™®©]/g, '')
    .replace(/€/g, 'EUR')
    .replace(/£/g, 'GBP')
    .replace(/¥/g, 'YEN')
    .replace(/\$/g, 'USD')
    // Remover caracteres de control
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    // Espacios especiales
    .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
    // Símbolos matemáticos y técnicos
    .replace(/[×÷±≠≈≤≥]/g, '')
    // Mantener solo ASCII básico + algunos símbolos comunes
    .replace(/[^\x20-\x7E]/g, '')
    // Normalizar espacios múltiples
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
};

/**
 * 🧹 Limpiar markdown agresivamente
 */
const stripMarkdown = (text) => {
  if (!text) return "";
  
  return text
    // Headers
    .replace(/^#{1,6}\s+/gm, '')
    // Bold, italic, strikethrough
    .replace(/(\*\*\*|___|~~)(.+?)\1/g, '$2')
    .replace(/(\*\*|__)(.+?)\1/g, '$2')
    .replace(/(\*|_)(.+?)\1/g, '$2')
    // Links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Images
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Lists
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, '• ')
    // Blockquotes
    .replace(/^\s*>\s+/gm, '')
    // Horizontal rules
    .replace(/^(\*{3,}|-{3,}|_{3,})$/gm, '')
    // HTML tags
    .replace(/<[^>]+>/g, '')
    // Multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * 📏 Truncar texto inteligentemente
 */
const smartTruncate = (text, maxLength = 2000) => {
  if (!text || text.length <= maxLength) return text;
  
  // Truncar en el último punto antes del límite
  const truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf('.');
  
  if (lastPeriod > maxLength * 0.7) {
    return truncated.substring(0, lastPeriod + 1).trim();
  }
  
  return truncated.trim() + '...';
};

/**
 * 🎨 GENERADOR DE PDF PROFESIONAL
 */
export default function DownloadBibliographyButton({ unit, courseTitle }) {
  const [loading, setLoading] = useState(false);

  const generatePDF = async () => {
    if (!unit) {
      toast.error("No hay datos de la unidad disponibles");
      return;
    }

    setLoading(true);
    const startTime = performance.now();
    
    try {
      // ==========================================
      // 📄 CONFIGURACIÓN DEL DOCUMENTO
      // ==========================================
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
        putOnlyUsedFonts: true
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (2 * margin);
      let y = margin;

      // Colores Further
      const colors = {
        primary: [238, 114, 3],      // #EE7203
        secondary: [12, 33, 45],      // #0C212D
        accent: [17, 44, 62],         // #112C3E
        text: [40, 40, 40],
        textLight: [100, 100, 100],
        border: [220, 220, 220]
      };

      // ==========================================
      // 🎨 FUNCIONES AUXILIARES DE DISEÑO
      // ==========================================
      
      const checkPageBreak = (neededSpace = 20) => {
        if (y + neededSpace > pageHeight - margin) {
          doc.addPage();
          y = margin;
          return true;
        }
        return false;
      };

      const addSection = (title, fontSize = 11, topSpace = 8) => {
        checkPageBreak(15);
        y += topSpace;
        
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.primary);
        doc.text(sanitizeForPDF(title), margin, y);
        
        y += 2;
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(0.5);
        doc.line(margin, y, margin + 40, y);
        y += 6;
      };

      const addText = (text, fontSize = 9, fontStyle = "normal", color = colors.text) => {
        if (!text) return;
        
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", fontStyle);
        doc.setTextColor(...color);
        
        const lines = doc.splitTextToSize(sanitizeForPDF(text), contentWidth);
        const lineHeight = fontSize * 0.4;
        
        lines.forEach(line => {
          checkPageBreak(lineHeight + 2);
          doc.text(line, margin, y);
          y += lineHeight;
        });
      };

      const addBulletPoint = (text, indent = 5) => {
        checkPageBreak(8);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.text);
        
        const bulletX = margin + indent;
        const textX = bulletX + 3;
        
        doc.text("•", bulletX, y);
        
        const lines = doc.splitTextToSize(sanitizeForPDF(text), contentWidth - indent - 3);
        lines.forEach((line, idx) => {
          if (idx > 0) checkPageBreak(4);
          doc.text(line, textX, y);
          y += 4;
        });
      };

      // ==========================================
      // 📌 HEADER PRINCIPAL
      // ==========================================
      
      // Logo "Further"
      doc.setFontSize(28);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.primary);
      doc.text("Further", margin, y);
      y += 8;

      // Línea decorativa gruesa
      doc.setDrawColor(...colors.primary);
      doc.setLineWidth(2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Título del curso
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...colors.secondary);
      const titleLines = doc.splitTextToSize(
        sanitizeForPDF(courseTitle || "Course Material"),
        contentWidth
      );
      titleLines.forEach(line => {
        doc.text(line, margin, y);
        y += 7;
      });
      y += 3;

      // Título de la unidad
      doc.setFontSize(14);
      doc.setTextColor(...colors.accent);
      doc.setFont("helvetica", "bold");
      const unitLines = doc.splitTextToSize(
        `Unit: ${sanitizeForPDF(unit.title)}`,
        contentWidth
      );
      unitLines.forEach(line => {
        doc.text(line, margin, y);
        y += 6;
      });
      y += 10;

      // ==========================================
      // 📚 CONTENIDO DE LECCIONES
      // ==========================================
      
      const lessons = (unit.lessons || []).filter(
        lesson => lesson.id !== "intro" && lesson.id !== "closing"
      );

      lessons.forEach((lesson, lessonIdx) => {
        checkPageBreak(30);
        
        // ▶️ TÍTULO DE LECCIÓN (con número)
        const lessonNumber = lessonIdx + 1;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...colors.primary);
        
        const lessonTitle = sanitizeForPDF(`${lessonNumber}. ${lesson.title}`);
        doc.text(lessonTitle, margin, y);
        y += 7;

        // Línea debajo del título
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;

        // ▶️ DESCRIPCIÓN
        if (lesson.description) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(...colors.textLight);
          
          const cleanDesc = sanitizeForPDF(stripMarkdown(lesson.description));
          const descLines = doc.splitTextToSize(cleanDesc, contentWidth - 5);
          
          descLines.forEach(line => {
            checkPageBreak(4);
            doc.text(line, margin + 5, y);
            y += 4;
          });
          y += 4;
        }

        // ▶️ TEORÍA/CONTENIDO
        if (lesson.theory) {
          addSection("Theory", 10, 5);
          
          const cleanTheory = sanitizeForPDF(
            stripMarkdown(smartTruncate(lesson.theory, 1800))
          );
          
          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(...colors.text);
          
          const theoryLines = doc.splitTextToSize(cleanTheory, contentWidth - 5);
          const maxLines = 60; // Limitar líneas por sección
          
          theoryLines.slice(0, maxLines).forEach(line => {
            checkPageBreak(3.5);
            doc.text(line, margin + 5, y);
            y += 3.5;
          });
          
          if (theoryLines.length > maxLines) {
            doc.setFont("helvetica", "italic");
            doc.setTextColor(...colors.textLight);
            doc.text("... (content truncated)", margin + 5, y);
            y += 4;
          }
          
          y += 5;
        }

        // ▶️ VOCABULARIO (tabla profesional)
        if (lesson.vocabulary?.entries?.length > 0) {
          checkPageBreak(30);
          addSection("Vocabulary", 10, 5);

          const vocabEntries = lesson.vocabulary.entries.slice(0, 20);
          const tableData = vocabEntries.map(entry => [
            sanitizeForPDF(entry.term || ""),
            sanitizeForPDF(entry.translation || entry.meaning || "-")
          ]);

          doc.autoTable({
            startY: y,
            head: [["Term", "Meaning"]],
            body: tableData,
            margin: { left: margin + 5, right: margin },
            styles: {
              fontSize: 8,
              cellPadding: 3,
              overflow: 'linebreak',
              lineColor: colors.border,
              lineWidth: 0.1
            },
            headStyles: {
              fillColor: colors.primary,
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              halign: 'left'
            },
            bodyStyles: {
              textColor: colors.text
            },
            columnStyles: {
              0: { cellWidth: 50, fontStyle: 'bold' },
              1: { cellWidth: 'auto' }
            },
            theme: 'grid',
            tableLineColor: colors.border,
            tableLineWidth: 0.1
          });

          y = doc.lastAutoTable.finalY + 8;
        }

        // ▶️ EJERCICIOS (resumen compacto)
        if (lesson.ejercicios?.length > 0) {
          checkPageBreak(20);
          addSection(`Exercises (${lesson.ejercicios.length})`, 10, 5);

          lesson.ejercicios.slice(0, 12).forEach((ex, exIdx) => {
            const exType = (ex.type || "interactive")
              .replace(/_/g, " ")
              .split(" ")
              .map(w => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");
            
            addBulletPoint(`Exercise ${exIdx + 1}: ${exType}`, 5);
          });

          if (lesson.ejercicios.length > 12) {
            doc.setFontSize(7);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(...colors.textLight);
            doc.text(`... and ${lesson.ejercicios.length - 12} more exercises`, margin + 10, y);
            y += 4;
          }

          y += 5;
        }

        // Separador entre lecciones
        y += 8;
        if (lessonIdx < lessons.length - 1) {
          checkPageBreak(5);
          doc.setDrawColor(...colors.border);
          doc.setLineWidth(0.1);
          doc.line(margin, y, pageWidth - margin, y);
          y += 8;
        }
      });

      // ==========================================
      // 🔚 FOOTER EN TODAS LAS PÁGINAS
      // ==========================================
      const totalPages = doc.internal.pages.length - 1;
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        doc.setPage(pageNum);
        
        // Línea superior del footer
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        
        // Número de página (centrado)
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...colors.textLight);
        doc.text(
          `Page ${pageNum} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
        
        // Fecha (izquierda)
        doc.setFontSize(7);
        doc.text(
          `Generated: ${new Date().toLocaleDateString()}`,
          margin,
          pageHeight - 10
        );
        
        // Logo pequeño (derecha)
        doc.setTextColor(...colors.primary);
        doc.setFont("helvetica", "bold");
        doc.text("Further", pageWidth - margin - 15, pageHeight - 10);
      }

      // ==========================================
      // 💾 GUARDAR PDF
      // ==========================================
      const safeCourseTitle = sanitizeForPDF(courseTitle || "Course")
        .replace(/\s+/g, "_")
        .substring(0, 30);
      
      const safeUnitTitle = sanitizeForPDF(unit.title || "Unit")
        .replace(/\s+/g, "_")
        .substring(0, 30);
      
      const filename = `${safeCourseTitle}_${safeUnitTitle}_Bibliography.pdf`;

      doc.save(filename);

      // ==========================================
      // 📊 LOGS DE RENDIMIENTO
      // ==========================================
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      const sizeKB = (doc.output('blob').size / 1024).toFixed(2);
      
      console.log(`✅ PDF generated successfully`);
      console.log(`⏱️  Time: ${duration}s`);
      console.log(`📦 Size: ${sizeKB}KB`);
      console.log(`📄 Pages: ${totalPages}`);
      
      toast.success(`📥 PDF downloaded (${sizeKB}KB)`);
      
    } catch (error) {
      console.error("❌ Error generating PDF:", error);
      console.error("Stack:", error.stack);
      toast.error("Error al generar el PDF. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={loading || !unit}
      className="relative w-full bg-white hover:bg-gray-50 border-2 border-gray-200 rounded-2xl p-5 
                 transition-all group hover:border-[#EE7203]/30 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0C212D] to-[#112C3E] 
                          flex items-center justify-center group-hover:shadow-lg transition-shadow">
            {loading ? (
              <FiLoader className="animate-spin text-[#EE7203]" size={18} />
            ) : (
              <FiDownload className="text-[#EE7203]" size={18} />
            )}
          </div>

          <div className="text-left">
            <p className="text-sm font-black text-[#0C212D]">Academic Material</p>
            <p className="text-xs text-slate-500">
              {loading ? "Generating PDF..." : "Download PDF"}
            </p>
          </div>
        </div>

        {!loading && (
          <FiChevronRight className="text-slate-400 group-hover:text-[#EE7203] group-hover:translate-x-1 transition-all" />
        )}
      </div>
    </button>
  );
}