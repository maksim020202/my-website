// Основные элементы
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileBrowser = document.getElementById('file-browser');
const playlist = document.getElementById('playlist');
const recordStopBtn = document.getElementById('record-stop-btn');
const deleteBtn = document.getElementById('delete-btn');
const mixBtn = document.getElementById('mix-btn');
const metronomeToggle = document.getElementById('metronome-toggle');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const authModal = document.getElementById('auth-modal');
const authModalTitle = document.getElementById('auth-modal-title');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const submitLogin = document.getElementById('submit-login');
const submitSignup = document.getElementById('submit-signup');
const confirmModal = document.getElementById('confirm-modal');
const confirmDelete = document.getElementById('confirm-delete');
const confirmKeep = document.getElementById('confirm-keep');
const playPauseBtn = document.getElementById('play-pause-btn');
const mainContainer = document.getElementById('main-container');
const mixerContainer = document.getElementById('mixer-container');
const previewBtn = document.getElementById('preview-btn');
const stopPreviewBtn = document.getElementById('stop-preview-btn');
const backBtn = document.getElementById('back-btn');
const exportMixBtn = document.getElementById('export-mix-btn');
const mixExportModal = document.getElementById('mix-export-modal');
const logoutBtn = document.getElementById('logout-btn');
const userMenu = document.getElementById('user-menu');
const usernameDisplay = document.getElementById('username-display');
const userAvatar = document.getElementById('user-avatar');
const userDropdown = document.querySelector('.user-dropdown');

// Состояние приложения
let tracks = [];
let selectedTracks = [];
let mediaRecorder;
let audioChunks = [];
let audioContext;
let vocalSource, beatSource;
let vocalGain, beatGain;
let vocalReverb, vocalBiquadFilter, vocalBiquadFilterLowMid, vocalBiquadFilterMid, vocalBiquadFilterHighMid, vocalBiquadFilterHigh;
let beatBiquadFilter, beatBiquadFilterLowMid, beatBiquadFilterMid, beatBiquadFilterHighMid, beatBiquadFilterHigh;
let panner;
let destinationNode;
let recorder;
let isRecording = false;
let beatBuffer = null;
let vocalBuffer = null;
let beatWaveform, vocalWaveform, beatWaveformMix;
let currentBeatSource = null;
let isPreviewPlaying = false;
let metronomeEnabled = true;
let currentUser = null;

// Настройки эффектов
let effectSettings = {
    beat: {
        volume: 1,
        eqBass: 0,
        eqLowMid: 0,
        eqMid: 0,
        eqHighMid: 0,
        eqTreble: 0,
        pan: 0,
        eqEnabled: true
    },
    vocal: {
        volume: 1,
        reverbLevel: 0.5,
        reverbDecay: 2,
        pan: 0,
        reverbEnabled: true,
        eqBass: 0,
        eqLowMid: 0,
        eqMid: 0,
        eqHighMid: 0,
        eqTreble: 0,
        eqEnabled: true
    },
    master: {
        pan: 0
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initAudioContext();
    initBeatWaveform();
    initAuth();
    initEventListeners();
    initPasswordToggle();
    initConfirmModal();
    initPlayPauseButton();
    
    // Обработчик клика вне dropdown
    document.addEventListener('click', (e) => {
        if (!userMenu.contains(e.target)) {
            userDropdown.classList.remove('show');
        }
    });
});

// Инициализация аудиоконтекста
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        setupAudioNodes();
    }
}

