# NOTICE

学习伴侣 is a modified distribution of Chatbox Community Edition.

## Upstream

- Project: Chatbox Community Edition
- Repository: https://github.com/chatboxai/chatbox
- Copyright: Mediocre Company and Chatbox contributors
- License: GNU General Public License v3.0 (see [LICENSE](LICENSE))

This project is not affiliated with, endorsed by, or sponsored by Chatbox or
Mediocre Company.

## Modifications in this fork

The main changes relative to upstream Chatbox CE include:

- rebranded as 学习伴侣, with a new icon and Windows product name;
- removed Chatbox account, membership, cloud quota, onboarding marketing and
  social-media links;
- limited the provider list to user-configured providers and local services;
- added a global-hotkey quick window with free resizing, blur/Esc hiding and
  expansion back to the main window;
- added silent startup at login and a setting to control it;
- replaced the built-in demo conversations with three study modes: detailed
  explanation, Socratic questioning and a user-defined mode;
- changed chat export to Markdown study notes and removed upstream promotional
  content from exports;
- reduced the Windows build to x64, two Chromium locales, no renderer source
  maps and no bundle-analysis report;
- disabled the updater by default and disabled spell checking in the desktop
  window;
- removed unused built-in skills and simplified the sidebar, home page and
  settings navigation.

The corresponding source code for this modified version is this repository.
If you redistribute a modified version, you must comply with GPL-3.0, including
making the corresponding source available and preserving the license notices.
