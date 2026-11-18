(function initMediaPreviewModalUI() {
  const style = document.createElement('style');
  style.textContent = `
    .media-send-overlay {
      display: none; position: fixed; inset: 0; background: rgba(0, 0, 0, 0.75);
      z-index: 2600; justify-content: center; align-items: center;
      animation: fadeOverlayIn 0.15s ease-out;
    }
    .media-send-overlay.active { display: flex; }

    .media-send-card {
      width: 400px; max-width: 92vw; background: #1c1c1e; color: #f5f5f7;
      border-radius: 24px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.88), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      animation: smoothMsgFadeIn 0.2s ease-out;
    }
    .media-send-header {
      font-size: 16.5px; font-weight: 600; margin-bottom: 14px;
      display: flex; align-items: center; justify-content: space-between;
    }
    .media-preview-stage {
      width: 100%; max-height: 270px; background: #0e0e10; border-radius: 16px;
      overflow: hidden; display: flex; align-items: center; justify-content: center;
      position: relative; cursor: pointer; border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .media-preview-stage img, .media-preview-stage video {
      max-width: 100%; max-height: 270px; display: block; object-fit: contain;
    }
    .media-edit-hint {
      font-size: 12px; color: #8e8e93; margin: 9px 0 16px; text-align: center;
    }
    .media-caption-box {
      margin-bottom: 18px;
    }
    .media-caption-label {
      font-size: 11.5px; color: var(--accent, #65C466); font-weight: 500; margin-bottom: 4px;
    }
    .media-caption-input {
      width: 100%; background: transparent; border: none;
      border-bottom: 1.5px solid var(--accent, #65C466);
      color: #ffffff; font-size: 14.5px; padding: 6px 2px; outline: none;
    }
    .media-send-actions {
      display: flex; justify-content: flex-end; gap: 10px;
    }
    .media-btn-text {
      background: transparent; border: none; color: var(--accent, #65C466);
      font-size: 14.5px; font-weight: 600; padding: 8px 16px; border-radius: 11px;
      cursor: pointer; transition: background 0.15s;
    }
    .media-btn-text:hover { background: rgba(255, 255, 255, 0.08); }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'media-send-overlay';
  overlay.id = 'mediaPreviewSendModal';
  overlay.innerHTML = `
    <div class="media-send-card">
      <div class="media-send-header">
        <span id="mediaModalTitle">Отправить фото</span>
        <button type="button" class="tg-icon-btn" id="closeMediaSendBtn">✕</button>
      </div>
      <div class="media-preview-stage" id="mediaPreviewStage"></div>
      <div class="media-edit-hint" id="mediaEditHint">Нажмите на фото, чтобы открыть редактор</div>

      <div class="media-caption-box">
        <div class="media-caption-label">Подпись</div>
        <input type="text" class="media-caption-input" id="mediaCaptionInput" placeholder="Добавить подпись..." autocomplete="off">
      </div>

      <div class="media-send-actions">
        <button type="button" class="media-btn-text" id="cancelMediaSendBtn" style="color: #8e8e93;">Отмена</button>
        <button type="button" class="media-btn-text" id="confirmMediaSendBtn">Отправить</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
})();

function openMediaPreviewModal(initialFile, onConfirmSend) {
  const overlay = document.getElementById('mediaPreviewSendModal');
  const stage = document.getElementById('mediaPreviewStage');
  const hintEl = document.getElementById('mediaEditHint');
  const titleEl = document.getElementById('mediaModalTitle');
  const captionInput = document.getElementById('mediaCaptionInput');

  let currentFile = initialFile;
  const isVideo = initialFile.type.startsWith('video/');

  titleEl.textContent = isVideo ? 'Отправить видео' : 'Отправить фото';
  hintEl.style.display = isVideo ? 'none' : 'block';
  captionInput.value = '';

  function renderPreview(fileObj) {
    const url = URL.createObjectURL(fileObj);
    if (isVideo) {
      stage.innerHTML = `<video src="${url}" controls></video>`;
      stage.onclick = null;
    } else {
      stage.innerHTML = `<img src="${url}" alt="preview">`;
      stage.onclick = () => {
        if (typeof openLightPhotoEditor === 'function') {
          openLightPhotoEditor(currentFile, (editedFile) => {
            currentFile = editedFile;
            renderPreview(editedFile);
          });
        }
      };
    }
  }

  renderPreview(currentFile);
  overlay.classList.add('active');
  setTimeout(() => captionInput.focus(), 50);

  const closeModal = () => overlay.classList.remove('active');
  document.getElementById('closeMediaSendBtn').onclick = closeModal;
  document.getElementById('cancelMediaSendBtn').onclick = closeModal;

  document.getElementById('confirmMediaSendBtn').onclick = () => {
    const caption = captionInput.value.trim();
    closeModal();
    onConfirmSend(currentFile, caption);
  };
}