function setupAudioNodes() {
    vocalGain = audioContext.createGain();
    beatGain = audioContext.createGain();
    
    vocalReverb = audioContext.createConvolver();
    const vocalReverbLevel = audioContext.createGain();
    vocalReverbLevel.gain.value = effectSettings.vocal.reverbLevel;
    
    // EQ для вокала
    vocalBiquadFilter = audioContext.createBiquadFilter();
    vocalBiquadFilter.type = "lowshelf";
    vocalBiquadFilter.frequency.value = 250;
    vocalBiquadFilter.gain.value = effectSettings.vocal.eqBass;
    
    vocalBiquadFilterLowMid = audioContext.createBiquadFilter();
    vocalBiquadFilterLowMid.type = "peaking";
    vocalBiquadFilterLowMid.frequency.value = 500;
    vocalBiquadFilterLowMid.Q.value = 1;
    vocalBiquadFilterLowMid.gain.value = effectSettings.vocal.eqLowMid;
    
    vocalBiquadFilterMid = audioContext.createBiquadFilter();
    vocalBiquadFilterMid.type = "peaking";
    vocalBiquadFilterMid.frequency.value = 1500;
    vocalBiquadFilterMid.Q.value = 1;
    vocalBiquadFilterMid.gain.value = effectSettings.vocal.eqMid;
    
    vocalBiquadFilterHighMid = audioContext.createBiquadFilter();
    vocalBiquadFilterHighMid.type = "peaking";
    vocalBiquadFilterHighMid.frequency.value = 4000;
    vocalBiquadFilterHighMid.Q.value = 1;
    vocalBiquadFilterHighMid.gain.value = effectSettings.vocal.eqHighMid;
    
    vocalBiquadFilterHigh = audioContext.createBiquadFilter();
    vocalBiquadFilterHigh.type = "highshelf";
    vocalBiquadFilterHigh.frequency.value = 6000;
    vocalBiquadFilterHigh.gain.value = effectSettings.vocal.eqTreble;
    
    // EQ для бита
    beatBiquadFilter = audioContext.createBiquadFilter();
    beatBiquadFilter.type = "lowshelf";
    beatBiquadFilter.frequency.value = 250;
    beatBiquadFilter.gain.value = effectSettings.beat.eqBass;
    
    beatBiquadFilterLowMid = audioContext.createBiquadFilter();
    beatBiquadFilterLowMid.type = "peaking";
    beatBiquadFilterLowMid.frequency.value = 500;
    beatBiquadFilterLowMid.Q.value = 1;
    beatBiquadFilterLowMid.gain.value = effectSettings.beat.eqLowMid;
    
    beatBiquadFilterMid = audioContext.createBiquadFilter();
    beatBiquadFilterMid.type = "peaking";
    beatBiquadFilterMid.frequency.value = 1500;
    beatBiquadFilterMid.Q.value = 1;
    beatBiquadFilterMid.gain.value = effectSettings.beat.eqMid;
    
    beatBiquadFilterHighMid = audioContext.createBiquadFilter();
    beatBiquadFilterHighMid.type = "peaking";
    beatBiquadFilterHighMid.frequency.value = 4000;
    beatBiquadFilterHighMid.Q.value = 1;
    beatBiquadFilterHighMid.gain.value = effectSettings.beat.eqHighMid;
    
    beatBiquadFilterHigh = audioContext.createBiquadFilter();
    beatBiquadFilterHigh.type = "highshelf";
    beatBiquadFilterHigh.frequency.value = 6000;
    beatBiquadFilterHigh.gain.value = effectSettings.beat.eqTreble;
    
    panner = audioContext.createStereoPanner();
    panner.pan.value = effectSettings.master.pan;
    
    vocalGain.gain.value = effectSettings.vocal.volume;
    beatGain.gain.value = effectSettings.beat.volume;
    
    // Подключение вокала
    vocalGain.connect(vocalBiquadFilter);
    vocalBiquadFilter.connect(vocalBiquadFilterLowMid);
    vocalBiquadFilterLowMid.connect(vocalBiquadFilterMid);
    vocalBiquadFilterMid.connect(vocalBiquadFilterHighMid);
    vocalBiquadFilterHighMid.connect(vocalBiquadFilterHigh);
    vocalBiquadFilterHigh.connect(vocalReverb);
    vocalReverb.connect(vocalReverbLevel);
    vocalReverbLevel.connect(panner);
    
    // Подключение бита
    beatGain.connect(beatBiquadFilter);
    beatBiquadFilter.connect(beatBiquadFilterLowMid);
    beatBiquadFilterLowMid.connect(beatBiquadFilterMid);
    beatBiquadFilterMid.connect(beatBiquadFilterHighMid);
    beatBiquadFilterHighMid.connect(beatBiquadFilterHigh);
    beatBiquadFilterHigh.connect(panner);
    
    destinationNode = audioContext.createMediaStreamDestination();
    panner.connect(audioContext.destination);
    panner.connect(destinationNode);
    
    updateReverb();
}

// Инициализация waveform для бита
function initBeatWaveform() {
    beatWaveform = WaveSurfer.create({
        container: '#beat-waveform',
        waveColor: '#4CAF50',
        progressColor: '#45a049',
        cursorWidth: 2,
        cursorColor: '#fff',
        height: 100,
        barWidth: 2,
        interact: true,
        dragToSeek: true
    });
    
    const ghostCursor = document.createElement('div');
    ghostCursor.className = 'cursor-ghost';
    document.getElementById('beat-waveform').appendChild(ghostCursor);
    
    document.getElementById('beat-waveform').addEventListener('mousemove', (e) => {
        const rect = document.getElementById('beat-waveform').getBoundingClientRect();
        const x = e.clientX - rect.left;
        ghostCursor.style.left = `${x}px`;
    });
    
    beatWaveform.on('play', () => {
        const playBtn = document.querySelector('.track[data-type="beat"] .play-btn');
        if (playBtn) playBtn.textContent = 'Pause';
    });
    
    beatWaveform.on('pause', () => {
        const playBtn = document.querySelector('.track[data-type="beat"] .play-btn');
        if (playBtn) playBtn.textContent = 'Play';
    });
    
    beatWaveform.on('click', (position) => {
        playFromPosition(position, 'beat');
    });
}

// Инициализация аутентификации
function initAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
        
        const savedSettings = localStorage.getItem(`effectSettings_${currentUser.email}`);
        if (savedSettings) {
            effectSettings = JSON.parse(savedSettings);
        }
    }
}

