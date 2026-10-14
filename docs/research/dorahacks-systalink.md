# Research: DoraHacks hackathon model and Systalink hackathon (CADEV 2026)

Ticket: 0xdaydy/systalink-challenge#6 (child of map #1). Research date: 2026-10-03.
Sources are primary only: dorahacks.io (product pages and DoraHacks' own organizer guides) and systalink.com (the official CADEV landing page and the official rules embedded in it).

## TL;DR

- The Systalink hackathon is the **Coupe d'Afrique des Développeurs 2026 (CADEV)**, organized by Systalink (SYSTALINK SENEGAL SASU). Official page: <https://systalink.com/fr/coupe-afrique-des-developpeurs-cadev> (EN: <https://systalink.com/en/coupe-afrique-des-developpeurs-cadev>).
- Its official rules ("Règlement du concours CADEV", 14 articles + Annexe 1 grading grid) are published, but only inside a dialog ("Voir les conditions générales") on that page. The text below is read from the page's JavaScript bundle, so it is the same text a visitor sees.
- Several facts the team assumed are **different or still unknown**: the registration/submission window is 29 Sept to 25 Oct 2026 17:00 GMT (not 25 Sept); teams are 2 to 5 members (confirmed); eligibility is **francophone Africa** (not pan-African); the project must be deployed on Systalink's Datacloud; the theme/subject is **not published**.
- DoraHacks models a hackathon as: header (prize pool, timeline, tags, platform), tabs (Details, Builds/BUIDLs, Bounties, Winners, plus custom tabs), tracks, bounties with sponsors, submission requirements, judging (AI and/or human with scored categories), and winner assignment.

---

## Part 1. How DoraHacks structures a hackathon

DoraHacks' public site blocks plain HTTP clients (405), so pages were read in a real browser. Observed on a live hackathon page (Hedera Hello Future: Origins 2025) and in DoraHacks' own organizer guides.

### 1.1 Public hackathon list

<https://dorahacks.io/hackathon>: grid/list toggle, **Sort**, **Status**, **Location** filters, and topic chips (Quantum, AI, Crypto/PQC, Biohack, Student). Entry points "Create a Hackathon" and "View Guide".

### 1.2 Public hackathon page (observed)

Source: <https://dorahacks.io/hackathon/hello-future-origins/detail>

Header block:
- **Prize pool** (e.g. "150 000 USD")
- **Event timeline** with status ("Submission period ended / Upcoming") and dated milestones: Pre-registration, Submission (start), Deadline; format badge ("Virtual")
- **Hackathon tags** (Blockchain, AI, DeFi...)
- **Platform technology** (sponsor tech, e.g. Hedera)
- Organizer message button; CTAs **Submit Build**, **Register**; share

Tabs: **Winners**, **Details**, **Builds** (count, e.g. 160; grid/list + sort), **Bounties** (count), plus organizer-defined tabs seen here: Contact Us, Submission Guide, Team Formation Instructions, Judging Criteria, Resources. A left "Outline" is generated from the Details headings.

Details tab (organizer-authored Markdown): Introduction, Key Dates (opening ceremony, hacking period, submission deadline), Tracks (with rules such as one team / one main track), Prizes per track (1st/2nd/3rd amounts), Side quests (small first-N rewards), Eligibility (age 18+, restricted countries), Submission artefacts (GitHub repo, README, demo video, pitch, etc.), About us. A "submission password" can gate private hackathons.

Source for guide-level confirmation: <https://dorahacks.io/blog/guides/how-to-create-a-hackathon>

### 1.3 Organizer configuration model (from DoraHacks guides)

Sources: <https://dorahacks.io/blog/guides/how-to-create-a-hackathon>, <https://dorahacks.io/blog/guides/diy-your-hackathon>, <https://dorahacks.io/blog/guides/judging-organizers>

| Area | Fields / behaviour |
|---|---|
| Ownership | Hackathon belongs to an **organization**; administrators with roles Admin/Member; ownership transfer |
| Basics | Title, hackathon type, banner, tags, prize pool, timeline, detailed description (Markdown); optional private mode with password; draft then "Submit for Review" (DoraHacks reviews in 1-2 business days) |
| Locking | After launch, start/end dates and prize info cannot be edited by the organizer; track names can be renamed but not deleted |
| Custom tabs | Up to 5 custom tabs, reorderable; default tabs (BUIDLs, Ideas, Ask Questions, Join a Team) can be hidden |
| Registration | Custom questions for registrants ("Ask Hackers") and for submitters ("Ask BUIDLers"); participant list view/export; public visibility moderation |
| Submission requirements | Can require GitHub repo and/or demo video |
| Tracks | Name, description, judging criteria; single- or multi-selectable; max tracks per project; optional public Tracks tab |
| Bounties | Sponsors (multiple, invitable by email; the organizer is default sponsor), bounties per sponsor, required/optional application, max bounties per project |
| BUIDL review | Statuses: submitted, approved (listed publicly), rejected; batch actions; CSV export. Approval means "listed", not "prize awarded" |
| Messaging | Group messages to all registrants, BUIDL members, or one track's teams; optional public Announcements tab |
| Judging | AI judging (ranked candidates with score and reasoning) and/or external human judging: scoring categories, max score per category (acts as weight), judges invited by email magic link, judge-to-track assignment, shortlist thresholds; optional aMACI on-chain judging (rounds, voice credits) |
| Results | Prize categories ("placements"), Winner Assignment per track/bounty, "Announce" to publish winners; marketing summary |

### 1.4 What a participant submission ("BUIDL") contains

Source: observed submission artefact list on the Hedera page (GitHub repo + README + testing instructions; project details; demo/pitch assets) and the organizer-controlled "required fields" (GitHub, demo video). DoraHacks does not publish one universal BUIDL schema on these pages; the exact BUIDL form fields were **not verified** here (login-gated).

---

## Part 2. Systalink hackathon: CADEV 2026

Official sources:
- Landing page (FR): <https://systalink.com/fr/coupe-afrique-des-developpeurs-cadev>
- Landing page (EN): <https://systalink.com/en/coupe-afrique-des-developpeurs-cadev>
- Rules: dialog "Conditions générales de participation" on the landing page (text lives in the page's JS chunk `/_next/static/chunks/089u7-3lg1544.js`).
- Registration: <https://platform.systalink.com/sign-up?from=cadev-landing>
- Contact: cadev@systalink.com, WhatsApp +221 76 660 40 41

### 2.1 Verified facts

| Topic | Fact | Source |
|---|---|---|
| Name | "Coupe d'Afrique des Développeurs 2026" (CADEV); EN "African Developers Cup" | landing page |
| Organizer | SYSTALINK SENEGAL, SASU, RCCM Dakar SN-DKR-2024-B4656, NINEA 010987347 | Rules art. 1 |
| Format | 100% online; free registration; teams only | landing page; Rules art. 2, 4 |
| Expected scale | "+50 000 participants attendus" (organizer's expectation) | landing page |
| Registration + submission window | 29 Sept 2026 to 25 Oct 2026, 17:00 GMT (Dakar time). Landing countdown "Clôture de la période de soumission" = 2026-10-25T17:00:00Z | Rules art. 3; page source |
| Peer vote | 25 Oct 18:00 GMT to 26 Oct 23:59 | Rules art. 3 |
| Jury scoring | 31 Oct 00:00 to 1 Nov 23:59 | Rules art. 3 |
| Results | 2 Nov 2026 | Rules art. 3 |
| Jury composition | To be published "au plus tard le 30 octobre 2026" (art. 3) / "avant la clôture des soumissions" (art. 7) - the two articles disagree; no names published yet | Rules art. 3, 7 |
| Eligibility | Natural person, 18+, nationality of or residence in a **francophone African country**, has a Datacloud account, accepted rules. Staff of Systalink group, jury members and close relatives excluded | Rules art. 4 |
| Team size | **2 to 5 members**; one representative; declared prize split key; members may be from different eligible countries | Rules art. 4 |
| Country ranking | Each team declares one represented country (final choice); projects compete within national groups | Rules art. 4, 7; landing "Classement pays" |
| Deliverable | A **deployed, online-accessible solution** built mostly during the contest, original, no third-party rights issue. Existing pre-contest projects not allowed | Rules art. 2, 6 |
| Mandatory hosting | Must use at least one paid Datacloud product/service (admissibility condition, not a grading criterion) | Rules art. 6 |
| Submission declarations | Authorship declaration per member; list of third-party components and licenses (permissive MIT/Apache/BSD ok; GPL/AGPL/LGPL make it inadmissible); AI tool usage freely allowed but must be declared (tools, parts) | Rules art. 6 |
| Selection | 1) Peer vote within national group (each member gets up to 10 random projects, votes for one; vote mandatory or team excluded; top 3 per group advance). 2) National selection: public vote + jury grid, best per group = national finalist. 3) Final: best final score wins | Rules art. 7 |
| Public vote | No account, email-confirmed, max 10% of final score | Rules art. 7 |
| Judging criteria (Annexe 1) | Relevance/usefulness vs the subject 25% (jury); Technical quality (architecture, robustness, security, code quality, team mastery incl. AI parts, license compliance) 30% (jury); UX/ergonomics 20% (jury); Innovation/originality 15% (jury); Public vote 10% (capped bonus). Each jury criterion scored /20, averaged over jurors | Rules Annex 1 |
| Prize | 5,000,000 FCFA gross to the winning team, conditional on exclusive transfer of economic rights of the winning solution to Systalink (code, databases, docs, graphics); paid within 30 days of signing the transfer; all members must sign within 30 days of proclamation | Rules art. 8; landing page |
| Other benefits | -40% on Datacloud (excl. VPS outside Dakar) for registered teams until submission close, via promo code; -70% on all Datacloud for all registered participants from results to 31 Dec 2026. (Landing page words the -70% as "pendant toute l'année 2026"; rules are more precise.) | Rules art. 9; landing page |
| Non-winners | Keep all rights; non-exclusive free license to Systalink for hosting/display/communication, expires 12 months after results | Rules art. 10 |
| Fraud | Multiple accounts, vote manipulation, plagiarism, false declarations: disqualification after 48h to respond | Rules art. 11 |
| Sponsors | Atos and Systalink listed as "Sponsors officiels"; open call for more sponsors | landing page |
| Governing law | Senegalese law; disputes before Dakar courts; claims within 30 days to cadev@systalink.com | Rules art. 14 |

