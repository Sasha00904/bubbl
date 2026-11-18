function createPhotoCropTool(canvas, ctx, onHistoryPush) {
  const cropBox = document.getElementById('appleCropBox');
  let isActive = false;
  let cropRect = { x: 20, y: 20, w: 150, h: 150 };
  let dragMode = null;
  let dragStart = { x: 0, y: 0 };
  let startRect = { x: 0, y: 0, w: 0, h: 0 };

  function syncDOM() {
    cropBox.style.left = `${cropRect.x}px`;
    cropBox.style.top = `${cropRect.y}px`;
    cropBox.style.width = `${cropRect.w}px`;
    cropBox.style.height = `${cropRect.h}px`;
  }

  function show() {
    isActive = true;
    const dispW = canvas.clientWidth;
    const dispH = canvas.clientHeight;
    cropRect = {
      x: Math.round(dispW * 0.1),
      y: Math.round(dispH * 0.1),
      w: Math.round(dispW * 0.8),
      h: Math.round(dispH * 0.8)
    };
    syncDOM();
    cropBox.classList.add('active');
  }

  function hide() {
    isActive = false;
    cropBox.classList.remove('active');
  }

  function apply() {
    if (!isActive) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const sx = Math.max(0, Math.round(cropRect.x * scaleX));
    const sy = Math.max(0, Math.round(cropRect.y * scaleY));
    const sw = Math.max(20, Math.round(cropRect.w * scaleX));
    const sh = Math.max(20, Math.round(cropRect.h * scaleY));

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sw;
    tempCanvas.height = sh;
    tempCanvas.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, sw, sh);

    canvas.width = sw;
    canvas.height = sh;
    ctx.drawImage(tempCanvas, 0, 0);
    hide();
    if (onHistoryPush) onHistoryPush();
  }

  cropBox.onmousedown = (e) => {
    e.stopPropagation();
    dragMode = e.target.dataset.dir || 'move';
    dragStart = { x: e.clientX, y: e.clientY };
    startRect = { ...cropRect };
  };

  window.addEventListener('mousemove', (e) => {
    if (!dragMode || !isActive) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    const maxW = canvas.clientWidth;
    const maxH = canvas.clientHeight;

    if (dragMode === 'move') {
      cropRect.x = Math.max(0, Math.min(maxW - startRect.w, startRect.x + dx));
      cropRect.y = Math.max(0, Math.min(maxH - startRect.h, startRect.y + dy));
    } else if (dragMode === 'se') {
      cropRect.w = Math.max(40, Math.min(maxW - startRect.x, startRect.w + dx));
      cropRect.h = Math.max(40, Math.min(maxH - startRect.y, startRect.h + dy));
    } else if (dragMode === 'nw') {
      const newX = Math.max(0, Math.min(startRect.x + startRect.w - 40, startRect.x + dx));
      const newY = Math.max(0, Math.min(startRect.y + startRect.h - 40, startRect.y + dy));
      cropRect.w = startRect.w + (startRect.x - newX);
      cropRect.h = startRect.h + (startRect.y - newY);
      cropRect.x = newX;
      cropRect.y = newY;
    } else if (dragMode === 'ne') {
      const newY = Math.max(0, Math.min(startRect.y + startRect.h - 40, startRect.y + dy));
      cropRect.w = Math.max(40, Math.min(maxW - startRect.x, startRect.w + dx));
      cropRect.h = startRect.h + (startRect.y - newY);
      cropRect.y = newY;
    } else if (dragMode === 'sw') {
      const newX = Math.max(0, Math.min(startRect.x + startRect.w - 40, startRect.x + dx));
      cropRect.w = startRect.w + (startRect.x - newX);
      cropRect.h = Math.max(40, Math.min(maxH - startRect.y, startRect.h + dy));
      cropRect.x = newX;
    }
    syncDOM();
  });

  window.addEventListener('mouseup', () => {
    dragMode = null;
  });

  return {
    isActive: () => isActive,
    show,
    hide,
    apply
  };
}