// Инициализация переключателя видимости пароля
function initPasswordToggle() {
    document.querySelectorAll('.password-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

    document.querySelectorAll('.auth-link').forEach(link => {
        link.addEventListener('click', toggleAuthForm);
    });
}

// Инициализация подтверждения удаления записи
function initConfirmModal() {
    confirmDelete.addEventListener('click', () => {
        const vocalTrack = tracks.find(t => t.type === 'vocal');
        if (vocalTrack) deleteTrack(vocalTrack);
        confirmModal.style.display = 'none';
        startRecording();
    });

    confirmKeep.addEventListener('click', () => {
        confirmModal.style.display = 'none';
        startRecording();
    });
}

// Инициализация кнопки Play/Pause
function initPlayPauseButton() {
    const playIcon = playPauseBtn.querySelector('i');
    
    playPauseBtn.addEventListener('click', () => {
        if (beatWaveform.isPlaying()) {
            beatWaveform.pause();
            playIcon.classList.remove('fa-pause');
            playIcon.classList.add('fa-play');
        } else {
            stopAllPlayback();
            beatWaveform.play();
            playIcon.classList.remove('fa-play');
            playIcon.classList.add('fa-pause');
        }
    });
}

// Инициализация обработчиков событий
function initEventListeners() {
    loginBtn.addEventListener('click', showLoginModal);
    signupBtn.addEventListener('click', showSignupModal);
    
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    submitLogin.addEventListener('click', handleLogin);
    submitSignup.addEventListener('click', handleSignup);
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('active');
    });
    
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('active');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleAudioFiles(files);
        }
    });
    
    fileBrowser.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (fileInput.files.length > 0) {
            handleAudioFiles(fileInput.files);
        }
    });
    
    recordStopBtn.addEventListener('click', toggleRecording);
    
    deleteBtn.addEventListener('click', () => {
        if (selectedTracks.length === 0) return;
        
        selectedTracks.forEach(track => {
            deleteTrack(track);
        });
        
        selectedTracks = [];
    });
    
    mixBtn.addEventListener('click', showMixer);
    backBtn.addEventListener('click', () => {
        mixerContainer.style.display = 'none';
        mainContainer.style.display = 'block';
        stopAllPlayback();
    });
    
    metronomeToggle.addEventListener('change', (e) => {
        metronomeEnabled = e.target.checked;
    });
    
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        currentUser = null;
        updateAuthUI();
        location.reload();
    });
    
    // Обработчик для user dropdown
    userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        
        switch (e.key) {
            case 'Delete':
                deleteBtn.click();
                break;
            case 'r':
            case 'R':
                if (!recordStopBtn.disabled) recordStopBtn.click();
                break;
            case ' ':
                playPauseBtn.click();
                e.preventDefault();
                break;
        }
    });
}

// Переключение записи
function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

// Начало записи
function startRecording() {
    initAudioContext();
    
    const vocalTrack = tracks.find(t => t.type === 'vocal');
    if (vocalTrack) {
        confirmModal.style.display = 'block';
        return;
    }
    
    playMetronome(() => {
        if (beatBuffer) {
            currentBeatSource = audioContext.createBufferSource();
            currentBeatSource.buffer = beatBuffer;
            currentBeatSource.connect(audioContext.destination);
            currentBeatSource.start();
            
            if (beatWaveform) {
                beatWaveform.play();
                const playBtn = document.querySelector('.track[data-type="beat"] .play-btn');
                if (playBtn) playBtn.textContent = 'Pause';
            }
            
            currentBeatSource.onended = () => {
                currentBeatSource = null;
                if (beatWaveform) beatWaveform.pause();
            };
        }
        
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
                
                mediaRecorder.onstop = async () => {
                    if (currentBeatSource) {
                        currentBeatSource.stop();
                        currentBeatSource = null;
                    }
                    if (beatWaveform) beatWaveform.pause();
                    
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    
                    const arrayBuffer = await new Response(audioBlob).arrayBuffer();
                    vocalBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    
                    const track = {
                        id: Date.now() + Math.random(),
                        name: `Вокал ${new Date().toLocaleTimeString()}`,
                        url: audioUrl,
                        audio: new Audio(audioUrl),
                        type: 'vocal',
                        buffer: vocalBuffer
                    };
                    
                    tracks.push(track);
                    renderTrack(track);
                    
                    updateMixButtonState();
                };
                
                mediaRecorder.start();
                isRecording = true;
                recordStopBtn.innerHTML = '<i class="fas fa-stop"></i>';
                recordStopBtn.style.backgroundColor = '#ff9800';
                
                updateMixButtonState();
            })
            .catch(err => {
                console.error('Ошибка доступа к микрофону:', err);
                alert('Не удалось получить доступ к микрофону');
                isRecording = false;
                recordStopBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                recordStopBtn.style.backgroundColor = '#f44336';
            });
    });
}

// Остановка записи
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        isRecording = false;
        recordStopBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        recordStopBtn.style.backgroundColor = '#f44336';
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        if (currentBeatSource) {
            currentBeatSource.stop();
            currentBeatSource = null;
        }
        if (beatWaveform) beatWaveform.pause();
    }
}

// Метроном
function playMetronome(callback) {
    if (!metronomeEnabled) {
        callback();
        return;
    }
    
    const metronomeCount = 3;
    let count = 0;
    
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 800;
    
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    
    const interval = setInterval(() => {
        if (count >= metronomeCount) {
            clearInterval(interval);
            oscillator.stop();
            callback();
            return;
        }
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        count++;
    }, 500);
}

// Удаление трека
function deleteTrack(track) {
    const element = document.querySelector(`.track[data-id="${track.id}"]`);
    if (element) element.remove();
    
    const index = tracks.findIndex(t => t.id === track.id);
    if (index !== -1) {
        if (tracks[index].type === 'vocal') vocalBuffer = null;
        if (tracks[index].type === 'beat') beatBuffer = null;
        tracks.splice(index, 1);
    }
    
    updateMixButtonState();
}

// Обновление состояния кнопки сведения
function updateMixButtonState() {
    const hasBeat = tracks.some(t => t.type === 'beat');
    const hasVocal = tracks.some(t => t.type === 'vocal');
    mixBtn.disabled = !(hasBeat && hasVocal);
}

