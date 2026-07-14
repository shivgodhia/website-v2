---
date: '0'
title: 'Grove'
cover: './Grove-demo.png'
github: 'https://github.com/shivgodhia/grove'
external: 'https://grove.shivgodhia.com'
tech:
  - Zsh
  - tmux
  - fzf
  - git worktrees
showInProjects: true
---

Grove gives every AI agent its own grove — multi-repo worktrees managed from one command. Group repos that touch a feature into a workspace, and Grove creates worktrees across all of them on the same branch, inside a single tmux session, so dozens of agents can work in parallel without stepping on each other.

Built as a single Zsh function with an interactive [fzf](https://github.com/junegunn/fzf)-powered TUI, atomic setup with automatic rollback, and workspaces that survive restarts and terminal crashes.
