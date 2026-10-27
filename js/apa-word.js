// apa-word.js — Trabajo escrito en formato APA 7 (versión de estudiante), en Word (.docx), armado en el navegador.
// Portada con el escudo, número de página arriba a la derecha, Times New Roman 12, doble espacio,
// sangría de primera línea, títulos de nivel 1 centrados en negritas y referencias con sangría francesa.
import { zipDocx } from './docx-ites.js';

const xe = s => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// *texto* → cursivas (títulos de libros en las referencias)
const runs = (t, base = '') => String(t).split(/(\*[^*]+\*)/).filter(Boolean).map(x => {
  const it = /^\*[^*]+\*$/.test(x), txt = it ? x.slice(1, -1) : x;
  const rPr = base + (it ? '<w:i/>' : '');
  return `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ''}<w:t xml:space="preserve">${xe(txt)}</w:t></w:r>`;
}).join('');
const P = (t, { centro = false, negrita = false, sangria = false, francesa = false, salto = false } = {}) =>
  `<w:p><w:pPr>${salto ? '<w:pageBreakBefore/>' : ''}${francesa ? '<w:ind w:left="720" w:hanging="720"/>' : sangria ? '<w:ind w:firstLine="720"/>' : ''}${centro ? '<w:jc w:val="center"/>' : ''}</w:pPr>${t ? runs(t, negrita ? '<w:b/>' : '') : ''}</w:p>`;
const tamPNG = b => { try { const v = new DataView(b.buffer, b.byteOffset); return [v.getUint32(16), v.getUint32(20)]; } catch { return [400, 400]; } };

export async function descargarAPA({ titulo, autor, institucion, programa, curso, docente, fecha = new Date(), secciones = [], referencias = [], archivo = 'trabajo', logo = 'assets/escudo.png' }) {
  let img = null;
  try { const r = await fetch(logo); if (r.ok) img = new Uint8Array(await r.arrayBuffer()); } catch { img = null; }
  const c = [];
  if (img) {
    const [w, h] = tamPNG(img), cx = Math.round(3.2 * 360000), cy = Math.round(cx * h / w);
    c.push(`<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="1" name="Escudo"/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="1" name="escudo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rImg1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`);
  }
  c.push(P(''), P(''), P(titulo, { centro: true, negrita: true }), P(''));
  [autor, [programa, institucion].filter(Boolean).join(', '), curso, docente, fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })]
    .filter(Boolean).forEach(x => c.push(P(x, { centro: true })));
  c.push(P(titulo, { centro: true, negrita: true, salto: true }));
  secciones.forEach(s => {
    c.push(P(s.titulo, { centro: true, negrita: true }));
    const ps = (s.parrafos || []).map(x => String(x).trim()).filter(Boolean);
    (ps.length ? ps : ['(sin respuesta)']).forEach(x => c.push(P(x, { sangria: true })));
  });
  if (referencias.length) {
    c.push(P('Referencias', { centro: true, negrita: true, salto: true }));
    [...referencias].sort((a, b) => a.replace(/\*/g, '').localeCompare(b.replace(/\*/g, ''), 'es')).forEach(r => c.push(P(r, { francesa: true })));
  }
  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
  const sect = '<w:sectPr><w:headerReference w:type="default" r:id="rHdr"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr>';
  const documento = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${NS}><w:body>${c.join('')}${sect}</w:body></w:document>`;
  const encabezado = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr ${NS}><w:p><w:pPr><w:jc w:val="right"/></w:pPr><w:fldSimple w:instr=" PAGE "><w:r><w:t>1</w:t></w:r></w:fldSimple></w:p></w:hdr>`;
  const estilos = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="es-MX"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:before="0" w:after="0" w:line="480" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rHdr" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>${img ? '<Relationship Id="rImg1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/escudo.png"/>' : ''}</Relationships>`;
  const tipos = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/></Types>';
  const blob = zipDocx([
    ['[Content_Types].xml', tipos],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
    ['word/_rels/document.xml.rels', rels],
    ['word/document.xml', documento],
    ['word/styles.xml', estilos],
    ['word/header1.xml', encabezado],
    ...(img ? [['word/media/escudo.png', img]] : []),
  ]);
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = archivo.endsWith('.docx') ? archivo : archivo + '.docx'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