// Рендер трека в плейлист
function renderTrack(track) {
    const trackElement = document.createElement('div');
    trackElement.className = 'track';
    trackElement.dataset.id = track.id;
    trackElement.dataset.type = track.type;
    
    trackElement.innerHTML = `
        <div class="track-name">${track.name}</div>
        <div class="track-controls">
            <button class="play-btn">Play</button>
        </div>
    `;
    
    trackElement.addEventListener('mousedown', (e) => {
        if (e.ctrlKey) {
            trackElement.classList.toggle('selected');
            const index = selectedTracks.findIndex(t => t.id === track.id);
            if (index === -1) {
                selectedTracks.push(track);
            } else {
                selectedTracks.splice(index, 1);
            }
        } else {
            document.querySelectorAll('.track').forEach(t => t.classList.remove('selected'));
            trackElement.classList.add('selected');
            selectedTracks = [track];
        }
    });
    
    trackElement.querySelector('.play-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (track.type === 'beat') {
            if (beatWaveform.isPlaying()) {
                beatWaveform.pause();
                e.target.textContent = 'Play';
            } else {
                stopAllPlayback();
                beatWaveform.play();
                e.target.textContent = 'Pause';
            }
        } else if (track.type === 'vocal') {
            if (track.audio.paused) {
                stopAllPlayback();
                track.audio.play();
                e.target.textContent = 'Pause';
            } else {
                track.audio.pause();
                e.target.textContent = 'Play';
            }
        }
    });
    
    playlist.appendChild(trackElement);
}

// Воспроизведение с позиции
function playFromPosition(position, type) {
    stopAllPlayback();
    
    if (type === 'beat' && beatBuffer) {
        currentBeatSource = audioContext.createBufferSource();
        currentBeatSource.buffer = beatBuffer;
        currentBeatSource.connect(audioContext.destination);
        currentBeatSource.start(0, position * beatBuffer.duration);
        
        beatWaveform.play();
        beatWaveform.setTime(position * beatBuffer.duration);
        
        currentBeatSource.onended = () => {
            currentBeatSource = null;
            beatWaveform.pause();
        };
    }
}

// Остановка всего воспроизведения
function stopAllPlayback() {
    if (currentBeatSource) {
        currentBeatSource.stop();
        currentBeatSource = null;
    }
    
    if (beatWaveform) beatWaveform.pause();
    if (vocalWaveform) vocalWaveform.pause();
    if (beatWaveformMix) beatWaveformMix.pause();
    
    if (vocalSource) {
        vocalSource.stop();
        vocalSource = null;
    }
    
    if (beatSource) {
        beatSource.stop();
        beatSource = null;
    }
    
    document.querySelectorAll('audio').forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
    
    tracks.forEach(track => {
        if (track.audio) {
            track.audio.pause();
            track.audio.currentTime = 0;
        }
    });
    
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.textContent = 'Play';
    });
    
    document.querySelectorAll('.track-play-btn').forEach(btn => {
        btn.innerHTML = '<i class="fas fa-play"></i>';
        btn.classList.remove('playing');
    });
    
    if (playPauseBtn) {
        playPauseBtn.querySelector('i').className = 'fas fa-play';
    }
    
    isPreviewPlaying = false;
    if (previewBtn) previewBtn.style.display = 'block';
    if (stopPreviewBtn) stopPreviewBtn.style.display = 'none';
}

// Показать микшер
function showMixer() {
    mainContainer.style.display = 'none';
    mixerContainer.style.display = 'block';
    initMixer();
}

// Инициализация микшера
function initMixer() {
    vocalWaveform = WaveSurfer.create({
        container: '#vocal-waveform',
        waveColor: '#ff5722',
        progressColor: '#ff7043',
        cursorWidth: 2,
        cursorColor: '#fff',
        height: 100,
        barWidth: 2,
        interact: true,
        dragToSeek: true
    });

    beatWaveformMix = WaveSurfer.create({
        container: '#beat-waveform-mix',
        waveColor: '#2196F3',
        progressColor: '#64b5f6',
        cursorWidth: 2,
        cursorColor: '#fff',
        height: 100,
        barWidth: 2,
        interact: true,
        dragToSeek: true
    });

    const vocalTrack = tracks.find(t => t.type === 'vocal');
    const beatTrack = tracks.find(t => t.type === 'beat');
    
    if (vocalTrack) vocalWaveform.load(vocalTrack.url);
    if (beatTrack) beatWaveformMix.load(beatTrack.url);

    document.querySelectorAll('.track-play-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            const waveform = type === 'vocal' ? vocalWaveform : beatWaveformMix;
            const track = tracks.find(t => t.type === type);
            
            if (!track) return;
            
            if (waveform.isPlaying()) {
                waveform.pause();
                this.innerHTML = '<i class="fas fa-play"></i>';
                this.classList.remove('playing');
            } else {
                stopAllPlayback();
                waveform.play();
                this.innerHTML = '<i class="fas fa-pause"></i>';
                this.classList.add('playing');
                
                waveform.on('finish', () => {
                    this.innerHTML = '<i class="fas fa-play"></i>';
                    this.classList.remove('playing');
                });
            }
        });
    });

    // Инициализация переключателей эффектов
    document.getElementById('vocal-reverb').checked = effectSettings.vocal.reverbEnabled;
    document.getElementById('vocal-eq').checked = effectSettings.vocal.eqEnabled;
    document.getElementById('beat-eq').checked = effectSettings.beat.eqEnabled;

    // Обновление элементов управления эффектами
    updateEffectControls();

    document.querySelectorAll('input[type="range"]').forEach(input => {
        const valueDisplay = input.nextElementSibling;
        
        input.addEventListener('input', function() {
            if (valueDisplay) {
                valueDisplay.textContent = this.value;
            }
            
            saveEffectSettings();
            applyMixerSettings();
        });
    });

    // Обработчики для переключателей эффектов
    document.getElementById('vocal-reverb').addEventListener('change', function() {
        effectSettings.vocal.reverbEnabled = this.checked;
        saveEffectSettings();
        applyMixerSettings();
    });

    document.getElementById('vocal-eq').addEventListener('change', function() {
        effectSettings.vocal.eqEnabled = this.checked;
        saveEffectSettings();
        applyMixerSettings();
    });

    document.getElementById('beat-eq').addEventListener('change', function() {
        effectSettings.beat.eqEnabled = this.checked;
        saveEffectSettings();
        applyMixerSettings();
    });

    previewBtn.addEventListener('click', previewMix);
    stopPreviewBtn.addEventListener('click', stopAllPlayback);
    exportMixBtn.addEventListener('click', () => {
        mixExportModal.style.display = 'block';
    });
    
    document.getElementById('mix-export-wav').addEventListener('click', () => exportMix('wav'));
    document.getElementById('mix-export-mp3').addEventListener('click', () => exportMix('mp3'));
    document.getElementById('mix-export-vocal-wav').addEventListener('click', () => exportVocal('wav'));
    document.getElementById('mix-export-vocal-mp3').addEventListener('click', () => exportVocal('mp3'));
}

