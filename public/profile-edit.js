(function initProfileEditModalDOM() {
  if (document.getElementById('editProfileModal')) return;

  const modal = document.createElement('div');
  modal.className = 'tg-modal-overlay';
  modal.id = 'editProfileModal';
  modal.style.zIndex = '1380';
  modal.innerHTML = `
    <div class="tg-profile-card" style="padding: 0; overflow: hidden;">
      <div id="editBannerPreview" style="height: 150px; width: 100%; background: linear-gradient(180deg, #3a3b40 0%, #242528 100%); background-size: cover; background-position: center; position: relative; padding: 14px 16px;">
        <div style="display: flex; justify-content: flex-end; position: relative; z-index: 3;">
          <button type="button" class="tg-icon-btn" id="cancelEditProfileBtn" title="Закрыть" style="backdrop-filter: blur(10px); background: rgba(0,0,0,0.45);">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <button type="button" class="tg-icon-btn" id="pickEditBannerBtn" title="Изменить обложку" style="position: absolute; right: 14px; bottom: 12px; z-index: 5; backdrop-filter: blur(10px); background: rgba(0,0,0,0.45); cursor: pointer;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
        </button>
        <input type="file" id="editProfileBannerInput" accept="image/*" style="display: none;">
      </div>

      <div style="padding: 0 18px 20px;">
        <div style="text-align: center; margin: -44px 0 16px; position: relative; z-index: 4; pointer-events: none;">
          <div id="editProfileAvatarPreview" title="Изменить фото"
            style="width: 84px; height: 84px; border-radius: 50%; margin: 0 auto; background: #2c2c2e; border: 3px solid #1c1c1e; box-shadow: 0 6px 18px rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: #fff; cursor: pointer; overflow: hidden; pointer-events: auto;">
          </div>
          <input type="file" id="editProfileAvatarInput" accept="image/*" style="display: none;">
        </div>

        <div class="tg-ios-group" style="margin-bottom: 14px;">
          <div class="tg-info-row">
            <div class="tg-info-label">Имя</div>
            <input type="text" class="tg-edit-input" id="editFirstNameInput">
          </div>
          <div class="tg-info-row">
            <div class="tg-info-label">Фамилия</div>
            <input type="text" class="tg-edit-input" id="editLastNameInput">
          </div>
          <div class="tg-info-row">
            <div class="tg-info-label">О себе</div>
            <input type="text" class="tg-edit-input" id="editBioInput" placeholder="Пару слов о себе...">
          </div>
          <div class="tg-info-row">
            <div class="tg-info-label">Имя пользователя</div>
            <input type="text" class="tg-edit-input" id="editUsernameInput" style="color: var(--accent, #65C466);">
          </div>
        </div>

        <div id="editProfileErrorMsg" style="color: #ff453a; font-size: 13px; text-align: center; min-height: 18px; margin-bottom: 8px;"></div>
        <button type="button" class="tg-save-btn" id="saveEditedProfileBtn">Готово</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
  document.getElementById('cancelEditProfileBtn').onclick = () => modal.classList.remove('active');

  document.getElementById('pickEditBannerBtn').onclick = (e) => {
    e.stopPropagation();
    document.getElementById('editProfileBannerInput').click();
  };

  document.getElementById('editProfileAvatarPreview').onclick = (e) => {
    e.stopPropagation();
    document.getElementById('editProfileAvatarInput').click();
  };
})();

function openProfileEditModal(userObj, onSaveCallback) {
  const modal = document.getElementById('editProfileModal');
  if (!modal || !userObj) return;

  let selectedAvatarBlob = null;
  let selectedBannerFile = null;

  const bannerPreviewEl = document.getElementById('editBannerPreview');
  const bannerInput = document.getElementById('editProfileBannerInput');
  const previewEl = document.getElementById('editProfileAvatarPreview');
  const fileInput = document.getElementById('editProfileAvatarInput');
  const firstNameInp = document.getElementById('editFirstNameInput');
  const lastNameInp = document.getElementById('editLastNameInput');
  const bioInp = document.getElementById('editBioInput');
  const usernameInp = document.getElementById('editUsernameInput');
  const errEl = document.getElementById('editProfileErrorMsg');
  const saveBtn = document.getElementById('saveEditedProfileBtn');

  if (userObj.bannerUrl) {
    bannerPreviewEl.style.backgroundImage = `url('${userObj.bannerUrl}')`;
  } else {
    bannerPreviewEl.style.backgroundImage = 'linear-gradient(180deg, #3a3b40 0%, #242528 100%)';
  }

  previewEl.innerHTML = userObj.avatarUrl
    ? `<img src="${userObj.avatarUrl}" style="width:100%; height:100%; object-fit:cover;">`
    : userObj.firstName.at(0).toUpperCase();

  firstNameInp.value = userObj.firstName || '';
  lastNameInp.value = userObj.lastName || '';
  bioInp.value = userObj.bio || '';
  usernameInp.value = userObj.username || '';
  errEl.textContent = '';
  fileInput.value = '';
  bannerInput.value = '';

  bannerInput.onchange = (e) => {
    const file = e.target.files.item(0);
    if (!file) return;
    selectedBannerFile = file;
    const url = URL.createObjectURL(file);
    bannerPreviewEl.style.backgroundImage = `url('${url}')`;
  };

  fileInput.onchange = (e) => {
    const file = e.target.files.item(0);
    if (!file) return;
    if (typeof openAvatarCropper === 'function') {
      openAvatarCropper(file, (croppedFile, previewUrl) => {
        selectedAvatarBlob = croppedFile;
        previewEl.innerHTML = `<img src="${previewUrl}" style="width:100%; height:100%; object-fit:cover;">`;
      });
    } else {
      selectedAvatarBlob = file;
      const url = URL.createObjectURL(file);
      previewEl.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:cover;">`;
    }
  };

  saveBtn.onclick = async () => {
    const firstName = firstNameInp.value.trim();
    const lastName = lastNameInp.value.trim();
    const bio = bioInp.value.trim();
    const username = usernameInp.value.trim();

    if (!firstName || !username) {
      errEl.textContent = 'Имя и @username обязательны';
      return;
    }

    saveBtn.disabled = true;
    errEl.textContent = '';

    const formData = new FormData();
    formData.append('userId', userObj.id);
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('bio', bio);
    formData.append('username', username);
    if (selectedAvatarBlob) {
      formData.append('avatar', selectedAvatarBlob, 'avatar.png');
    }
    if (selectedBannerFile) {
      formData.append('banner', selectedBannerFile, selectedBannerFile.name || 'banner.png');
    }

    try {
      const res = await fetch('/api/users/update', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        errEl.textContent = data.error || 'Не удалось сохранить изменения';
      } else {
        modal.classList.remove('active');
        if (typeof onSaveCallback === 'function') onSaveCallback(data.user);
      }
    } catch (err) {
      errEl.textContent = 'Ошибка соединения с сервером';
    } finally {
      saveBtn.disabled = false;
    }
  };

  modal.classList.add('active');
}
