(function initMessageExtrasAndConfirmUI() {
  const style = document.createElement('style');
  style.textContent = `
    .msg-meta-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      margin-top: 4px;
      font-size: 10.5px;
      opacity: 0.82;
      user-select: none;
    }
    .msg-edited-label {
      font-style: italic;
      margin-right: 2px;
    }
    .msg-read-checks {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 17px;
      height: 13px;
      flex-shrink: 0;
    }
    .msg-media-time-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    /* Диалоговое окно выбора удаления в стиле iOS 26 */
    .ios-confirm-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.72);
      z-index: 3100;
      justify-content: center;
      align-items: center;
      animation: fadeOverlayIn 0.14s ease-out;
    }
    .ios-confirm-overlay.active { display: flex; }

    .ios-confirm-card {
      width: 320px;
      background: #1e1e21;
      color: #f5f5f7;
      border-radius: 22px;
      padding: 20px 18px 16px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 26px 65px rgba(0, 0, 0, 0.88), inset 0 1px 0 rgba(255, 255, 255, 0.09);
      text-align: center;
      animation: smoothMsgFadeIn 0.18s ease-out;
    }
    .ios-confirm-title {
      font-size: 16.5px;
      font-weight: 600;
      margin-bottom: 6px;
    }
    .ios-confirm-desc {
      font-size: 13px;
      color: #8e8e93;
      margin-bottom: 18px;
      line-height: 1.38;
    }
    .ios-confirm-stack {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .ios-confirm-btn {
      width: 100%;
      padding: 11px;
      border-radius: 13px;
      border: none;
      font-size: 14.5px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.1s, background 0.15s;
    }
    .ios-confirm-btn:active { transform: scale(0.97); }
    .ios-confirm-btn.danger {
      background: rgba(255, 69, 58, 0.16);
      color: #ff453a;
    }
    .ios-confirm-btn.danger:hover {
      background: #ff453a;
      color: #ffffff;
    }
    .ios-confirm-btn.secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #f5f5f7;
    }
    .ios-confirm-btn.secondary:hover {
      background: rgba(255, 255, 255, 0.14);
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'ios-confirm-overlay';
  overlay.id = 'iosConfirmActionModal';
  overlay.innerHTML = `
    <div class="ios-confirm-card">
      <div class="ios-confirm-title" id="iosConfirmTitle">Удалить сообщение?</div>
      <div class="ios-confirm-desc" id="iosConfirmDesc">Выберите, у кого удалить выбранные сообщения.</div>
      <div class="ios-confirm-stack" id="iosConfirmButtons"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
})();

// Минималистичные скруглённые SVG-галочки (1 = доставлено, 2 = прочитано)
function getRoundedCheckSvg(isRead) {
  if (isRead) {
    return `<svg width="16" height="11" viewBox="0 0 18 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5 6.5 5 10 11.5 2.5"></polyline><polyline points="6.5 6.5 10 10 16.5 2.5"></polyline></svg>`;
  }
  return `<svg width="12" height="11" viewBox="0 0 13 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="1.5 6.5 5 10 11.5 2.5"></polyline></svg>`;
}

// Универсальное окно выбора действия (Удалить у всех / Удалить у меня / Удалить чат)
function openIosActionDialog({ title, description, buttons }) {
  const overlay = document.getElementById('iosConfirmActionModal');
  document.getElementById('iosConfirmTitle').textContent = title;
  document.getElementById('iosConfirmDesc').textContent = description;

  const btnContainer = document.getElementById('iosConfirmButtons');
  btnContainer.innerHTML = '';

  buttons.forEach(btnInfo => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `ios-confirm-btn ${btnInfo.styleClass || 'secondary'}`;
    btn.textContent = btnInfo.label;
    btn.onclick = () => {
      overlay.classList.remove('active');
      if (btnInfo.onClick) btnInfo.onClick();
    };
    btnContainer.appendChild(btn);
  });

  overlay.classList.add('active');
}
