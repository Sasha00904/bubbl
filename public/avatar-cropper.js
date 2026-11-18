(function initAvatarCropperDOM() {
  if (document.getElementById('avatarCropperModal')) return;

  const style = document.createElement('style');
  style.textContent = `
    .bubbl-crop-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.78);
      z-index: 2200;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .bubbl-crop-overlay.active {
      display: flex;
    }
    .bubbl-crop-card {
      width: 340px;
      max-width: 100%;
      background: #1c1c1e;
      color: #f5f5f7;
      border-radius: 26px;
      padding: 20px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.09);
      box-shadow: 0 28px 75px rgba(0, 0, 0, 0.88), inset 0 1px 0 rgba(255, 255, 255, 0.12);
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.className = 'bubbl-crop-overlay';
  modal.id = 'avatarCropperModal';
  modal.innerHTML = `
    <div class="bubbl-crop-card">
      <div style="font-size: 17px; font-weight: 700; margin-bottom: 4px;">Фото профиля</div>
      <div style="font-size: 12.5px; color: #8e8e93; margin-bottom: 14px;">Перетащите и выберите масштаб</div>

      <div id="cropperStage" style="width: 240px; height: 240px; margin: 0 auto 14px; border-radius: 22px; overflow: hidden; position: relative; background: #2c2c2e; cursor: grab; touch-action: none; user-select: none;">
        <canvas id="avatarCropCanvas" width="240" height="240" style="display: block; width: 240px; height: 240px; touch-action: none;"></canvas>
      </div>

      <div style="display: flex; align-items: center; gap: 10px; padding: 0 8px; margin-bottom: 18px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
        <input type="range" id="cropZoomSlider" min="1" max="3" step="0.02" value="1" style="flex: 1; accent-color: var(--accent, #65C466); cursor: pointer;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
      </div>

      <div style="display: flex; gap: 10px;">
        <button type="button" id="cancelCropBtn" style="flex: 1; padding: 11px; border-radius: 13px; border: none; background: #2c2c2e; color: #f5f5f7; font-size: 14.5px; font-weight: 600; cursor: pointer;">Отмена</button>
        <button type="button" id="applyCropBtn" style="flex: 1; padding: 11px; border-radius: 13px; border: none; background: var(--accent, #65C466); color: #ffffff; font-size: 14.5px; font-weight: 600; cursor: pointer;">Применить</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
})();

function openAvatarCropper(file, onApplyCallback) {
  const modal = document.getElementById('avatarCropperModal');
  const canvas = document.getElementById('avatarCropCanvas');
  const slider = document.getElementById('cropZoomSlider');
  if (!modal || !canvas) return;

  const ctx = canvas.getContext('2d');
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);

  let scale = 1;
  let baseScale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;
  let startX = 0;
  let startY = 0;

  function draw() {
    const size = 240;
    ctx.clearRect(0, 0, size, size);

    const drawW = img.width * baseScale * scale;
    const drawH = img.height * baseScale * scale;

    const maxOffsetX = Math.max(0, (drawW - size) / 2);
    const maxOffsetY = Math.max(0, (drawH - size) / 2);
    offsetX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX));
    offsetY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY));

    const x = (size - drawW) / 2 + offsetX;
    const y = (size - drawH) / 2 + offsetY;

    ctx.drawImage(img, x, y, drawW, drawH);

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.52)';
    ctx.beginPath();
    ctx.rect(0, 0, size, size);
    ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2, true);
    ctx.fill();
    ctx.restore();
  }

  img.onload = () => {
    const size = 240;
    baseScale = Math.max(size / img.width, size / img.height);
    scale = 1;
    offsetX = 0;
    offsetY = 0;
    slider.value = '1';
    draw();
    modal.classList.add('active');
  };
  img.src = objectUrl;

  slider.oninput = () => {
    scale = parseFloat(slider.value) || 1;
    draw();
  };

  function startDrag(clientX, clientY) {
    isDragging = true;
    startX = clientX - offsetX;
    startY = clientY - offsetY;
    canvas.style.cursor = 'grabbing';
  }

  function moveDrag(clientX, clientY) {
    if (!isDragging) return;
    offsetX = clientX - startX;
    offsetY = clientY - startY;
    draw();
  }

  function endDrag() {
    isDragging = false;
    canvas.style.cursor = 'grab';
  }

  canvas.onmousedown = (e) => startDrag(e.clientX, e.clientY);
  window.onmousemove = (e) => moveDrag(e.clientX, e.clientY);
  window.onmouseup = endDrag;

  canvas.ontouchstart = (e) => {
    if (e.touches.length === 1) {
      e.preventDefault();
      const t = e.touches.item(0);
      startDrag(t.clientX, t.clientY);
    }
  };
  canvas.ontouchmove = (e) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault();
      const t = e.touches.item(0);
      moveDrag(t.clientX, t.clientY);
    }
  };
  canvas.ontouchend = endDrag;
  canvas.ontouchcancel = endDrag;

  document.getElementById('cancelCropBtn').onclick = () => {
    modal.classList.remove('active');
    URL.revokeObjectURL(objectUrl);
  };

  document.getElementById('applyCropBtn').onclick = () => {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = 400;
    outCanvas.height = 400;
    const outCtx = outCanvas.getContext('2d');

    const ratio = 400 / 240;
    const drawW = img.width * baseScale * scale * ratio;
    const drawH = img.height * baseScale * scale * ratio;
    const x = (400 - drawW) / 2 + offsetX * ratio;
    const y = (400 - drawH) / 2 + offsetY * ratio;

    outCtx.drawImage(img, x, y, drawW, drawH);

    outCanvas.toBlob((blob) => {
      modal.classList.remove('active');
      URL.revokeObjectURL(objectUrl);
      if (blob && typeof onApplyCallback === 'function') {
        const previewUrl = URL.createObjectURL(blob);
        onApplyCallback(blob, previewUrl);
      }
    }, 'image/png');
  };
}
