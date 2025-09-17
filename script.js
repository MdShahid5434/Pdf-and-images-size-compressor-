// Shared Utilities
function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
function highlight(el, on = true) {
  el.classList.toggle('highlight', on);
}
function downloadBlob(data, filename, mime) {
  const blob = new Blob([data], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ------- PDF Compression Setup -------
const pdfDrop = document.getElementById('pdf-drop');
const pdfInput = document.getElementById('pdf-input');
const pdfSelect = document.getElementById('pdf-file-select');
const pdfList = document.getElementById('pdf-list');
const pdfBtn = document.getElementById('pdf-compress-btn');
let pdfFiles = [];

['dragenter','dragover','dragleave','drop'].forEach(evt => {
  pdfDrop.addEventListener(evt, preventDefaults);
});
['dragenter','dragover'].forEach(evt => pdfDrop.addEventListener(evt, () => highlight(pdfDrop, true)));
['dragleave','drop'].forEach(evt => pdfDrop.addEventListener(evt, () => highlight(pdfDrop, false)));
pdfDrop.addEventListener('drop', e => handleFiles(e.dataTransfer.files, 'pdf'));
pdfSelect.onclick = () => pdfInput.click();
pdfInput.onchange = e => handleFiles(e.target.files, 'pdf');

function handleFiles(selected, type) {
  const dest = type === 'pdf' ? pdfFiles : imgFiles;
  const listEl = type === 'pdf' ? pdfList : imgList;
  const btn = type === 'pdf' ? pdfBtn : imgBtn;

  for (const file of selected) {
    if (type === 'pdf' && file.type === 'application/pdf') dest.push(file);
    if (type === 'img' && file.type.startsWith('image/')) dest.push(file);
  }
  listEl.innerHTML = '';
  dest.forEach((f, i) => {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.innerHTML = `<span>${f.name} (${(f.size/1024).toFixed(1)} KB)</span>
      <button onclick="removeFile(${i}, '${type}')">Remove</button>`;
    listEl.appendChild(div);
  });
  btn.disabled = !dest.length;
}

function removeFile(idx, type) {
  if (type === 'pdf') pdfFiles.splice(idx,1), handleFiles([], 'pdf');
  else imgFiles.splice(idx,1), handleFiles([], 'img');
}

// ------- Image Compression Setup -------
const imgDrop = document.getElementById('img-drop');
const imgInput = document.getElementById('img-input');
const imgSelect = document.getElementById('img-file-select');
const imgList = document.getElementById('img-list');
const imgBtn = document.getElementById('img-compress-btn');
let imgFiles = [];

['dragenter','dragover','dragleave','drop'].forEach(evt => {
  imgDrop.addEventListener(evt, preventDefaults);
});
['dragenter','dragover'].forEach(evt => imgDrop.addEventListener(evt, () => highlight(imgDrop, true)));
['dragleave','drop'].forEach(evt => imgDrop.addEventListener(evt, () => highlight(imgDrop, false)));
imgDrop.addEventListener('drop', e => handleFiles(e.dataTransfer.files, 'img'));
imgSelect.onclick = () => imgInput.click();
imgInput.onchange = e => handleFiles(e.target.files, 'img');

// ------- Compression Actions -------
pdfBtn.addEventListener('click', async () => {
  pdfBtn.textContent = 'Compressing...';
  for (const file of pdfFiles) {
    const buf = await file.arrayBuffer();
    const doc = await PDFLib.PDFDocument.load(buf);
    const bytes = await doc.save({ useObjectStreams: true, compress: true });
    downloadBlob(bytes, `compressed_${file.name}`, 'application/pdf');
  }
  pdfBtn.textContent = 'Compress PDFs';
});

imgBtn.addEventListener('click', async () => {
  imgBtn.textContent = 'Compressing...';
  const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
  for (const file of imgFiles) {
    try {
      const compressedBlob = await imageCompression(file, options);
      downloadBlob(compressedBlob, `compressed_${file.name}`, compressedBlob.type);
    } catch (err) {
      console.error('Image compression error:', err);
    }
  }
  imgBtn.textContent = 'Compress Images';
});