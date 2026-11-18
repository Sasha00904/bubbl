(function initApplePhotoEditorDOM() {
  const overlay = document.createElement('div');
  overlay.className = 'apple-ed-overlay';
  overlay.id = 'lightPhotoEditorModal';
  overlay.innerHTML = `
    <div class="apple-ed-topbar">
      <button type="button" class="apple-ed-top-btn" id="edCancelBtn">Отмена</button>
      <div class="apple-ed-title">Редактирование</div>
      <button type="button" class="apple-ed-top-btn done" id="edDoneBtn">Готово</button>
    </div>

    <div class="apple-ed-workspace">
      <div class="apple-ed-canvas-wrap" id="edCanvasWrap">
        <canvas id="photoEdCanvas"></canvas>
        <div class="apple-crop-box" id="appleCropBox">
          <div class="apple-crop-grid"></div>
          <div class="crop-handle nw" data-dir="nw"></div>
          <div class="crop-handle ne" data-dir="ne"></div>
          <div class="crop-handle sw" data-dir="sw"></div>
          <div class="crop-handle se" data-dir="se"></div>
        </div>
      </div>
    </div>

    <div class="apple-ed-bottom-dock">
      <div class="apple-brush-bar" id="appleBrushBar">
        <div class="brush-color-dot active" data-color="#ffffff" style="background: #ffffff;"></div>
        <div class="brush-color-dot" data-color="#000000" style="background: #000000; border: 1px solid #555;"></div>
        <div class="brush-color-dot" data-color="#ff453a" style="background: #ff453a;"></div>
        <div class="brush-color-dot" data-color="#ffd60a" style="background: #ffd60a;"></div>
        <div class="brush-color-dot" data-color="#32d74b" style="background: #32d74b;"></div>
        <div class="brush-color-dot" data-color="#0a84ff" style="background: #0a84ff;"></div>
        <div style="width: 1px; height: 18px; background: rgba(255,255,255,0.15);"></div>
        <input type="range" id="brushSizeSlider" min="4" max="36" value="14" style="width: 80px; accent-color: var(--accent, #65C466); cursor: pointer;">
        <button type="button" class="apple-ed-top-btn" id="brushUndoBtn" style="font-size: 12.5px; padding: 4px 10px;">Отменить</button>
      </div>

      <div class="apple-tools-capsule">
        <button type="button" class="apple-tool-pill" id="edCropToggleBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path></svg>
          <span>Обрезать</span>
        </button>
        <button type="button" class="apple-tool-pill" id="edBrushToggleBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path></svg>
          <span>Кисть</span>
        </button>
        <button type="button" class="apple-tool-pill" id="edRotateBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
          <span>Повернуть</span>
        </button>
        <button type="button" class="apple-tool-pill" id="edFlipBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
          <span>Отразить</span>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
})();

function openLightPhotoEditor(file, onEditedCallback) {
  const overlay = document.getElementById('lightPhotoEditorModal');
  const canvas = document.getElementById('photoEdCanvas');
  const ctx = canvas.getContext('2d');
  const cropBtn = document.getElementById('edCropToggleBtn');
  const brushBtn = document.getElementById('edBrushToggleBtn');

  let historyStack = new Array();

  function pushHistory() {
    historyStack.push(canvas.toDataURL('image/png'));
    if (historyStack.length > 15) historyStack.shift();
  }

  function loadImageToCanvas(imgObj) {
    canvas.width = imgObj.width;
    canvas.height = imgObj.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgObj, 0, 0);
  }

  const cropTool = createPhotoCropTool(canvas, ctx, pushHistory);
  const brushTool = createPhotoBrushTool(canvas, ctx, pushHistory);

  const workingImg = new Image();
  const reader = new FileReader();
  reader.onload = (e) => {
    workingImg.onload = () => {
      historyStack = new Array();
      cropTool.hide();
      brushTool.disable();
      cropBtn.classList.remove('active');
      brushBtn.classList.remove('active');

      loadImageToCanvas(workingImg);
      pushHistory();
      overlay.classList.add('active');
    };
    workingImg.src = e.target.result;
  };
  reader.readAsDataURL(file);

  cropBtn.onclick = () => {
    if (brushTool.isActive()) {
      brushTool.disable();
      brushBtn.classList.remove('active');
    }
    if (!cropTool.isActive()) {
      cropTool.show();
      cropBtn.classList.add('active');
    } else {
      cropTool.apply();
      cropBtn.classList.remove('active');
    }
  };

  brushBtn.onclick = () => {
    if (cropTool.isActive()) {
      cropTool.apply();
      cropBtn.classList.remove('active');
    }
    if (!brushTool.isActive()) {
      brushTool.enable();
      brushBtn.classList.add('active');
    } else {
      brushTool.disable();
      brushBtn.classList.remove('active');
    }
  };

  document.getElementById('brushUndoBtn').onclick = () => {
    if (historyStack.length <= 1) return;
    historyStack.pop();
    const undoImg = new Image();
    undoImg.onload = () => loadImageToCanvas(undoImg);
    undoImg.src = historyStack.at(-1);
  };

  document.getElementById('edRotateBtn').onclick = () => {
    cropTool.hide();
    cropBtn.classList.remove('active');
    const temp = document.createElement('canvas');
    temp.width = canvas.height;
    temp.height = canvas.width;
    const tCtx = temp.getContext('2d');
    tCtx.translate(temp.width / 2, temp.height / 2);
    tCtx.rotate(Math.PI / 2);
    tCtx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);

    canvas.width = temp.width;
    canvas.height = temp.height;
    ctx.drawImage(temp, 0, 0);
    pushHistory();
  };

  document.getElementById('edFlipBtn').onclick = () => {
    cropTool.hide();
    cropBtn.classList.remove('active');
    const temp = document.createElement('canvas');
    temp.width = canvas.width;
    temp.height = canvas.height;
    const tCtx = temp.getContext('2d');
    tCtx.translate(temp.width, 0);
    tCtx.scale(-1, 1);
    tCtx.drawImage(canvas, 0, 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(temp, 0, 0);
    pushHistory();
  };

  document.getElementById('edCancelBtn').onclick = () => {
    overlay.classList.remove('active');
  };

  document.getElementById('edDoneBtn').onclick = () => {
    if (cropTool.isActive()) cropTool.apply();
    canvas.toBlob((blob) => {
      const editedFile = new File(new Array(blob), 'edited_photo.png', { type: 'image/png' });
      const previewUrl = canvas.toDataURL('image/png');
      overlay.classList.remove('active');
      onEditedCallback(editedFile, previewUrl);
    }, 'image/png');
  };
}
