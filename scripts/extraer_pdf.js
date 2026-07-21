const { PDFParse } = require('pdf-parse');
const fs = require('fs');
const buf = fs.readFileSync('respuesta_itagui_c14.pdf');
PDFParse(buf).then(d => {
  console.log(d.text);
}).catch(e => console.error('ERROR:', e.message));