// Обновление элементов управления эффектами
function updateEffectControls() {
    document.getElementById('vocal-volume').value = effectSettings.vocal.volume;
    document.querySelector('.volume-value').textContent = effectSettings.vocal.volume;
    
    document.getElementById('vocal-reverb-level').value = effectSettings.vocal.reverbLevel;
    document.querySelectorAll('#vocal-reverb-params .value')[0].textContent = effectSettings.vocal.reverbLevel;
    
    document.getElementById('vocal-reverb-decay').value = effectSettings.vocal.reverbDecay;
    document.querySelectorAll('#vocal-reverb-params .value')[1].textContent = effectSettings.vocal.reverbDecay;
    
    document.getElementById('vocal-eq-bass').value = effectSettings.vocal.eqBass;
    document.querySelectorAll('#vocal-eq-params .value')[0].textContent = effectSettings.vocal.eqBass;
    
    document.getElementById('vocal-eq-lowmid').value = effectSettings.vocal.eqLowMid;
    document.querySelectorAll('#vocal-eq-params .value')[1].textContent = effectSettings.vocal.eqLowMid;
    
    document.getElementById('vocal-eq-mid').value = effectSettings.vocal.eqMid;
    document.querySelectorAll('#vocal-eq-params .value')[2].textContent = effectSettings.vocal.eqMid;
    
    document.getElementById('vocal-eq-highmid').value = effectSettings.vocal.eqHighMid;
    document.querySelectorAll('#vocal-eq-params .value')[3].textContent = effectSettings.vocal.eqHighMid;
    
    document.getElementById('vocal-eq-treble').value = effectSettings.vocal.eqTreble;
    document.querySelectorAll('#vocal-eq-params .value')[4].textContent = effectSettings.vocal.eqTreble;
    
    document.getElementById('beat-volume').value = effectSettings.beat.volume;
    document.querySelector('.volume-value').textContent = effectSettings.beat.volume;
    
    document.getElementById('eq-bass').value = effectSettings.beat.eqBass;
    document.querySelectorAll('#beat-eq-params .value')[0].textContent = effectSettings.beat.eqBass;
    
    document.getElementById('eq-lowmid').value = effectSettings.beat.eqLowMid;
    document.querySelectorAll('#beat-eq-params .value')[1].textContent = effectSettings.beat.eqLowMid;
    
    document.getElementById('eq-mid').value = effectSettings.beat.eqMid;
    document.querySelectorAll('#beat-eq-params .value')[2].textContent = effectSettings.beat.eqMid;
    
    document.getElementById('eq-highmid').value = effectSettings.beat.eqHighMid;
    document.querySelectorAll('#beat-eq-params .value')[3].textContent = effectSettings.beat.eqHighMid;
    
    document.getElementById('eq-treble').value = effectSettings.beat.eqTreble;
    document.querySelectorAll('#beat-eq-params .value')[4].textContent = effectSettings.beat.eqTreble;
    
    document.getElementById('pan-position').value = effectSettings.master.pan;
    document.querySelectorAll('.value')[5].textContent = effectSettings.master.pan;
    
    // Обновляем визуальное положение панорамы
    const panIndicator = document.getElementById('pan-indicator');
    if (panIndicator) {
        const position = (parseFloat(document.getElementById('pan-position').value) + 1) / 2 * 100;
        panIndicator.style.left = `${position}%`;
    }
}

