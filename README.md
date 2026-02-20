<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&section=header&text=Neuron&fontSize=70&fontColor=fff&animation=twinkling&fontAlignY=32" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/ESM-Modules-FF6D00?style=for-the-badge&logo=javascript&logoColor=white" />
  <img src="https://img.shields.io/badge/License-Apache%202.0-green?style=for-the-badge" />
</p>

<p align="center">
  <b>🚀 A next-gen Discord bot for moderation, verification & ticketing</b><br>
  <i>Built with modern ESM architecture and extensible design</i>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-commands">Commands</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-configuration">Config</a> •
  <a href="#-screenshots">Screenshots</a>
</p>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🛡️ **Moderation**
- Kick, Ban, Timeout, Remove Timeout
- Warning system with tracking
- Bulk message clearing (`/clear`)
- Channel lockdown mode
- Comprehensive logging

</td>
<td width="50%">

### 🔐 **Verification**
- Custom verification panels
- Secure modal-based flow
- Role assignment on verify
- Anti-alt protection ready

</td>
</tr>
<tr>
<td width="50%">

### 🎫 **Ticketing**
- One-click ticket creation
- Private channel generation
- Support team pings
- Archive & close functionality

</td>
<td width="50%">

### ⚡ **Utilities**
- Server information (`/serverinfo`)
- Custom embed builder (`/embed`)
- YouTube converter (`/convert`)
- Birthday scheduler (`/birthday`)
- Role management

</td>
</tr>
</table>

---

## 📋 Commands

### 🛡️ Moderation
| Command | Description | Permissions |
|---------|-------------|-------------|
| `/kick @user [reason]` | Remove user from server | Kick Members |
| `/ban @user [reason]` | Permanently ban user | Ban Members |
| `/timeout @user duration [reason]` | Temporarily timeout user | Moderate Members |
| `/removetimeout @user` | Remove active timeout | Moderate Members |
| `/warnings @user` | View user warning history | Moderate Members |
| `/clear amount` | Delete bulk messages | Manage Messages |
| `/lockdown [reason]` | Lock channel for @everyone | Manage Channels |

### 🔐 Verification & Setup
| Command | Description | Permissions |
|---------|-------------|-------------|
| `/verify setup #channel` | Create verification panel | Administrator |
| `/ticket setup #category` | Setup ticket system | Administrator |
| `/autojoin setup #channel` | Configure welcome messages | Administrator |
| `/reactionrole setup` | Create reaction role message | Manage Roles |

### 🎂 Fun & Utilities
| Command | Description | Usage |
|---------|-------------|-------|
| `/birthday user mode date` | Send/schedule birthday wishes | `/birthday @user schedule 0 9 * * *` |
| `/birthday-list` | View all scheduled birthdays | — |
| `/convert format url` | Download YouTube audio/video | `/convert mp3 <url>` |
| `/serverinfo` | Display server statistics | — |
| `/embed` | Create custom rich embeds | Interactive builder |
| `/say message` | Make bot say something | — |
| `/ping` | Check bot latency | — |
| `/invite` | Get bot invite link | — |
| `/help` | Display help menu | — |

### 👥 Role Management
| Command | Description | Permissions |
|---------|-------------|-------------|
| `/addrole @user @role` | Add role to user | Manage Roles |
| `/removerole @user @role` | Remove role from user | Manage Roles |

---

### 🛠️ Tech Stack
<p align="center">
  <img src="https://img.shields.io/badge/Discord.js-5865F2?style=flat-square&logo=discord&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/ES6%2B-F7DF1E?style=flat-square&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/node--cron-2E7D32?style=flat-square&logo=clockify&logoColor=white" />
</p>

---

Discord.js v14 - Modern Discord API wrapper

ES Modules - Native ES6+ module system

node-cron - Scheduled birthday greetings

Native Fetch - Built-in HTTP requests (Node 18+)

---

### 🤝 Contributing
<b>Contributions are welcome! Please follow these steps: Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request</b>

---

### 📄 License
Distributed under the Apache License 2.0. See LICENSE for more information.

---

Made with ❤️ by <b> agent-nau </b> for Discord communities

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer" />
</p>
<p align="center">
