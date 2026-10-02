# VIDO Technology — FOUNDATION LOCKED v1.0

**Status: IMMUTABLE FOUNDATION.**

This document is the permanent contract for the VIDO Technology IT Learning Platform. It is a reference/lock file, not a feature backlog. Future changes must read the latest mutable build file first and must preserve every item below. This file must never be rewritten, shortened, or replaced as part of ordinary feature changes.

## 1. Product identity
- Product: **VIDO Technology — IT Learning Platform**.
- Professional dark network/IT training interface.
- No Duolingo clone and no replacement of the established VIDO interface with a different visual concept unless explicitly requested as a new product direction.
- VIDO branding remains present.

## 2. Immutable navigation architecture
- Real in-app views/routes; do not use page-end scrolling as navigation.
- Every opened section has a functional Back action to the previous view/state.
- Search opens directly and returns to the exact previous place/state.
- Question IDs remain stable forever.
- Navigation history and learning state must survive language changes and view changes.

## 3. Immutable multilingual foundation
- Languages: **Deutsch (DE), English (EN), العربية (AR)**.
- Language selector must be available on **Desktop and Mobile** and remain visible without requiring the user to scroll to find it.
- Changing language must update the complete platform: navigation, dashboard, questions, help, answers, videos, glossary, IHK mode, simulator, progress, learning path, tutor, errors, notes, and system messages.
- Arabic uses RTL. German and English use LTR.
- IPv4 addresses, CIDR prefixes, MAC addresses, CLI commands, code, masks, and other technical literals remain LTR using directional isolation.
- Language choice is persisted. Changing language must not reset learning progress, notes, errors, favorites, simulator state, question IDs, or position.

## 4. Learning Path and learning engine
- Dynamic Learning Path is permanent.
- Skill-based progression from fundamentals to advanced/IHK material.
- Adaptive Learning.
- Spaced Repetition.
- XP, streak, daily challenge/mission.
- Skill Tree.
- Progress and Mastery reporting.
- Smart error analysis.
- Smart “Why?” explanations.
- Full learning state persistence.

## 5. Question system
Every question is a structured object and must retain:
- stable Question ID
- topic
- skill
- difficulty
- IHK relevance where applicable
- question text
- technical data
- accepted answer(s)
- localized DE/EN/AR wording
- localized explanation
- question-specific help path
- related skill/lesson information where available
- common mistake/error linkage where available

The question system must support:
- Check/Validate
- explicit Correct/Incorrect feedback
- positive/negative emoji feedback
- Show Correct Answer on request
- Help/Hilfe/مساعدة
- Why/Weshalb/لماذا
- Notes/Favorites
- Error review
- Search by Question ID

## 6. Help system — mandatory
Help is permanent for **every question, topic, lesson, and simulator task**.

Help must be useful enough to guide the learner toward the answer without revealing the final answer unnecessarily. The default progression is:
1. What to inspect
2. Method/thinking process
3. Technical rule
4. Step-by-step path to the result
5. Full answer only through the explicit Show Correct Answer action

Generic filler help must not replace question-specific guidance when a technical method can be provided.

## 7. Core learning content
The platform must be able to cover at minimum:
- IPv4 Basics
- Binary & Decimal
- CIDR / Prefix
- Subnet Mask
- Network Address
- Broadcast Address
- First Host
- Last Host
- Host Range
- Usable Hosts
- Block Size
- Subnetting
- VLSM
- Classful IPv4
- Private IPv4
- Special IPv4
- Loopback
- Link-Local/APIPA
- Multicast
- Gateway
- Routing / Default Route / route selection
- ARP
- ICMP / Ping
- DHCP
- DNS
- VLAN
- Switch / MAC table
- TCP & UDP
- Troubleshooting
- Cisco CLI
- IHK-oriented networking practice

## 8. Cisco-style Network Simulator — permanent option
A distinct **Cisco Simulator / Cisco Lab** option must remain in the program. It must not be renamed into a generic simulator or removed.

Foundation capabilities:
- PC, Switch, Router, Server
- topology and connections
- IPv4 / subnet mask / gateway
- ping
- ARP / MAC tables
- routing table
- static/default routing concepts
- Cisco-style CLI
- packet flow
- events/logs
- task/challenge system
- troubleshooting
- contextual Help
- save/load topology/state where supported

## 9. Video Learning
- Video Learning is permanent.
- Videos can be linked to concepts, skills, questions, mistakes, IHK tasks, simulator tasks, and review.
- Video content must support DE/EN/AR.
- Do not claim an MP4/video exists unless it has actually been generated or supplied.

## 10. IHK mode
- Dedicated IHK Exam Mode remains available.
- No-hint exam behavior when configured as exam mode.
- Timed practice, review, skill breakdown, and result reporting are supported by the architecture.

## 11. Mobile/Desktop contract
- Desktop and Mobile must both be first-class interfaces.
- Mobile Portrait must work without requiring rotation.
- Landscape must remain usable.
- The page itself should provide normal vertical scrolling; specialized horizontal components may scroll horizontally within themselves.
- Mobile language and menu controls must remain accessible without requiring a long scroll to reveal them.
- Do not use orientation locking as a substitute for responsive design.

## 12. PWA / persistence
- PWA manifest and service worker are part of the foundation.
- Cache versions must be updated when a deployment genuinely changes cached assets.
- Learning state is persisted locally at minimum in the current static architecture.

## 13. Change protocol — mandatory
**FOUNDATION FILE:** `VIDO_FOUNDATION_LOCKED_V1.md`
- Never modify this file during ordinary changes.
- It is the permanent specification/contract.

**MUTABLE BUILD FILE:** `VIDO_CHANGEABLE_BUILD_V1.html`
- Before every future modification, the latest mutable build must be read completely enough to understand its current structure and implementation.
- Every change is applied to that latest mutable build, never to an older copy.
- After modification, the mutable build becomes the new current build.
- Never silently revert to an older version.
- Never remove a foundation feature to implement a new feature.
- New question banks are additions to the existing question engine, not replacements for the foundation.

## 14. Verification gate before calling a build final
At minimum verify:
- JavaScript syntax
- HTML structure
- CSS structure
- duplicate IDs
- DOM references
- route/view references
- language keys and fallbacks
- question IDs and answer data
- Check/feedback behavior
- Help and Show Answer behavior
- navigation/back behavior
- mobile/desktop controls
- PWA files
- ZIP integrity if packaged
- no accidental deletion of foundation features

Where a real physical browser/device is required, report that limitation instead of claiming a test was performed.

**End of immutable foundation.**