// Сохранение настроек эффектов
function saveEffectSettings() {
    effectSettings.vocal.volume = parseFloat(document.getElementById('vocal-volume').value);
    effectSettings.vocal.reverbLevel = parseFloat(document.getElementById('vocal-reverb-level').value);
    effectSettings.vocal.reverbDecay = parseFloat(document.getElementById('vocal-reverb-decay').value);
    effectSettings.vocal.eqBass = parseFloat(document.getElementById('vocal-eq-bass').value);
    effectSettings.vocal.eqLowMid = parseFloat(document.getElementById('vocal-eq-lowmid').value);
    effectSettings.vocal.eqMid = parseFloat(document.getElementById('vocal-eq-mid').value);
    effectSettings.vocal.eqHighMid = parseFloat(document.getElementById('vocal-eq-highmid').value);
    effectSettings.vocal.eqTreble = parseFloat(document.getElementById('vocal-eq-treble').value);
    
    effectSettings.beat.volume = parseFloat(document.getElementById('beat-volume').value);
    effectSettings.beat.eqBass = parseFloat(document.getElementById('eq-bass').value);
    effectSettings.beat.eqLowMid = parseFloat(document.getElementById('eq-lowmid').value);
    effectSettings.beat.eqMid = parseFloat(document.getElementById('eq-mid').value);
    effectSettings.beat.eqHighMid = parseFloat(document.getElementById('eq-highmid').value);
    effectSettings.beat.eqTreble = parseFloat(document.getElementById('eq-treble').value);
    
    effectSettings.master.pan = parseFloat(document.getElementById('pan-position').value);
    
    if (currentUser) {
        localStorage.setItem(`effectSettings_${currentUser.email}`, JSON.stringify(effectSettings));
    }
}

// Применение настроек микшера
function applyMixerSettings() {
    vocalGain.gain.value = effectSettings.vocal.volume;
    beatGain.gain.value = effectSettings.beat.volume;
    
    // Вокал
    if (effectSettings.vocal.reverbEnabled) {
        updateReverb();
    } else {
        vocalReverb.buffer = null;
    }
    
    vocalBiquadFilter.gain.value = effectSettings.vocal.eqEnabled ? effectSettings.vocal.eqBass : 0;
    vocalBiquadFilterLowMid.gain.value = effectSettings.vocal.eqEnabled ? effectSettings.vocal.eqLowMid : 0;
    vocalBiquadFilterMid.gain.value = effectSettings.vocal.eqEnabled ? effectSettings.vocal.eqMid : 0;
    vocalBiquadFilterHighMid.gain.value = effectSettings.vocal.eqEnabled ? effectSettings.vocal.eqHighMid : 0;
    vocalBiquadFilterHigh.gain.value = effectSettings.vocal.eqEnabled ? effectSettings.vocal.eqTreble : 0;
    
    // Бит
    beatBiquadFilter.gain.value = effectSettings.beat.eqEnabled ? effectSettings.beat.eqBass : 0;
    beatBiquadFilterLowMid.gain.value = effectSettings.beat.eqEnabled ? effectSettings.beat.eqLowMid : 0;
    beatBiquadFilterMid.gain.value = effectSettings.beat.eqEnabled ? effectSettings.beat.eqMid : 0;
    beatBiquadFilterHighMid.gain.value = effectSettings.beat.eqEnabled ? effectSettings.beat.eqHighMid : 0;
    beatBiquadFilterHigh.gain.value = effectSettings.beat.eqEnabled ? effectSettings.beat.eqTreble : 0;
    
    panner.pan.value = effectSettings.master.pan;
    
    // Обновляем визуальное положение панорамы
    const panIndicator = document.getElementById('pan-indicator');
    if (panIndicator) {
        const position = (panner.pan.value + 1) / 2 * 100;
        panIndicator.style.left = `${position}%`;
    }
}

// Предпросмотр микса
function previewMix() {
    if (!audioContext) initAudioContext();
    
    stopAllPlayback();
    
    const beatTrack = tracks.find(t => t.type === 'beat');
    const vocalTrack = tracks.find(t => t.type === 'vocal');
    
    if (beatTrack && beatTrack.buffer) {
        beatSource = audioContext.createBufferSource();
        beatSource.buffer = beatTrack.buffer;
        beatSource.connect(beatGain);
        beatSource.start();
    }
    
    if (vocalTrack && vocalTrack.buffer) {
        vocalSource = audioContext.createBufferSource();
        vocalSource.buffer = vocalTrack.buffer;
        vocalSource.connect(vocalGain);
        vocalSource.start();
    }
    
    isPreviewPlaying = true;
    previewBtn.style.display = 'none';
    stopPreviewBtn.style.display = 'block';
}

// Обновление реверберации
function updateReverb() {
    const settings = effectSettings.vocal;
    const decay = settings.reverbDecay;
    const level = settings.reverbLevel;
    
    const sampleRate = audioContext.sampleRate;
    const length = sampleRate * decay;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    
    for (let i = 0; i < length; i++) {
        const n = length;
        left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2) * level;
        right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2) * level;
    }
    
    vocalReverb.buffer = impulse;
}

// Обработка аудиофайлов
function handleAudioFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('audio/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                audioContext.decodeAudioData(e.target.result)
                    .then(buffer => {
                        beatBuffer = buffer;
                        const track = {
                            id: Date.now() + Math.random(),
                            name: file.name,
                            url: URL.createObjectURL(file),
                            audio: new Audio(URL.createObjectURL(file)),
                            type: 'beat',
                            buffer: buffer
                        };
                        tracks.push(track);
                        renderTrack(track);
                        
                        if (beatWaveform) {
                            beatWaveform.load(URL.createObjectURL(file));
                        }
                        
                        updateMixButtonState();
                    })
                    .catch(err => console.error('Ошибка декодирования:', err));
            };
            reader.readAsArrayBuffer(file);
        }
    });
}

