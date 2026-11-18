function initMediaAndVoice(onSendMediaCallback) {
  const attachBtn = document.getElementById('attachMediaBtn');
  const fileInput = document.getElementById('mediaFileInput');
  const voiceBtn = document.getElementById('voiceRecordBtn');
  const recordingBar = document.getElementById('recordingBar');
  const recTimerText = document.getElementById('recTimerText');
  const recLiveWaveform = document.getElementById('recLiveWaveform');
  const cancelRecBtn = document.getElementById('cancelRecBtn');
  const textInput = document.getElementById('input');
  const sendTextBtn = document.getElementById('sendTextBtn');
  const chatForm = document.getElementById('form');

  if (!attachBtn || !fileInput) return;

  if (cancelRecBtn) cancelRecBtn.remove();

  const micSvgHtml = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>`;
  const cancelCrossSvgHtml = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f5f5f7" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

  function autoResizeTextarea() {
    if (!textInput) return;
    textInput.style.height = 'auto';
    textInput.style.height = `${Math.min(textInput.scrollHeight, 120)}px`;
  }

  if (textInput) {
    textInput.addEventListener('input', autoResizeTextarea);
  }

  async function uploadFileToServer(fileBlob, filename) {
    const formData = new FormData();
    formData.append('media', fileBlob, filename);
    const res = await fetch('/api/upload', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Ошибка загрузки');
    const data = await res.json();
    return data.fileUrl || data.url;
  }

  attachBtn.onclick = () => {
    if (!activeChat) return;
    fileInput.click();
  };

  fileInput.onchange = async () => {
    const file = fileInput.files.item(0);
    fileInput.value = '';
    if (!file || !activeChat) return;

    const isVideo = file.type.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';

    if (typeof openMediaPreviewModal === 'function') {
      openMediaPreviewModal(file, mediaType, async (finalFile, captionText) => {
        try {
          const uploadedUrl = await uploadFileToServer(finalFile, finalFile.name || 'media.png');
          onSendMediaCallback(uploadedUrl, mediaType, captionText);
        } catch (err) {
          alert('Не удалось отправить файл');
        }
      });
    } else {
      const uploadedUrl = await uploadFileToServer(file, file.name);
      onSendMediaCallback(uploadedUrl, mediaType, '');
    }
  };

  let mediaRecorder = null;
  let audioChunks = new Array();
  let recInterval = null;
  let waveSampleInterval = null;
  let audioCtx = null;
  let recordedSamples = new Array();
  let recSeconds = 0;
  let isRecording = false;
  let isCancelled = false;

  function buildNormalizedWaveform(samples, targetBars = 34) {
    if (!samples || samples.length === 0) {
      return Array.from({ length: targetBars }, () => 5);
    }
    const maxSample = Math.max(...samples, 0.08);
    const result = new Array();
    const step = samples.length / targetBars;

    for (let i = 0; i < targetBars; i++) {
      const start = Math.floor(i * step);
      const end = Math.max(start + 1, Math.floor((i + 1) * step));
      let peak = 0;
      for (let j = start; j < end && j < samples.length; j++) {
        if (samples[j] > peak) peak = samples[j];
      }
      const normalized = peak / maxSample;
      const heightPx = Math.round(4 + Math.pow(normalized, 0.85) * 20);
      result.push(heightPx);
    }
    return result;
  }

  function resetVoiceUI() {
    isRecording = false;
    clearInterval(recInterval);
    clearInterval(waveSampleInterval);
    if (audioCtx) {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
    if (recordingBar) recordingBar.classList.remove('active');
    if (textInput) textInput.style.display = 'block';
    if (attachBtn) attachBtn.style.display = 'flex';
    if (voiceBtn) {
      voiceBtn.classList.remove('recording-active');
      voiceBtn.innerHTML = micSvgHtml;
      voiceBtn.title = 'Записать голосовое сообщение';
    }
  }

  function finishAndSendVoice() {
    if (!isRecording || !mediaRecorder) return;
    isCancelled = false;
    mediaRecorder.stop();
    resetVoiceUI();
  }

  function cancelVoiceRecording() {
    if (!isRecording || !mediaRecorder) return;
    isCancelled = true;
    mediaRecorder.stop();
    resetVoiceUI();
  }

  if (voiceBtn) {
    voiceBtn.onclick = async () => {
      if (!activeChat) return;

      if (isRecording) {
        cancelVoiceRecording();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = new Array();
        recordedSamples = new Array();
        isCancelled = false;
        isRecording = true;
        recSeconds = 0;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const liveBarsCount = 28;
        if (recLiveWaveform) {
          recLiveWaveform.innerHTML = Array.from({ length: liveBarsCount }, () =>
            `<span style="height: 4px; animation: none; transition: height 0.06s ease-out;"></span>`
          ).join('');
        }

        waveSampleInterval = setInterval(() => {
          analyser.getByteTimeDomainData(dataArray);
          let maxDeviation = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const dev = Math.abs(dataArray[i] - 128) / 128;
            if (dev > maxDeviation) maxDeviation = dev;
          }
          const level = Math.min(1, maxDeviation * 3.5);
          recordedSamples.push(level);

          if (recLiveWaveform) {
            const spans = recLiveWaveform.querySelectorAll('span');
            const recent = recordedSamples.slice(-liveBarsCount);
            spans.forEach((span, idx) => {
              const sampleIdx = idx - (liveBarsCount - recent.length);
              const val = sampleIdx >= 0 ? recent[sampleIdx] : 0;
              span.style.height = `${Math.round(4 + val * 18)}px`;
            });
          }
        }, 55);

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          if (isCancelled || audioChunks.length === 0) return;

          const finalWaveform = buildNormalizedWaveform(recordedSamples, 34);
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          try {
            const uploadedUrl = await uploadFileToServer(audioBlob, `voice_${Date.now()}.webm`);
            const wfEncoded = finalWaveform.join(',');
            onSendMediaCallback(`${uploadedUrl}#wf=${wfEncoded}`, 'audio', '');
          } catch (err) {
            alert('Не удалось отправить голосовое сообщение');
          }
        };

        mediaRecorder.start();
        if (textInput) textInput.style.display = 'none';
        if (attachBtn) attachBtn.style.display = 'none';
        if (recordingBar) recordingBar.classList.add('active');

        voiceBtn.classList.add('recording-active');
        voiceBtn.innerHTML = cancelCrossSvgHtml;
        voiceBtn.title = 'Отменить запись';

        if (recTimerText) recTimerText.textContent = '0:00';
        recInterval = setInterval(() => {
          recSeconds += 1;
          const m = Math.floor(recSeconds / 60);
          const s = recSeconds % 60;
          if (recTimerText) recTimerText.textContent = `${m}:${s < 10 ? '0' : ''}${s}`;
        }, 1000);
      } catch (err) {
        alert('Нет доступа к микрофону');
        resetVoiceUI();
      }
    };
  }

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      if (isRecording) {
        e.preventDefault();
        e.stopImmediatePropagation();
        finishAndSendVoice();
        return;
      }
      setTimeout(() => {
        if (textInput) textInput.style.height = 'auto';
      }, 0);
    }, true);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        setTimeout(autoResizeTextarea, 0);
        return;
      }

      const settings = typeof getAppSettings === 'function' ? getAppSettings() : { sendOnEnter: true };

      if (!settings.sendOnEnter) {
        setTimeout(autoResizeTextarea, 0);
        return;
      }

      if (isRecording) {
        e.preventDefault();
        finishAndSendVoice();
      } else if (document.activeElement === textInput && sendTextBtn) {
        e.preventDefault();
        sendTextBtn.click();
      }
    }
  });
}
