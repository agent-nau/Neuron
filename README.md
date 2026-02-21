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
  <a href="#-configuration">Config</a> •
</p>

---

<h2 align="center">✨ Features</h2>

<table>
<tr>
<td width="25%" valign="top">

### 🛡️ **Moderation**
- Kick, Ban, Timeout, Remove Timeout
- Warning system with tracking
- Bulk message clearing (`/clear`)
- Channel lockdown mode
- Comprehensive logging

</td>
<td width="25%" valign="top">

### 🔐 **Verification**
- Custom verification panels
- Secure modal-based flow
- Role assignment on verify
- Anti-alt protection ready

</td>
<td width="25%" valign="top">

### 🎫 **Ticketing**
- One-click ticket creation
- Private channel generation
- Support team pings
- Archive & close functionality

</td>
<td width="25%" valign="top">

### ⚡ **Utilities**
- Server information (`/serverinfo`)
- Custom embed builder (`/embed`)
- YouTube converter (`/convert`)
- Birthday scheduler (`/birthday`)
- Role management (`/addrole` `/removerole`)

</td>
</tr>
</table>

---

<h2 align="center">📋 Commands</h2>

<h3 align="center">🛡️ Moderation</h3>

<div align="center">

| Command | Description | Usage | Permission |
|:--------|:------------|:------|:-----------|
| `/kick @user [reason]` | Remove user from server | `/kick @user spam` | Kick Members |
| `/ban @user [reason]` | Permanently ban user | `/ban @user toxicity` | Ban Members |
| `/timeout @user duration [reason]` | Temporarily timeout user | `/timeout @user 1h rude` | Moderate Members |
| `/removetimeout @user` | Remove active timeout | `/removetimeout @user` | Moderate Members |
| `/warnings @user` | View user warning history | `/warnings @user` | Moderate Members |
| `/clear amount` | Delete bulk messages | `/clear 100` | Manage Messages |
| `/lockdown [reason]` | Lock channel for @everyone | `/lockdown emergency` | Manage Channels |

</div>

<h3 align="center">🔐 Verification & Setup</h3>

<div align="center">

| Command | Description | Usage | Permission |
|:--------|:------------|:------|:-----------|
| `/verify setup #channel` | Create verification panel | `/verify setup #verify` | Administrator |
| `/ticket setup #category` | Setup ticket system | `/ticket setup #tickets` | Administrator |
| `/autojoin setup #channel` | Configure welcome messages | `/autojoin setup #welcome` | Administrator |
| `/reactionrole setup` | Create reaction role message | `/reactionrole setup` | Manage Roles |

</div>

<h3 align="center">🎂 Fun & Utilities</h3>

<div align="center">

| Command | Description | Usage | Permission |
|:--------|:------------|:------|:-----------|
| `/birthday date hour minute [user]` | Schedule birthday greeting with @everyone mention (auto-detects next occurrence) | `/birthday "February 22 2026" 9 0 @user` | — |
| `/birthday-list` | View all scheduled birthdays via DM | `/birthday-list` | — |
| `/birthday-delete id` | Delete a birthday greeting you created | `/birthday-delete 3` | — |
| `/convert format url` | Download YouTube audio/video (MP3, MP4, etc.) | `/convert mp3 https://youtube.com/watch?v=...` | — |
| `/serverinfo` | Display detailed server statistics and info | `/serverinfo` | — |
| `/embed` | Create custom rich embeds with colors, footer, thumbnail | `/embed` | ManageMessages |
| `/say message [channel] [anonymous]` | Make bot say something in a channel | `/say Hello everyone! #general` | ManageMessages |
| `/ping` | Check bot latency and API response time | `/ping` | — |
| `/invite` | Get bot invite link for your server | `/invite` | — |
| `/help` | Display full help menu with all commands | `/help` | — |

</div>

<h3 align="center">👥 Role Management</h3>

<div align="center">

| Command | Description | Usage | Permission |
|:--------|:------------|:------|:-----------|
| `/addrole @user @role` | Add role to user | `/addrole @user @Member` | Manage Roles |
| `/removerole @user @role` | Remove role from user | `/removerole @user @Member` | Manage Roles |

</div>

<h3 align="center">🎵 Music </h3>

<div align="center">

| Command | Description | Usage |
|---------|-------------|-------|
| `/play <song>` | Play a song from YouTube | `/play Believer` or `/play <youtube-url>` |
| `/pause` | Pause or resume current song | `/pause` |
| `/skip` | Skip to next song in queue | `/skip` |
| `/stop` | Stop playback and clear queue | `/stop` |
| `/queue` | Show current queue | `/queue` |

</div>
 
---

<p align="center">
  <img src="https://img.shields.io/badge/Discord.js-5865F2?style=flat-square&logo=discord&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/ES6%2B-F7DF1E?style=flat-square&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/node--cron-2E7D32?style=flat-square&logo=clockify&logoColor=white" />
</p>

---

<b>
<p align="center">
Discord.js v14 - Modern Discord API wrapper
</p>
</b>

<b>
<p align="center">
ES Modules - Native ES6+ module system
</p>
</b>

<b>
<p align="center">
node-cron - Scheduled birthday greetings
</p>
</b>

<b>
<p align="center">
Native Fetch - Built-in HTTP requests (Node 18+)
</p>
</b>

---


<b>
<p align="center">
 📄 License
</p>
</b> 

<p align="center">
  <b>Distributed under the Apache License 2.0. See <a href="https://github.com/agent-nau/Neuron/blob/main/LICENSE">LICENSE</a> for more information.</b>
</p>

---
<p align="center">
  <b>Made with ❤️ by <a href="https://github.com/agent-nau/">Agent-Nau</a> for Discord communities.</b>
</p>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer" />
</p>
<p align="center">