// Экспорт микса
async function exportMix(format) {
    const beatTrack = tracks.find(t => t.type === 'beat');
    const vocalTrack = tracks.find(t => t.type === 'vocal');
    
    if (!beatTrack || !vocalTrack) return;
    
    const offlineCtx = new OfflineAudioContext(
        2,
        Math.max(beatTrack.buffer.length, vocalTrack.buffer.length),
        beatTrack.buffer.sampleRate
    );
    
    const vocalGain = offlineCtx.createGain();
    vocalGain.gain.value = effectSettings.vocal.volume;
    
    const beatGain = offlineCtx.createGain();
    beatGain.gain.value = effectSettings.beat.volume;
    
    if (effectSettings.vocal.reverbEnabled) {
        const vocalReverb = offlineCtx.createConvolver();
        const reverbLevel = offlineCtx.createGain();
        reverbLevel.gain.value = effectSettings.vocal.reverbLevel;
        
        const decay = effectSettings.vocal.reverbDecay;
        const sampleRate = offlineCtx.sampleRate;
        const length = sampleRate * decay;
        const impulse = offlineCtx.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);
        
        for (let i = 0; i < length; i++) {
            const n = length;
            left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
            right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
        }
        
        vocalReverb.buffer = impulse;
        vocalGain.connect(vocalReverb);
        vocalReverb.connect(reverbLevel);
        reverbLevel.connect(offlineCtx.destination);
    } else {
        vocalGain.connect(offlineCtx.destination);
    }
    
    if (effectSettings.beat.eqEnabled) {
        const bass = offlineCtx.createBiquadFilter();
        bass.type = "lowshelf";
        bass.frequency.value = 250;
        bass.gain.value = effectSettings.beat.eqBass;
        
        const lowMid = offlineCtx.createBiquadFilter();
        lowMid.type = "peaking";
        lowMid.frequency.value = 500;
        lowMid.Q.value = 1;
        lowMid.gain.value = effectSettings.beat.eqLowMid;
        
        const mid = offlineCtx.createBiquadFilter();
        mid.type = "peaking";
        mid.frequency.value = 1500;
        mid.Q.value = 1;
        mid.gain.value = effectSettings.beat.eqMid;
        
        const highMid = offlineCtx.createBiquadFilter();
        highMid.type = "peaking";
        highMid.frequency.value = 4000;
        highMid.Q.value = 1;
        highMid.gain.value = effectSettings.beat.eqHighMid;
        
        const high = offlineCtx.createBiquadFilter();
        high.type = "highshelf";
        high.frequency.value = 6000;
        high.gain.value = effectSettings.beat.eqTreble;
        
        beatGain.connect(bass);
        bass.connect(lowMid);
        lowMid.connect(mid);
        mid.connect(highMid);
        highMid.connect(high);
        high.connect(offlineCtx.destination);
    } else {
        beatGain.connect(offlineCtx.destination);
    }
    
    const panner = offlineCtx.createStereoPanner();
    panner.pan.value = effectSettings.master.pan;
    
    const beatSource = offlineCtx.createBufferSource();
    beatSource.buffer = beatTrack.buffer;
    beatSource.connect(beatGain);
    
    const vocalSource = offlineCtx.createBufferSource();
    vocalSource.buffer = vocalTrack.buffer;
    vocalSource.connect(vocalGain);
    
    beatSource.start(0);
    vocalSource.start(0);
    
    const renderedBuffer = await offlineCtx.startRendering();
    
    exportAudio(renderedBuffer, 'mix', format);
    mixExportModal.style.display = 'none';
}

