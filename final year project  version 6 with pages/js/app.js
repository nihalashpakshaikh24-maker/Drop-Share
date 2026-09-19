// ============================================
// CONFIG
// ============================================
const CHUNK_SIZE = 64 * 1024;           // 64KB per chunk
const BUFFER_THRESHOLD = 512 * 1024;    // Pause if buffer > 512KB
const BUFFER_LOW_MARK = 128 * 1024;     // Resume when buffer < 128KB

// ============================================
// STATE
// ============================================
let currentConnection = null;
let incomingFile = null;
let connectedPeer = null;
let myName = localStorage.getItem('dropshare-name') || '';

// ============================================
// DOM
// ============================================
const myIdDiv           = document.getElementById('myId');
const nameInput         = document.getElementById('nameInput');
const saveNameBtn       = document.getElementById('saveNameBtn');
const copyIdBtn         = document.getElementById('copyIdBtn');
const copyLinkBtn       = document.getElementById('copyLinkBtn');
const peerIdInput       = document.getElementById('peerIdInput');
const connectBtn        = document.getElementById('connectBtn');
const disconnectBtn     = document.getElementById('disconnectBtn');
const statusDiv         = document.getElementById('status');
const qrcodeDiv         = document.getElementById('qrcode');
const connectionBar     = document.getElementById('connectionBar');
const connectionText    = document.getElementById('connectionText');
const connectionSub     = document.getElementById('connectionSub');
const discoveryScreen   = document.getElementById('discoveryScreen');
const transferScreen    = document.getElementById('transferScreen');

const photoOption = document.getElementById('photoOption');
const videoOption = document.getElementById('videoOption');
const fileOption  = document.getElementById('fileOption');
const photoInput  = document.getElementById('photoInput');
const videoInput  = document.getElementById('videoInput');
const fileInput   = document.getElementById('fileInput');

const progressContainer = document.getElementById('progressContainer');
const progressBar       = document.getElementById('progressBar');
const progressPercent   = document.getElementById('progressPercent');
const progressLabel     = document.getElementById('progressLabel');
const progressSpeed     = document.getElementById('progressSpeed');

// Menu
const hamburgerBtn   = document.getElementById('hamburgerBtn');
const menuBackdrop   = document.getElementById('menuBackdrop');
const menuPanel      = document.getElementById('menuPanel');
const menuCloseBtn   = document.getElementById('menuCloseBtn');
const menuNav        = document.getElementById('menuNav');
const menuSections   = document.querySelectorAll('.menu-section');
const menuBrand      = document.getElementById('menuBrand');
const menuBackBtn    = document.getElementById('menuBackBtn');

// ============================================
// NAME MANAGEMENT
// ============================================
if (myName) nameInput.value = myName;

saveNameBtn.addEventListener('click', () => {
    const val = nameInput.value.trim();
    if (!val) { alert('Please enter a name.'); return; }
    myName = val;
    localStorage.setItem('dropshare-name', myName);
    saveNameBtn.textContent = 'Saved';
    statusDiv.textContent = `Your name is set to "${myName}".`;
    setTimeout(() => { saveNameBtn.textContent = 'Save Name'; }, 1400);
});

// ============================================
// PEER
// ============================================
// ============================================
// PEER CONFIG (fixes hotspot / double-NAT)
// ============================================
const peerConfig = {
    debug: 2,
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            {
                urls: 'turn:openrelay.metered.ca:80',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            },
            {
                urls: 'turn:openrelay.metered.ca:443',
                username: 'openrelayproject',
                credential: 'openrelayproject'
            }
        ],
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
    }
};

const peer = new Peer(peerConfig);