### 2.2 Verified vs missing

| Item | Status | Notes |
|---|---|---|
| Dates | Verified, **differs from our assumption** | Submissions close 25 Oct 17:00 GMT. Official start of registration/submission is 29 Sept, not 25 Sept (map #1 says 25 Sept). Results 2 Nov. |
| Team size | Verified | 2 to 5. Closes the "to confirm" note in map #1. |
| Judging criteria + weights | Verified | See Annexe 1 above. |
| Deliverables | Partly verified | Deployed solution on Datacloud + declarations (authorship, licenses, AI use). Exact submission form fields, demo video, repo link, pitch: **not published**. |
| Prizes | Verified | One prize: 5M FCFA to the winner (with IP transfer). No 2nd/3rd place or per-track prizes published. |
| Tracks / categories | **Missing / none** | No tracks mentioned. Only national groups (country ranking). |
| Theme / subject | **Missing** | Rules say participants answer "le sujet communiqué par l'Organisateur"; the landing page's "Découvrir le thème" button only points to sign-up. Subject not public. |
| Jury members | **Missing** | Promised before 30 Oct (or before submission close). |
| Eligible country list | **Missing** | "Francophone Africa" and "Pays éligibles" referenced; no explicit list found. |
| Sponsors | Partly verified | Atos, Systalink. No sponsor-specific bounties. |
| Submission platform | Partly verified | Registration via Datacloud platform (platform.systalink.com); it appears the contest interface lives there (not accessible without an account, not checked). |
| Does the contest require an agent-native / local-first platform? | Not stated | No technical constraints on stack in the public rules; only "deployed on Datacloud". |
| Name conflict | Note | Rules header says "Compétition Africaine des Développeurs"; page title says "Coupe d'Afrique des Développeurs". Same event. |

Implications for our project (facts, not decisions): the contest is **francophone Africa**, so the French UI is a must; our own deployment must use a paid Datacloud product to be admissible; AI-assisted code is allowed if declared; copyleft dependencies (GPL/AGPL/LGPL) disqualify; the project must be created during the contest period; the winner transfers IP to Systalink.

---

## Part 3. Candidate Hackathons module (fields and screens)

Derived from the DoraHacks model (Part 1) trimmed to MVP, with Systalink specifics (Part 2) driving required fields. Proposal, to be validated in the grilling/spec step.

### 3.1 Entities and fields

**Hackathon**: slug, name (fr/en), organizer (name, logo, url), status (derived: upcoming / registration-open / submissions-open / voting / judging / results), format (online/in-person), banner, tags, description (Markdown, fr/en), eligibility text + country list (nullable), team size min/max, prize summary, external links (official page, registration, contact email/WhatsApp), source URL + last-verified date (to flag stale data).

**Milestone** (timeline): hackathon, key (registration_open, submission_close, peer_vote_start/end, jury_start/end, results), starts_at/ends_at (stored UTC, shown in the viewer's timezone; Dakar = GMT), label.

**Track / category** (optional; DoraHacks supports it, Systalink has none): name, description, criteria, single/multi-select.

**Prize**: hackathon, track (nullable), rank/label, amount + currency (FCFA), conditions (e.g. IP transfer), perks (discounts).

**Judging criterion**: hackathon, label, weight %, evaluator type (jury/public/peer), scale (e.g. /20). (Systalink: 25/30/20/15/10.)

**Rule / document**: hackathon, title, body (Markdown), version, source URL (full rules text; show highlighted "essential stipulation" boxes such as the IP transfer).

**Sponsor / Judge**: name, logo, role, link; judge list may be empty ("to be announced" state).

**Announcement**: hackathon, title, body, published_at (organizer news; DoraHacks has an Announcements tab).

**Team** (optional MVP+): hackathon, name, members (2..5, 18+), represented country, project link. **Submission/project** (DoraHacks "BUIDL"; ties to map item "soumissions de projets"): team, title, summary, repo URL, live URL, demo video URL, declared stack/licenses, AI-use declaration, status (draft/submitted/approved/rejected), country group.

**Leaderboard entry** (read-only display): submission, country group, peer-vote rank, public votes, jury score, final score, stage reached. Only populated if Systalink publishes results; otherwise this is our own community showcase, not the official ranking.

### 3.2 Screens

1. **Hackathons index**: cards with name, status badge, prize, key date/countdown, tags; filters Status / Location / Tag (as on DoraHacks); featured card for CADEV.
2. **Hackathon detail** with tabs: *Overview* (header: prize, timeline, tags, organizer, CTAs), *Timeline*, *Prizes*, *Rules & eligibility* (with the rule highlights: team 2-5, francophone Africa, Datacloud deploy, IP transfer), *Judging* (criteria table with weights), *Sponsors & judges*, *Projects* (grid/list + sort, once any), *Leaderboard / Winners*, *Announcements*, *Discussion* (links to Q&A questions tagged with the hackathon; fits the Q&A product).
3. **Countdown / deadline widget** reusable in the feed ("closes 25 Oct 17:00 GMT").
4. **Project showcase detail** and **submit/edit project** form (if submissions are in scope).
5. **Find a team** (DoraHacks has "find a team"/"Join a Team"): post looking-for-team with skills and country; fits the member/profile model.
6. **Admin/seed screen or seed file** for hackathon data (MVP can be a typed seed, since only one hackathon is known).

### 3.3 Open design questions raised by the findings

- Position the module as an **information + community layer** about CADEV rather than a competing submission system: the official submission/vote runs on Systalink's platform (not verified), so duplicating it risks conflicting with the rules (peer vote integrity, Datacloud admissibility).
- Rules say contest is francophone Africa; the product vision is pan-African. Decide whether the Hackathons module lists non-francophone events too.
- Data freshness: since the theme and jury are unpublished, the model needs nullable/"TBA" states and a `last_verified_at`.

## Sources

- DoraHacks hackathons index: <https://dorahacks.io/hackathon>
- DoraHacks hackathon page (example): <https://dorahacks.io/hackathon/hello-future-origins/detail>, `/judging-criteria`, `/buidl`
- DoraHacks, How to Create Your Own Hackathon: <https://dorahacks.io/blog/guides/how-to-create-a-hackathon>
- DoraHacks, Managing Your DIY Hackathon: <https://dorahacks.io/blog/guides/diy-your-hackathon>
- DoraHacks, Judging Guide for Hackathon Organizers: <https://dorahacks.io/blog/guides/judging-organizers>
- Systalink CADEV page FR: <https://systalink.com/fr/coupe-afrique-des-developpeurs-cadev>; EN: <https://systalink.com/en/coupe-afrique-des-developpeurs-cadev>
- Systalink home: <https://systalink.com/en>

Method note: the Systalink rules were read from the page's served JavaScript chunk, which contains the rules text rendered by the "Voir les conditions générales" dialog; no private or login-gated content was accessed. Nothing on the Datacloud platform (post-login) was checked.