// Экспорт вокала
async function exportVocal(format) {
    const vocalTrack = tracks.find(t => t.type === 'vocal');
    if (!vocalTrack) return;
    
    const offlineCtx = new OfflineAudioContext(
        2,
        vocalTrack.buffer.length,
        vocalTrack.buffer.sampleRate
    );
    
    const vocalGain = offlineCtx.createGain();
    vocalGain.gain.value = effectSettings.vocal.volume;
    
    if (effectSettings.vocal.reverbEnabled) {
        const vocalReverb = offlineCtx.createConvolver();
        const reverbLevel = offlineCtx.createGain();
        reverbLevel.gain.value = effectSettings.vocal.reverbLevel;
        
        const decay = effectSettings.vocal.reverbDecay;
        const sampleRate = offlineCtx.sampleRate;
        const length = sampleRate * decay;
        const impulse = offlineCtx.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);
        
        for (let i = 0; i < length; i++) {
            const n = length;
            left[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
            right[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
        }
        
        vocalReverb.buffer = impulse;
        vocalGain.connect(vocalReverb);
        vocalReverb.connect(reverbLevel);
        reverbLevel.connect(offlineCtx.destination);
    } else {
        vocalGain.connect(offlineCtx.destination);
    }
    
    const vocalSource = offlineCtx.createBufferSource();
    vocalSource.buffer = vocalTrack.buffer;
    vocalSource.connect(vocalGain);
    
    vocalSource.start(0);
    
    const renderedBuffer = await offlineCtx.startRendering();
    
    exportAudio(renderedBuffer, 'vocal', format);
    mixExportModal.style.display = 'none';
}

// Экспорт аудио в файл
function exportAudio(buffer, name, format) {
    const audioData = format === 'wav' ? bufferToWav(buffer) : bufferToMp3(buffer);
    const blob = new Blob([audioData], { type: format === 'wav' ? 'audio/wav' : 'audio/mp3' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `${name}.${format}`;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// Конвертация буфера в WAV
function bufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const length = buffer.length * numChannels * 2 + 44;
    const bufferArray = new ArrayBuffer(length);
    const view = new DataView(bufferArray);
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, length - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, buffer.length * numChannels * 2, true);
    
    let offset = 44;
    for (let i = 0; i < buffer.numberOfChannels; i++) {
        const channel = buffer.getChannelData(i);
        for (let j = 0; j < channel.length; j++) {
            const sample = Math.max(-1, Math.min(1, channel[j]));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
    }
    
    return bufferArray;
}

// Конвертация буфера в MP3 (заглушка)
function bufferToMp3(buffer) {
    alert('Для экспорта в MP3 требуется дополнительная библиотека');
    return bufferToWav(buffer);
}

// Вспомогательная функция для записи строки в DataView
function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Показать модальное окно входа
function showLoginModal() {
    authModalTitle.textContent = 'Вход';
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    authModal.style.display = 'block';
}

// Показать модальное окно регистрации
function showSignupModal() {
    authModalTitle.textContent = 'Регистрация';
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    authModal.style.display = 'block';
}

// Переключение между формами входа и регистрации
function toggleAuthForm() {
    if (loginForm.style.display === 'block') {
        showSignupModal();
    } else {
        showLoginModal();
    }
}

// Обработка входа
function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!validateInput(document.getElementById('login-email'), document.getElementById('login-email-error'), 'Введите email')) return;
    if (!validateInput(document.getElementById('login-password'), document.getElementById('login-password-error'), 'Введите пароль')) return;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        updateUserLastEntry(email);
        
        updateAuthUI();
        authModal.style.display = 'none';
        alert('Вход выполнен успешно!');
    } else {
        alert('Неверный email или пароль');
    }
}

// Обновляем дату последнего входа пользователя
function updateUserLastEntry(email) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex !== -1) {
        users[userIndex].lastEntry = new Date().toISOString();
        localStorage.setItem('users', JSON.stringify(users));
        
        updateUserFile(email, { DateOfLastEntry: new Date().toISOString() });
    }
}

// Обновляем файл пользователя
function updateUserFile(email, updates) {
    const userKey = `user_${email}`;
    let userData = localStorage.getItem(userKey);
    
    if (userData) {
        const lines = userData.split('\n');
        const data = {};
        
        lines.forEach(line => {
            const [key, ...value] = line.split(': ');
            if (key && value) {
                data[key.trim()] = value.join(': ').trim();
            }
        });
        
        Object.assign(data, updates);
        
        const newContent = Object.entries(data)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
        
        localStorage.setItem(userKey, newContent);
    }
}

// Обработка регистрации
async function handleSignup() {
    const email = document.getElementById('signup-email').value;
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    
    if (!validateInput(document.getElementById('signup-email'), document.getElementById('signup-email-error'), 'Введите email')) return;
    if (!validateInput(document.getElementById('signup-username'), document.getElementById('signup-username-error'), 'Введите никнейм')) return;
    if (!validateInput(document.getElementById('signup-password'), document.getElementById('signup-password-error'), 'Введите пароль')) return;
    if (!validateInput(document.getElementById('signup-confirm'), document.getElementById('signup-confirm-error'), 'Повторите пароль')) return;
    
    if (password !== confirm) {
        document.getElementById('signup-confirm-error').textContent = 'Пароли не совпадают';
        document.getElementById('signup-confirm-error').style.display = 'block';
        document.getElementById('signup-confirm').classList.add('error');
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.some(u => u.email === email)) {
        document.getElementById('signup-email-error').textContent = 'Пользователь с таким email уже существует';
        document.getElementById('signup-email-error').style.display = 'block';
        document.getElementById('signup-email').classList.add('error');
        return;
    }
    
    const newUser = {
        email,
        username,
        password,
        lastEntry: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    await createUserFile(newUser);
    
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    updateAuthUI();
    authModal.style.display = 'none';
    alert('Регистрация успешна!');
}

// Создаем файл пользователя
async function createUserFile(user) {
    const userData = {
        Mail: user.email,
        NickName: user.username,
        Password: user.password,
        DateOfRegistration: new Date().toISOString(),
        DateOfLastEntry: new Date().toISOString()
    };
    
    const content = Object.entries(userData)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    
    localStorage.setItem(`user_${user.email}`, content);
    
    console.log('Файл пользователя создан:', content);
}

// Валидация полей ввода
function validateInput(input, errorElement, message = "Это поле обязательно") {
    if (!input.value.trim()) {
        input.classList.add('error');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        return false;
    } else {
        input.classList.remove('error');
        errorElement.style.display = 'none';
        return true;
    }
}

// Обновление UI аутентификации
function updateAuthUI() {
    if (currentUser) {
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        userMenu.style.display = 'flex';
        usernameDisplay.textContent = currentUser.username;
    } else {
        loginBtn.style.display = 'block';
        signupBtn.style.display = 'block';
        userMenu.style.display = 'none';
    }
}