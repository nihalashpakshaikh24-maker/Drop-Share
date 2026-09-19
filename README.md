Hello i am NIHAL SHAIKH 3rd year BCS student. I created Drop Share with basic coding knowledge and some Ai tools
Drop Share is a file sharing app across the world via internet.
# 📁 DropShare — P2P File Sharing

> Send files **directly** from one device to another. No uploads. No servers storing your stuff. Just pure peer-to-peer magic. ✨

**🔗 Live Demo:** [https://drop4share.pages.dev](https://drop4share.pages.dev)

---

## 🤔 Wait, what is this?

Okay so basically, imagine you want to send a 1GB video to your friend. Normally you'd upload it somewhere (slow), wait for them to download it (slower), and hope the server doesn't die in between.

**DropShare skips all that.**

Open the site on both devices → connect them via QR or link → send the file. It travels **directly** from your device to theirs. Nothing ever touches a server. Files stay between the two of you, end-to-end encrypted.

Built with pure **HTML, CSS, and vanilla JavaScript**. No React, no Node backend, no database. Just the browser doing cool stuff.

---

## 🚀 Features

- ⚡ **Peer-to-Peer** — Files go straight between devices. Zero server storage.
- 🔒 **End-to-End Encrypted** — WebRTC uses DTLS-SRTP. Nobody can peek.
- 📱 **QR Code + Link Sharing** — Scan the QR or send the link. Auto-connects.
- 🗂️ **Any File Type** — Photos, videos, PDFs, ZIPs, APKs, EXE — everything works.
- 📊 **Live Progress + Speed** — Real-time progress bar with MB/s display.
- 📦 **Large File Support** — 64KB chunked streaming with backpressure handles GB-scale files.
- 🌍 **Works Anywhere** — Same room or across the world (as long as both are online).
- 🔄 **Auto-Reconnect** — Mobile tab switching doesn't kill the connection.
- 💾 **Remembers Your Name** — Saved in localStorage. No re-typing every time.
- 🎨 **Clean UI** — No neon overload. Just clean, minimal, professional.

---

## 🎮 How to Use

**1. Set your name** — So your friend knows who they're connecting to.

**2. Share your QR or link** — Send it via WhatsApp, Telegram, anywhere.

**3. Connect** — Scan the QR, click the link, or paste the ID. All work.

**4. Pick what to send** — Photo, Video, or File. The picker opens instantly.

**5. Watch it fly** — Progress bar shows transfer speed. File downloads automatically on the other side.

> ⚠️ **Important:** Keep the tab open while sending. Mobile OSes pause background tabs, and no website can bypass that. (Trust me, we tried.)

---

## 🧠 How It Actually Works

Here's the simple version for anyone curious:

1. Each browser gets a unique **Peer ID** from a signaling server
2. You share that ID (via QR / link) with your friend
3. The signaling server introduces both browsers to each other
4. **It then steps out of the way** — the actual file transfer happens directly between the two devices
5. Files are split into **64KB chunks** and streamed with backpressure handling
6. Receiver reassembles them into a `Blob` and auto-downloads

The file never touches a server. Ever.

---

## 🛠️ Tech Stack

| Layer | What We Used |
| :--- | :--- |
| Markup | HTML5 |
| Styling | CSS3 (Flexbox, CSS Variables, Animations) |
| Logic | Vanilla JavaScript (ES6+) |
| Networking | WebRTC via [PeerJS](https://peerjs.com/) |
| QR Generation | [qrcodejs](https://github.com/davidshimjs/qrcodejs) |
| Browser APIs | File API, Blob API, Clipboard API, Wake Lock API |
| Storage | localStorage |

**Zero build tools. Zero dependencies to install. Zero backend.**
