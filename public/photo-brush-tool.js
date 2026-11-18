function createPhotoBrushTool(canvas, ctx, onHistoryPush) {
  const brushBar = document.getElementById('appleBrushBar');
  let isActive = false;
  let brushColor = '#ffffff';
  let brushSize = 14;
  let isDrawing = false;

  document.querySelectorAll('#appleBrushBar .brush-color-dot').forEach(dot => {
    dot.onclick = () => {
      brushColor = dot.dataset.color;
      document.querySelectorAll('#appleBrushBar .brush-color-dot').forEach(d => d.classList.remove('active'));
      dot.classList.add('active');
    };
  });

  document.getElementById('brushSizeSlider').oninput = (e) => {
    brushSize = parseInt(e.target.value, 10);
  };

  function getCoords(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
  }

  canvas.onmousedown = (e) => {
    if (!isActive) return;
    isDrawing = true;
    const pos = getCoords(e);
    const scaleFactor = canvas.width / canvas.clientWidth;
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize * scaleFactor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  canvas.onmousemove = (e) => {
    if (!isDrawing || !isActive) return;
    const pos = getCoords(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  canvas.onmouseup = () => {
    if (isDrawing) {
      isDrawing = false;
      if (onHistoryPush) onHistoryPush();
    }
  };

  return {
    isActive: () => isActive,
    enable: () => {
      isActive = true;
      brushBar.classList.add('active');
      canvas.style.cursor = 'crosshair';
    },
    disable: () => {
      isActive = false;
      brushBar.classList.remove('active');
      canvas.style.cursor = 'default';
    }
  };
}
