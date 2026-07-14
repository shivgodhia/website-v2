---
date: '0.5'
title: 'SkribOS'
cover: './Skribos-demo.png'
external: 'https://skribos.com'
tech:
  - Node.js
  - TypeScript
  - Telegraf
  - PostgreSQL
  - Drizzle ORM
showInProjects: true
---

SkribOS is a Telegram bot that turns voice notes, audio files, videos, and documents into clean, searchable transcripts with AI summaries. It auto-transcribes messages in any chat, keeps a searchable archive of everything you've captured, and exposes an [MCP](https://modelcontextprotocol.io) server so you can connect Claude to ask questions across it all.

Built as a pnpm monorepo with a Telegraf bot, a web viewer, and a landing page. Handles pagination, quotas and tiers, Telegram Stars payments, referrals, and large-file downloads over MTProto.