// ============================================
// DEVICE INFO
// ============================================
function getDeviceInfo() {
    const ua = navigator.userAgent;
    let os = 'Unknown';
    let type = 'Desktop';

    if (/Android/i.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
    else if (/Windows/i.test(ua)) os = 'Windows';
    else if (/Mac/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';

    if (/iPad|Tablet/i.test(ua)) type = 'Tablet';
    else if (/Mobile/i.test(ua)) type = 'Mobile';

    return `${os} · ${type}`;
}

// ============================================
// PEER EVENTS
// ============================================
peer.on('open', (id) => {
    myIdDiv.textContent = id;

    if (!currentConnection || !currentConnection.open) {
        statusDiv.textContent = 'Online — share your QR or link to begin.';
    }

    const shareUrl = window.location.origin + window.location.pathname + '?connect=' + id;

    qrcodeDiv.innerHTML = '';
    new QRCode(qrcodeDiv, {
        text: shareUrl,
        width: 160,
        height: 160,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });

    copyLinkBtn.dataset.url = shareUrl;

    const params = new URLSearchParams(window.location.search);
    const autoId = params.get('connect');
    if (autoId && autoId !== id) {
        statusDiv.textContent = 'Auto-connecting to sender...';
        setTimeout(() => connectToPeer(autoId), 700);
    }
});

peer.on('connection', (conn) => {
    currentConnection = conn;
    setupConnection(conn);
});

peer.on('error', (err) => {
    console.error('Peer error:', err);
    statusDiv.textContent = 'Error: ' + err.type;
});

// ============================================
// AUTO-RECONNECT
// ============================================
peer.on('disconnected', () => {
    console.log('Peer disconnected. Reconnecting...');
    statusDiv.textContent = 'Reconnecting...';
    try { peer.reconnect(); } catch (e) { console.error(e); }
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;

    if (peer.disconnected && !peer.destroyed) {
        try { peer.reconnect(); } catch (e) { console.error(e); }
    }

    if (currentConnection && currentConnection.open) {
        currentConnection.send({
            type: 'identity',
            name: myName || 'Anonymous',
            device: getDeviceInfo()
        });
    }
});

// ============================================
// CONNECT
// ============================================
function connectToPeer(friendId) {
    if (!friendId) { alert('Please enter a Friend ID first!'); return; }
    if (friendId === myIdDiv.textContent) { alert("That's your own ID."); return; }

    statusDiv.textContent = 'Connecting...';
    const conn = peer.connect(friendId);
    currentConnection = conn;
    setupConnection(conn);
}

// ============================================
// SETUP CONNECTION
// ============================================
function setupConnection(conn) {
    conn.on('open', () => {
        conn.send({
            type: 'identity',
            name: myName || 'Anonymous',
            device: getDeviceInfo()
        });
        statusDiv.textContent = 'Handshake complete...';
    });

    conn.on('data', (data) => {
        if (data.type === 'identity') {
            connectedPeer = {
                name: data.name || 'Anonymous',
                device: data.device || 'Unknown device'
            };
            showTransferScreen();
            statusDiv.textContent = `Connected to ${connectedPeer.name}. Ready to send.`;
            return;
        }

        if (data.type === 'file-start') {
            incomingFile = {
                filename: data.filename,
                mimeType: data.mimeType,
                totalChunks: data.totalChunks,
                fileSize: data.fileSize,
                chunks: [],
                received: 0,
                startTime: Date.now()
            };
            showProgress('Receiving');
            statusDiv.textContent = `Receiving "${data.filename}"...`;
        }

        else if (data.type === 'file-chunk') {
            if (!incomingFile) return;
            incomingFile.chunks.push(data.data);
            incomingFile.received++;

            const pct = Math.round((incomingFile.received / incomingFile.totalChunks) * 100);
            updateProgress(pct);

            const elapsed = (Date.now() - incomingFile.startTime) / 1000;
            const bytes = incomingFile.received * CHUNK_SIZE;
            updateSpeed(bytes / elapsed);
        }

        else if (data.type === 'file-end') {
            if (!incomingFile) return;

            const blob = new Blob(incomingFile.chunks, { type: incomingFile.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = incomingFile.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setTimeout(() => URL.revokeObjectURL(url), 5000);

            statusDiv.textContent = `"${incomingFile.filename}" received.`;
            incomingFile = null;

            setTimeout(() => {
                hideProgress();
                progressLabel.textContent = 'Done';
                progressPercent.textContent = '100%';
            }, 1500);
        }
    });

    conn.on('close', () => resetConnection());
}

// ============================================
// SCREEN SWITCHING
// ============================================
function showTransferScreen() {
    discoveryScreen.style.display = 'none';
    transferScreen.style.display = 'block';
    connectionBar.style.display = 'flex';
    updateConnectionBar(true);
}

function showDiscoveryScreen() {
    discoveryScreen.style.display = 'block';
    transferScreen.style.display = 'none';
    connectionBar.style.display = 'none';
}

// ============================================
// CONNECTION BAR
// ============================================
function updateConnectionBar(isConnected) {
    if (isConnected && connectedPeer) {
        connectionBar.classList.add('connected');
        connectionText.textContent = connectedPeer.name;
        connectionSub.textContent = connectedPeer.device;
        connectionSub.style.display = 'block';
        disconnectBtn.style.display = 'block';
    } else {
        connectionBar.classList.remove('connected');
        connectionText.textContent = 'Not connected';
        connectionSub.style.display = 'none';
        disconnectBtn.style.display = 'none';
    }
}

function resetConnection() {
    if (currentConnection) {
        try { currentConnection.close(); } catch (e) {}
    }
    currentConnection = null;
    connectedPeer = null;
    incomingFile = null;
    updateConnectionBar(false);
    showDiscoveryScreen();
    statusDiv.textContent = 'Disconnected. Share your QR or link to reconnect.';
    hideProgress();
}

// ============================================
// BUTTONS
// ============================================
disconnectBtn.addEventListener('click', resetConnection);
connectBtn.addEventListener('click', () => connectToPeer(peerIdInput.value.trim()));

copyIdBtn.addEventListener('click', async () => {
    const id = myIdDiv.textContent;
    if (id === 'Loading...') return;
    try {
        await navigator.clipboard.writeText(id);
        copyIdBtn.textContent = 'Copied';
        setTimeout(() => { copyIdBtn.textContent = 'Copy ID'; }, 1400);
    } catch (e) { alert('Your ID: ' + id); }
});

copyLinkBtn.addEventListener('click', async () => {
    const url = copyLinkBtn.dataset.url;
    if (!url) return;
    try {
        await navigator.clipboard.writeText(url);
        copyLinkBtn.textContent = 'Copied';
        setTimeout(() => { copyLinkBtn.textContent = 'Copy Link'; }, 1400);
    } catch (e) { alert('Your Link: ' + url); }
});

// ============================================
// SHARE OPTIONS
// ============================================
photoOption.addEventListener('click', () => photoInput.click());
videoOption.addEventListener('click', () => videoInput.click());
fileOption.addEventListener('click',  () => fileInput.click());

photoInput.addEventListener('change', handleFilePick);
videoInput.addEventListener('change', handleFilePick);
fileInput.addEventListener('change',  handleFilePick);

function handleFilePick(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!currentConnection || !currentConnection.open) {
        alert('Connection lost. Please reconnect.');
        e.target.value = '';
        return;
    }
    sendFile(file);
    e.target.value = '';
}

// ============================================
// 🚀 SEND FILE (1GB-Safe with Backpressure)
// ============================================
async function sendFile(file) {
    showProgress('Sending');
    progressLabel.textContent = `Sending ${file.name}`;
    statusDiv.textContent = `Sending "${file.name}" (${formatSize(file.size)})...`;

    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    currentConnection.send({
        type: 'file-start',
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        totalChunks,
        fileSize: file.size
    });

    const dc = currentConnection.dataChannel || currentConnection._dc;
    if (dc) {
        dc.bufferedAmountLowThreshold = BUFFER_LOW_MARK;
    }

    const startTime = Date.now();
    let index = 0;

    while (index < totalChunks) {
        if (dc && dc.bufferedAmount > BUFFER_THRESHOLD) {
            await waitForDrain(dc);
        }

        const start = index * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const blob = file.slice(start, end);
        const buffer = await blob.arrayBuffer();

        currentConnection.send({
            type: 'file-chunk',
            index,
            data: buffer
        });

        index++;

        const pct = Math.round((index / totalChunks) * 100);
        updateProgress(pct);

        const elapsed = (Date.now() - startTime) / 1000;
        const bytesSent = Math.min(index * CHUNK_SIZE, file.size);
        updateSpeed(bytesSent / elapsed);
    }

    currentConnection.send({ type: 'file-end' });
    statusDiv.textContent = `"${file.name}" sent successfully.`;
    progressLabel.textContent = 'Sent';
    progressPercent.textContent = '100%';

    setTimeout(hideProgress, 2500);
}

function waitForDrain(dc) {
    return new Promise(resolve => {
        dc.onbufferedamountlow = () => {
            dc.onbufferedamountlow = null;
            resolve();
        };
    });
}

// ============================================
// PROGRESS UI
// ============================================
function showProgress(label) {
    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
    progressLabel.textContent = label;
    progressSpeed.textContent = '';
}

function updateProgress(pct) {
    progressBar.style.width = pct + '%';
    progressPercent.textContent = pct + '%';
}

function updateSpeed(bytesPerSec) {
    progressSpeed.textContent = formatSpeed(bytesPerSec);
}

function hideProgress() {
    progressContainer.style.display = 'none';
    progressBar.style.width = '0%';
    progressSpeed.textContent = '';
}

// ============================================
// FORMATTERS
// ============================================
function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function formatSpeed(bps) {
    if (!isFinite(bps) || bps < 1) return '';
    if (bps < 1024) return bps.toFixed(0) + ' B/s';
    if (bps < 1024 * 1024) return (bps / 1024).toFixed(1) + ' KB/s';
    return (bps / (1024 * 1024)).toFixed(2) + ' MB/s';
}

// ============================================
// HAMBURGER MENU
// ============================================
function openMenu() {
    document.body.classList.add('menu-open');
    menuPanel.classList.add('open');
    menuBackdrop.classList.add('active');
}

function closeMenu() {
    document.body.classList.remove('menu-open');
    menuPanel.classList.remove('open');
    menuBackdrop.classList.remove('active');
}

function showMenuNav() {
    menuNav.style.display = 'flex';
    menuSections.forEach(s => s.style.display = 'none');
    menuBrand.style.display = 'inline-flex';
    menuBackBtn.style.display = 'none';
}

function showMenuSection(sectionId) {
    menuNav.style.display = 'none';
    menuSections.forEach(s => {
        s.style.display = s.id === 'section-' + sectionId ? 'block' : 'none';
    });
    menuBrand.style.display = 'none';
    menuBackBtn.style.display = 'inline-block';
}

hamburgerBtn.addEventListener('click', () => {
    if (menuPanel.classList.contains('open')) {
        closeMenu();
    } else {
        showMenuNav();
        openMenu();
    }
});

menuCloseBtn.addEventListener('click', closeMenu);
menuBackdrop.addEventListener('click', closeMenu);

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        showMenuSection(item.dataset.section);
    });
});

menuBackBtn.addEventListener('click', showMenuNav);

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuPanel.classList.contains('open')) {
        closeMenu();
    }
});