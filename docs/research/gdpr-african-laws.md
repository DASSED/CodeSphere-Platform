# GDPR and francophone African data-protection laws for CodeSphere

Research ticket: [#22](https://github.com/0xdaydy/systalink-challenge/issues/22) (child of security map [#20](https://github.com/0xdaydy/systalink-challenge/issues/20)). Researched 2026-10-03.

This is research, not legal advice. Section 9 lists what I believe needs a lawyer and what I could not verify.

## Question and scope

Does the GDPR apply to CodeSphere (developer Q&A, feed and hackathon platform for francophone Africa, hosted on a Systalink Cloud Server in Dakar)? Which local laws matter? What do they have in common (legal basis, consent, data-subject rights, cross-border transfers, breach notification, registration with the authority), and how do they differ from the GDPR?

Personal data in play: SSO identity (email, name, avatar), country/city, IP addresses and logs, API keys, user-generated content. Some members may live in the EU or be diaspora.

Per the follow-up instruction, **Senegal and Cote d'Ivoire are covered in depth** (sections 3 and 4). The other countries are covered at a lighter level (section 5).

## Method and source legend

Primary sources only: legal texts, official gazettes, authority and parliament sites, EU/AU/CoE institutional pages. Each claim carries one of these tags:

- **[P]** I read the legal text itself (official or near-official copy).
- **[P-OCR]** The official text is a scanned image; I OCR'd it myself (accents and spacing are poor, article numbers and key words were checked, but quotes are not guaranteed word for word). Re-check against the PDF before relying on a detail.
- **[S]** Secondary source (press, law-firm blog, aggregator). Used only where no primary text was reachable, and always flagged.
- **[P-gov]** Official government or agency summary rather than the legal text itself.
- **[U]** Unverified: I could not confirm it.

Money: the CFA franc is pegged to the euro at 655.957 XOF/EUR; the euro figures below are my own arithmetic, rounded.

## TL;DR

1. **The GDPR probably does not apply by default, but it can.** CodeSphere is not established in the EU, so only Art. 3(2) can reach it, and that requires *targeting* people in the EU (offering services to them, or monitoring their behaviour there). A French-language site open to anyone, with Africa as its market, is not enough; an EU member signing up is not enough; EU citizenship is irrelevant. Deliberate EU marketing, EUR pricing, EU-aimed hackathon tracks, or behavioural tracking of EU visitors would change that. [P]
2. **Senegalese law is the unavoidable home law.** Law 2008-12 applies to processing "on Senegalese territory" and to controllers using processing means located there (Art. 2). A Systalink server in Dakar triggers it regardless of who the users are. Its authority is the CDP. [P]
3. **Other countries' laws are mostly territorial too** (Cote d'Ivoire, Burkina Faso, Togo, Malabo Convention: processing on their territory / by controllers established there). The notable exception is **Cameroon's new law 2024/017**, whose scope literally covers processing of data of persons "established, residing or in transit" in Cameroon, with the 18-month grace period ended on 23 June 2026. Whether a foreign controller must comply in practice is a legal-advice question. [P-OCR]
4. **Common core across SN/CI/BF/TG/CM and Malabo:** consent as the default basis with a short list of exceptions (no "legitimate interests" ground), purpose limitation, minimisation, retention limits, security, information at collection, rights of access, objection, rectification and deletion, prior declaration or authorisation with the national authority, and restrictions on exporting data. [P]
5. **Big differences from the GDPR:** prior formalities with the authority (declaration/authorisation) instead of record-keeping; transfers often need the authority's involvement (information in Senegal, authorisation in CI, BF, CM); **no statutory breach-notification duty** in Senegal, Cote d'Ivoire, Burkina Faso, Togo or the Malabo text (Cameroon has one, "without delay"); lower fines (except Burkina's turnover-based fines); no DPIA/DPO regime in Senegal. [P]
6. **Practical stance:** build to the GDPR/Malabo common denominator (it is stricter than most local texts on rights and security), declare the processing to the CDP, treat Systalink as a processor under a written contract, minimise what leaves Senegal, and keep a breach procedure anyway (Cameroon, GDPR if triggered, and good practice).

## 1. Does the GDPR apply?

### 1.1 The test

GDPR Art. 3 has two limbs that matter here ([Regulation (EU) 2016/679, EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj)) [P]:

- Art. 3(1): the Regulation applies to processing "in the context of the activities of an establishment of a controller or a processor in the Union". CodeSphere has no EU establishment (hosting in Dakar, organisers in Senegal). Not triggered.
- Art. 3(2): it applies to processing of personal data "of data subjects who are in the Union by a controller or processor not established in the Union, where the processing activities are related to: (a) the offering of goods or services, irrespective of whether a payment of the data subject is required, to such data subjects in the Union; or (b) the monitoring of their behaviour as far as their behaviour takes place within the Union."

So a free developer platform counts as a "service" (payment is irrelevant), but the offer must be directed at people in the Union.

### 1.2 What the EDPB says about targeting

[EDPB Guidelines 3/2018 on the territorial scope of the GDPR (Article 3), final version, 12 Nov 2019](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_3_2018_territorial_scope_after_public_consultation_en_1.pdf) (landing page: [EDPB](https://www.edpb.europa.eu/documents/guideline/guidelines-32018-on-the-territorial-scope-of-the-gdpr-article-3-version-adopted_en)) [P]:

- **Nationality and residence do not matter, location does.** Art. 3(2) "is therefore not limited by the citizenship, residence or other type of legal status of the data subject"; the data subject must be "in the Union", assessed "at the moment when the relevant trigger activity takes place" (offering or monitoring).
- **Processing an EU person's data is not enough on its own.** "The fact of processing personal data of an individual in the Union alone is not sufficient to trigger the application of the GDPR"; the element of "targeting" "must always be present in addition".
- **Intent is required.** The provision targets activities that "intentionally, rather than inadvertently or incidentally, target individuals in the EU". If a service is offered only to people outside the EU and is not withdrawn when they travel to the EU, the GDPR does not apply (the guidelines' Example 8: an Australian news app used by a subscriber on holiday in Germany).
- **Mere accessibility is insufficient.** Citing Recital 23: "the mere accessibility of the controller's ... website in the Union, of an email address or of other contact details, or the use of a language generally used in the third country where the controller is established, is insufficient". Factors that *may* show intent include "the use of a language or a currency generally used in one or more Member States with the possibility of ordering goods and services in that other language, or the mentioning of customers or users who are in the Union".
- **Monitoring (Art. 3(2)(b))** is a separate route: tracking the behaviour of people located in the EU (analytics profiling, behavioural advertising, location tracking) can trigger the GDPR even without an "offer". Plain server logs of an occasional EU visitor are a weak case; deliberate behavioural profiling of EU visitors is a strong one. (My application of the guidelines; the exact line is a legal question.)
- If Art. 3(2) applies, the controller must in principle appoint an **EU representative** (Art. 27(1)), unless the processing is occasional, does not involve large-scale special-category data, and is unlikely to result in risk (Art. 27(2)(a)). It stays subject to its home-country law in addition ("in addition to being subject to its country's national law").

### 1.3 Applied to CodeSphere

| Scenario | GDPR applies? | Why |
|---|---|---|
| African developer signs up from Dakar, Abidjan, Douala | No | No EU data subject. |
| EU-resident member (diaspora in France) signs up on their own initiative | Probably no | Located in the EU, but CodeSphere did not target the EU; one such user is "incidental". Art. 3(2) needs an intentional offer or monitoring. |
| French-language UI | Not by itself | French is also the language of the target market; Recital 23 lists language as a factor only together with others (currency, EU mentions, ordering in that language). |
| Site marketed to the diaspora in France or EU, prices in EUR, EU testimonials, EU sponsors' tracks for EU developers | Likely yes | Looks like an offer envisaged to EU data subjects. |
| Behavioural analytics or ad-tech profiling of EU visitors | Possibly yes (3(2)(b)) | Monitoring of behaviour in the Union. |
| An EU-based hackathon organiser or sponsor receiving participant data as its own controller | Yes for that organiser | Establishment in the EU (Art. 3(1)). Joint-controller and data-sharing terms then matter. |

**Practical conclusion:** do not market to the EU, do not price in EUR, do not run behavioural tracking, and the GDPR should not apply. Even so, build to it (most of it is also in the African laws), because (a) the line is fact-specific, (b) diaspora growth could cross it, and (c) data flowing in from an EU controller (for example a sponsor) brings contractual GDPR obligations.

### 1.4 The reverse direction: EU rules on sending data to Africa

If an EU entity sends personal data *to* CodeSphere as a separate controller, the GDPR's transfer rules (Chapter V, Art. 44 and following) apply to *them*. No African country is on the European Commission's adequacy list, which currently covers Andorra, Argentina, Brazil, Canada (commercial), Faroe Islands, Guernsey, Israel, Isle of Man, Japan, Jersey, New Zealand, Korea, Switzerland, the UK, the US (DPF participants) and Uruguay ([Commission adequacy page](https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en); I read this list via a search result summary, the page itself did not load for me) [S/U]. So an EU partner would need SCCs or another Art. 46 safeguard. This only matters if a European partner shares participant data with us.

## 2. Which local laws could matter (overview)

The hooks that decide whether a law reaches CodeSphere are in the "Scope hook" column. All are read from the law text unless flagged.

| Country | Law | Authority | Scope hook for a foreign-run service | Status / notes |
|---|---|---|---|---|
| **Senegal** | Law 2008-12 of 25 Jan 2008 | CDP (Commission de protection des donnees personnelles) | Processing "on Senegalese territory" or by a controller using processing means located there, with a Senegal representative if not established (Art. 2) [P] | In force; revision bill pending since 2019 (see 3.9). **Applies to a Dakar-hosted service.** |
| **Cote d'Ivoire** | Law 2013-450 of 19 Jun 2013 | ARTCI (Autorite de regulation des telecommunications/TIC), data-protection arm at autoritedeprotection.ci | "Tout traitement de donnees mis en oeuvre sur le territoire national" (Art. 3) [P-OCR] | In force. Reaches a Dakar-hosted service only if processing happens in CI (for example CI-based team members or servers) [legal question]. |
| **Cameroon** | Law 2024/017 of 23 Dec 2024 | "Autorite de protection des donnees a caractere personnel", created by decree (Art. 53) | Any processing "de toute personne etablie, residant ou en transit au Cameroun" and by controllers established there (Art. 2) [P-OCR] | Grace period of 18 months (Art. 73) ended 23 Jun 2026. Whether the authority is operational: [U]. |
| **Burkina Faso** | Law 001-2021/AN of 30 Mar 2021 | CIL (Commission de l'informatique et des libertes) | Controller established in BF, or a non-established controller "qui met en oeuvre des operations de traitement a partir du territoire national" (Art. 3) [P] | In force; turnover-based fines (see 5.2). |
| **Togo** | Law 2019-014 of 29 Oct 2019 | IPDCP (Instance de protection des donnees a caractere personnel) | Same pattern as Senegal: processing on Togolese territory or using means located there (Art. 2) [P] | Authority reportedly started operating on 28 Mar 2025 [S]. |
| **Benin** | Law 2017-20 of 20 Apr 2018 (Code du numerique), Book V, revised by Law 2020-35 of 6 Jan 2021 | APDP | [U] (text not read) | Existence of law, authority, declaration duty, DPO and impact-assessment duties confirmed by a Beninese government agency note ([ASIN, July 2024](https://asin.bj/doc/57/download)) [P-gov, summary level]. |
| **Mali** | Law 2013-015 of 21 May 2013 | APDP | [U] | Authority operating since about 2016 [S]; primary text not obtained. |
| **Guinea** | Law L/2016/037/AN of 28 Jul 2016 (cybersecurity and data protection) | Authority provided for by the law [U] | [U] | Primary text download failed. |
| **African Union** | Malabo Convention (2014) | Each state's authority | Processing "undertaken in the territory of a State Party" (Art. 9.1(c)) [P] | In force since 8 Jun 2023; see section 6. |
| **Council of Europe** | Convention 108 | n/a | Treaty between states | Senegal is a party (in force for it on 1 Dec 2016) [S: CoE news items surfaced by search; the CoE parties page returned 403 to me]. Not directly binding on CodeSphere. |

**Reading for CodeSphere:** Senegal is the law that clearly applies today. Cote d'Ivoire, Burkina Faso, Togo and Malabo are territorial, so they matter if we process on their territory (not the case for a Dakar server, unless a processor or team member in those countries handles the data). Cameroon is the outlier with a data-subject-residence hook. Because users from Cameroon, Cote d'Ivoire and others will sign up, the safe design is "one policy that satisfies the strictest common requirements".

## 3. Senegal: Law 2008-12 in depth

Source: [Loi n° 2008-12 du 25 janvier 2008 sur la protection des donnees a caractere personnel (text copy on AFAPDP)](https://www.afapdp.org/wp-content/uploads/2018/05/Senegal-texte-de-loi-2008.pdf), also [WIPO Lex](https://www.wipo.int/wipolex/fr/legislation/details/6229). Authority site: [cdp.sn](https://www.cdp.sn) (a JavaScript app; I could not render its pages, so no CDP procedural text is cited from it). Implementing decree: n° 2008-721 of 30 Jun 2008, published in [JO n° 6443 of 20 Dec 2008](https://www.vie-publique.sn/documents/2156/jo-6443-du-20-decembre-2008) (not read) [P for the law, U for the decree].

### 3.1 Scope (Art. 2-3)

- Covers any collection, processing, transmission, storage or use of personal data by anyone, public or private (Art. 2.1), automated or not (2.2).
- Art. 2.3: any processing by a controller "sur le territoire senegalais ou en tout lieu ou la loi senegalaise s'applique".
- Art. 2.4: any processing by a controller "etabli ou non sur le territoire senegalais, qui recourt a des moyens de traitement situes sur le territoire senegalais" (transit-only excluded); such a controller "doit designer un representant etabli sur le territoire senegalais".
- Art. 3 excludes purely personal or household processing and technical temporary copies. A community platform is not "household".
- **Consequence:** a service run on a Systalink server in Dakar is in scope whatever nationality or residence the members have. Whoever decides the purposes (the CodeSphere team or organiser, to be pinned down) is the controller.

### 3.2 Principles and legal basis (Art. 33-39)

- Art. 33: processing is "legitime si la personne concernee donne son consentement", with exceptions where necessary for (1) a legal obligation, (2) a public-interest task, (3) performance of a contract or pre-contract steps requested by the person, (4) safeguarding the person's interests or fundamental rights. **There is no "legitimate interests" basis.**
- Art. 4.4 (definitions): consent is "toute manifestation de volonte expresse, non equivoque, libre, specifique et informee".
- Art. 34 lawful, fair processing; Art. 35 specified, explicit, legitimate purposes, adequate and not excessive data, and retention no longer than necessary; Art. 36 accuracy; Art. 37 transparency; Art. 38 confidentiality and security.
- Art. 39: when a processor is used, the controller "doit choisir un sous-traitant qui apporte des garanties suffisantes" and the processing must be governed by a **written contract** under which the processor acts only on instructions. **Systalink, as host, is a processor; this contract is a to-do.**
- Art. 40-41: processing revealing racial/ethnic/regional origin, political, religious or philosophical opinions, union membership, sex life, genetic data or health data is prohibited, with listed exceptions (for example manifestly made public by the person, explicit consent in the cases of Art. 41). CodeSphere should simply not collect these. (Free-text profiles could contain them; handle through user-content rules.)
- Art. 48: no decision with legal effect solely on automated profiling.
- The law sets no explicit age of consent for minors in the parts I read; the 2019 bill proposes 15 [S, see 3.9].

### 3.3 Formalities with the CDP (Art. 18-23)

- **Default regime: prior declaration** (Art. 18). The CDP acknowledges receipt and issues a **receipt (recepisse) within one month** (extendable once by reasoned decision); "seule la reception du recepisse donne droit a la mise en oeuvre d'un traitement". The declaration contains a commitment that the processing meets the law.
- Art. 19: the CDP may publish **simplified standards or exemptions** for common low-risk processing.
- **Prior authorisation** (Art. 20) for: genetic and health research data; offences and convictions; **interconnection of files**; national identification numbers or similar identifiers of general scope; **biometrics**; public-interest (historical/statistical/scientific) processing. Public-sector processing goes by regulatory act after CDP opinion (Art. 21).
- Art. 22: the filing must state the controller's identity (or its representative if not established), purposes, interconnections, data and categories of persons, **retention period**, services and people with access, recipients, the access-right contact, **security measures**, use of a processor, and **planned transfers to third countries**. A change requires a new filing; deletion of the processing must be notified.
- Art. 77: all processing had to comply within 1 year (private sector) or 2 years (public) of entry into force; those windows have long expired.
- The CDP publishes forms; a search-result summary points to [cdp.sn/liste-des-formulaires](http://cdp.sn/liste-des-formulaires) [S, not rendered by me]. A blog says the declaration burden was "eased in 2024" so that an internal register suffices for ordinary processing; **that contradicts the statute I read and I could not confirm it, so I do not rely on it** [U]. Practice from CDP deliberations shows it does sanction unregistered processing: see its 3 Apr 2014 warning to a telecom operator for failing to declare files and for sending commercial SMS without prior consent ([deliberation 2014-015, reproduced by OSIRIS](https://www.osiris.sn/Deliberation-no2014-015-CDP-du-3.html)) [S for the copy].

### 3.4 Cross-border transfers (Art. 49-51)

- Art. 49: transfer to a third country only "si cet Etat assure un niveau de protection suffisant de la vie privee, des libertes et droits fondamentaux"; and **"avant tout transfert ... le responsable du traitement doit prealablement informer la Commission des Donnees Personnelles"** (prior *information*, not authorisation). Sufficiency is judged on security measures, the processing's purposes and duration, and the nature, origin and destination of data.
- Art. 49 also says that **before any processing of personal data "provenant de l'etranger"**, the CDP must verify that the controller ensures a sufficient level of protection. Read literally this reaches foreign-origin data (EU diaspora, partner-supplied lists) processed in Senegal. How the CDP applies it in practice: [U].
- Art. 50: transfers to a country that is *not* sufficient are allowed if **one-off, non-massive** *and* the person expressly consented, or if necessary for one of: protecting life, public interest, legal claims, performing a contract with the person or pre-contract steps.
- Art. 51: the CDP can authorise a transfer or set of transfers to a non-adequate country on reasoned request when the controller offers sufficient safeguards.
- **For CodeSphere:** sending member data to US-based services (email delivery, error tracking, analytics, GitHub/Google/GitLab as identity providers where we push data back, AI providers) is a transfer. Systematic transfers are not covered by the one-off exceptions of Art. 50, so the clean route is to declare them in the filing (Art. 22.11), inform the CDP (Art. 49), keep them minimal, and ask the CDP (or counsel) whether a particular provider's country counts as sufficient. I did not find a published CDP list of "sufficient" countries [U].

### 3.5 Data-subject rights (Art. 58-69)

- **Information** at collection (Art. 58): controller identity and representative, purposes, data categories, recipients, whether answers are mandatory, the right to ask not to be on the file, access/rectification rights, **retention period**, planned transfers abroad.
- **Access** with a copy on request, at a cost not above reproduction cost (Art. 62-63); manifestly abusive requests may be refused (Art. 66).
- **Objection** "pour des motifs legitimes", plus a free right to object to marketing/third-party disclosure (Art. 68).
- **Rectification, completion, update, blocking or deletion** of inaccurate, incomplete, equivocal, outdated data, or data whose collection, use, disclosure or storage is prohibited; the controller must justify having done it, free of charge, **within one month** (Art. 69), and notify third parties it passed the data to.
- There is **no right to portability** and no right to restriction as such in the text I read.

### 3.6 Security, retention, breach (Art. 70-74)

- Art. 71: "toute precaution utile au regard de la nature des donnees" against alteration, damage and unauthorised access, with a list of measures (access control by person, audit trail of who read or entered what and when, preventing unauthorised media access, backups, and so on). This is a fairly concrete checklist that maps onto the security map's backlog (logging, access control, backups).
- Art. 72: no retention beyond what is necessary except for historical/statistical/scientific purposes.
- **No statutory data-breach notification duty** to the CDP or to individuals appears anywhere in the law (I searched the full text for notification and violation language). [P]

### 3.7 Sanctions (Art. 29-32, 75)

- The CDP can issue a warning and a formal notice (Art. 29); then, after adversarial proceedings, withdraw the authorisation provisionally (3 months, then definitively) and/or impose a **fine of 1 to 100 million XOF** (about 1,500 to 152,000 EUR) (Art. 30); in urgent cases it can stop the processing or block data for up to 3 months or ban a processing (Art. 31). Appeals go to the Conseil d'Etat (Art. 32).
- Criminal offences are in the Code penal and the cybercrime law (Art. 75); I did not read those provisions [U].

### 3.8 Ties to the AU and CoE instruments

- Senegal's Malabo ratification is dated 3 Aug 2016 and was deposited on 16 Aug 2016, per the [AU status list of 2 Feb 2026](https://au.int/sites/default/files/AFRICAN%20UNION%20CONVENTION%20ON%20CYBER%20SECURITY%20AND%20PERSONAL%20DATA%20PROTECTION%20%281%29.pdf) [P]. The Convention is in force since 8 Jun 2023 but needs national implementation; the 2008 law predates it.
- Senegal also joined CoE Convention 108 (in force for it 1 Dec 2016) [S].

### 3.9 Reform pending, and a new cyber law

- A bill to replace 2008-12 has been pending since 2019: it would rename the authority (ADPD), align with the GDPR, Convention 108 and Malabo, set the digital age of majority at 15 and bring in four security principles ([OSIRIS, 4 Mar 2020](https://osiris.sn/protection-des-donnees-a-caractere-personnel-la-loi-de-2008-jugee-obsolete-vers.html), [CIPESA, Jan 2020](https://cipesa.org/2020/01/le-senegal-va-reviser-la-loi-sur-la-protection-des-donnees-personnelles/)) [S]. A search summary says the CDP held a strategic workshop in October 2024 to finalise the bill [S]. I found **no evidence that it has been enacted** as of this research; check before launch [U].
- Separate and new: **Bill n° 25/2026 on protecting critical information infrastructures and digital security**, reported adopted by the National Assembly (OSIRIS, 21 Aug 2026), published as a [bill page on vie-publique.sn](https://www.vie-publique.sn/documents/14070/projet-loi-25-2026-assemblee-nationale-protection-infrastructures-information-critiques-securite-numerique) whose summary mentions 24-hour incident reporting by critical-infrastructure operators (Art. 35), storage of public data in Senegal (Art. 12) and penalties up to 800 million XOF or 5% of revenue [S: I read only the summary page and the OSIRIS article, not the bill text]. It targets designated critical operators, so it most likely does not bind CodeSphere directly, but it could bind the hosting provider and signals the direction of travel (incident reporting, data localisation). Worth a question to Systalink.

### 3.10 Senegal checklist for CodeSphere

1. Identify the **controller** (legal entity or named team) and a contact point; the map already says a formal DPO is out of scope.
2. File a **declaration with the CDP** before go-live (accounts/identity, logs, content, API keys, analytics), listing retention periods, security measures, processors and transfers (Art. 22).
3. Sign a **written processor contract with Systalink** (Art. 39) and with each foreign subprocessor; document transfers.
4. Show an **information notice at collection** with the Art. 58 content; collect **explicit, specific consent** where consent is the basis, and rely on "contract performance" (Art. 33.3) for core service features.
5. Implement **access, objection and deletion/rectification** flows with a one-month response target (Art. 69).
6. Avoid sensitive categories and avoid file interconnection and biometrics (they need authorisation).
7. Keep an incident procedure although the law has no notification duty.

## 4. Cote d'Ivoire: Law 2013-450 in depth

Source: [Loi n° 2013-450 du 19 juin 2013, Journal officiel de Cote d'Ivoire (8 Aug 2013), as hosted by the authority](http://www.autoritedeprotection.ci/docs/loi_2013_450_journal.pdf). The PDF is a scan; I OCR'd it, so quotes below are paraphrased and article numbers were cross-checked against the OCR text [P-OCR]. Authority site: [autoritedeprotection.ci](https://www.autoritedeprotection.ci/) (ARTCI, created by Ordinance 2012-293 of 21 Mar 2012 [S, from the site summary]). The site lists decree 2015-79 (filing, authorisation and withdrawal procedures) [S]; I did not read it.

### 4.1 Scope (Art. 3)

Covers any collection, processing, transmission, storage and use of personal data by people, State, local authorities and legal entities; automated or not; and "tout traitement de donnees mis en oeuvre sur le territoire national". It does not copy Senegal's "means located on the territory" limb in the portion I read, so, for a service hosted in Dakar, CI law applies only if processing occurs in CI (team members, servers, processors) [legal question]. It exempts purely private/household use, legally-published data, private registers, and processing where the controller designated a **data-protection correspondant** (see 4.3).

### 4.2 Principles and legal basis (Art. 14-15 and following)

- Art. 14: processing is legitimate if the person **"donne expressement son consentement prealable"**, with exceptions where the controller is duly authorised and processing is necessary for a legal obligation, a public-interest mission, performance of a contract or pre-contract steps, or protecting the person's interests or fundamental rights. Same shape as Senegal: **no legitimate-interests basis**.
- Sensitive data (racial/ethnic, political, religious, union, sex life, genetic, health) is prohibited with exceptions such as data manifestly made public or vital interests.
- Art. 15: lawful, fair processing. A minor is defined as someone under 18 (definitions) [P-OCR].
- Direct marketing by automated means without prior consent is a criminal offence (Art. 22: prison of 1 to 5 years and a fine of 1 to 10 million XOF) [P-OCR]. Relevant for newsletters and hackathon announcements.

### 4.3 Formalities with ARTCI (Art. 5-12)

- Art. 5: processing is subject to **prior declaration**; ARTCI issues a **receipt, possibly electronically**; the controller may start on receiving it and stays liable. One declaration may cover several related processings.
- Art. 6: exemption from prior declaration for, among others, processing for which the controller **designated a correspondant a la protection des donnees** who independently ensures compliance, **except where a transfer to a third country is planned**. Art. 12: the correspondant must be qualified, keeps the list of processings, cannot be sanctioned for doing the job, and is notified to ARTCI. The site has a correspondant registration section [S, homepage summary].
- Art. 7: **prior authorisation** is required for genetic/medical/research data, offences and convictions, **national identification numbers or similar identifiers (explicitly including phone numbers)**, **biometrics**, public-interest processing and **"le transfert de donnees a caractere personnel envisage a destination d'un pays tiers"**.
- Art. 11: ARTCI decides within one month (extendable by one month); **silence counts as rejection**, with a court appeal.
- Art. 9 content of the filing: controller identity (or representative), purposes, interconnections, data and categories, retention period, services with access, recipients, access-right contact, security measures, use of a processor **or transfer to a third country**.
- Art. 53: transition of 6 months from entry into force (expired).
- A 2015 press piece reports that ARTCI made prior declaration or authorisation mandatory for databases of clients/users, direct marketing, biometrics, geolocation and international transfers ([CIO Mag, 12 Jun 2015](https://cio-mag.com/cote-divoire-artci-le-traitement-des-donnees-personnelles-desormais-soumis-a-une-autorisation-prealable)) [S].

### 4.4 Cross-border transfers (Art. 26)

A controller may transfer data to a third country only if that state ensures a protection level **"superieur ou equivalent"** to Ivorian protection, and "avant tout transfert effectif", it must **obtain ARTCI's authorisation**; such transfers are subject to regular control by ARTCI. Among ARTCI's missions is authorising cross-border transfers "dans des conditions fixees par decret" [P-OCR]. This is stricter than Senegal (prior authorisation vs. prior information) and stricter than the GDPR's adequacy-or-safeguards model, which needs no authority approval.

### 4.5 Rights (Art. 28-30 and following)

- Information at collection (Art. 28): identity, purposes, categories, recipients, possibility of refusing to be on the file, access and rectification rights, **retention period**, planned transfers abroad.
- Access "sous forme de questions" (Art. 29); objection "pour des motifs legitimes" and a free right to object to marketing use by third parties (Art. 30); rectification, completion, update, blocking or deletion (Art. 31); post-mortem updating by heirs (Art. 32).
- **Erasure and cessation of dissemination** (Art. 33) when data are no longer necessary, consent is withdrawn or the retention period expires, the person objects, processing is unlawful, "ou pour tout autre motif legitime", with specific mention of data the person made available **as a minor**.
- **Portability**: the last paragraph of Art. 33 gives a right to receive data the person supplied (processing based on consent or contract) in a commonly used electronic format and transmit it to another system. So Cote d'Ivoire is closer to the GDPR on rights than Senegal.
- Art. 25: no judicial, administrative or private decision with legal effect based solely on automated profiling.
- Controllers can refuse manifestly abusive requests, burden of proof on them (Art. 29 area) [P-OCR; article numbers inferred from OCR order, verify].

### 4.6 Security, breach, sanctions

- Security and confidentiality obligations are present: Art. 24 (choose a processor with sufficient guarantees for protection and confidentiality; both sides responsible for compliance) and the adjacent articles [P-OCR].
- **No statutory breach-notification duty found** in the OCR'd text (searched for violation/notification terms). OCR quality is limited, so I would verify against the scan or a lawyer [P-OCR / U].
- Sanctions by ARTCI (Art. 51): provisional or definitive withdrawal of the authorisation, and a **pecuniary penalty up to 10 million XOF** (about 15,000 EUR); on repeat within 5 years up to **100 million XOF, or for a company up to 5% of last year's turnover excluding tax, capped at 500 million XOF** (about 762,000 EUR). Administrative sanctions are without prejudice to criminal penalties, for example Art. 21 (10 to 20 years of prison and 20 to 40 million XOF for collecting or processing the sensitive categories, such as racial/ethnic origin, political or religious opinions, health), and Art. 45 (1 month to 2 years and 1 to 10 million XOF for obstructing ARTCI) [P-OCR]. These criminal levels are far above the GDPR-style administrative fines and are a reason to keep CodeSphere away from sensitive categories.

### 4.7 Cote d'Ivoire and the AU/CoE

Cote d'Ivoire ratified the Malabo Convention on 8 Mar 2023 and deposited the instrument on 3 Apr 2023 (AU status list, see section 6). Like Senegal's, its 2013 law predates Malabo's entry into force (8 Jun 2023).

## 5. Other countries (lighter coverage)

### 5.1 Cameroon: Law 2024/017 of 23 Dec 2024

Source: [Presidency of the Republic, certified copy](https://www.prc.cm/fr/multimedia/documents/10258-loi-n-2024-017-du-23-12-2024-web) (scanned; OCR'd by me, **[P-OCR]**). This is the most GDPR-like of the African texts and the newest.

- **Scope (Art. 2):** processing by the State and any natural or legal person; processing of data "de toute personne etablie, residant ou en transit au Cameroun"; by controllers or processors established in Cameroon; and in territories where Cameroonian law applies. Residence of the data subject is therefore a hook, which differs from the territorial laws above.
- **Consent (Art. 9):** "prealable, libre, eclaire, specifique et univoque", with exceptions for a legal obligation, a public-interest mission and protecting health. In the OCR text I did **not** see "contract performance" or "legitimate interests" in that list [verify]. Consent of a minor under 18 requires a parent or legal representative. Processing without prior consent is prohibited (Art. 50).
- **Formalities:** **prior authorisation** from the authority for processing (Art. 19, modalities by regulation; Art. 49 prohibits processing without prior authorisation). Interconnection of sensitive-data or minors' files also needs authorisation. A controller keeps a **register of processing activities** (Art. 29). High-risk processing needs a **prior impact assessment** (Art. 33). Certification mechanism foreseen (Art. 34).
- **Transfers (Art. 32):** subject to **prior authorisation**; the authority checks an adequate level of protection, a signed legal instrument with the destination country, binding security rules for the importer, and **standard contractual clauses** published by the authority. The authority is to publish a list of countries considered equivalent (Art. 53).
- **Breach (Art. 22):** on becoming aware of any violation of personal data, the controller or processor must inform "sans delai" the authority **and** the data subject. No fixed number of hours. Definition of violation in Art. 5.
- **Rights:** information, access, objection, deletion and cessation of dissemination, rectification, **portability** (Art. 43), objection to solely automated decisions including profiling, restriction (Art. 46), post-mortem directives (Art. 45). Right to erasure with a "droit a l'oubli numerique" (Art. 23, 37-38).
- **Authority (Art. 53):** an independent public body whose creation and operation are fixed by presidential decree. A trade-press headline says the authority has been created ([Digital Business Africa](https://www.digitalbusiness.africa/cameroun-lautorite-de-protection-des-donnees-a-caractere-personnel-creee/)); I did not verify the decree or whether it is operating [S/U].
- **Sanctions:** formal notice of up to 10 days, then a penalty up to 100,000 XOF per day of delay, then suspension or withdrawal of the authorisation or a ban on processing (Art. 54); fines for processing without authorisation 5 to 50 million XOF (Art. 55) and more for illegal transfers without authorisation 10 to 50 million XOF (Art. 60); legal entities can be fined 50 million to 1 billion XOF criminally (Art. 71).
- **Transition (Art. 73):** 18 months from promulgation to comply, i.e. until 23 June 2026. That date has passed.
- Press reports mention a DPO duty for large telecom/banking/insurance operators [S]; I did not locate it in the articles I read.

### 5.2 Burkina Faso: Law 001-2021/AN

Source: [Assemblee nationale du Burkina Faso, official text](https://assembleenationale.bf/storage/Loi/kDsWHXOTUCQFVESChh8BlBdiZnCrdTsOpXe1rzmH.pdf) [P].

- Scope (Art. 3): controller established in BF, or a non-established controller or processor carrying out processing "a partir du territoire national".
- Consent-centric with a "droit a l'oubli" for data made public (Art. 22), security duties (Art. 10, 24), and retention limits (Art. 25).
- Formalities: declaration by default with simplified declarations for standard categories; receipt delivered without delay and processing can begin on receipt (Art. 33). **Authorisation** for genetic/biometric data in the private sector, offences, interconnection, national identifier, **AI-based predictive decision support**, and **transfers to a foreign country** (Art. 31).
- **Transfers (Art. 42-44):** only to a country with an adequate level of protection and, **before any transfer, the controller must obtain the CIL's authorisation, sign confidentiality and reversibility clauses, and implement security measures including encryption**. Derogations (Art. 44) include specific consent after risk information, contract necessity, and so on.
- Health data of individuals must be hosted on national territory unless derogated (Art. 37).
- **Sanctions (Art. 63-65):** formal notice, order to stop, blocking of data, a "flat" administrative fine, withdrawal of authorisation. Art. 65 sets the fine at **1% of last year's turnover excluding tax for a first breach and 5% for a repeat**, plus criminal fines and prison terms set in the penal chapter (not read in detail). Sanctions can be appealed before the administrative court (Art. 64). I found **no breach-notification article** in the text [P].

### 5.3 Togo: Law 2019-014

Source: [Journal officiel de la Republique togolaise, 29 Oct 2019](https://www.afapdp.org/wp-content/uploads/2020/02/TOGO-JOS_29_10_2019-64E-ANNEE-N°26-TER.pdf) [P].

- Almost a copy of the Senegal model: scope on Togolese territory or means (Art. 2); declaration with receipt within one month (Art. 6), authorisation list (Art. 8); consent with the same four exceptions (Art. 14); transfers to a third country only if protection is sufficient and after informing the authority, which gives a reasoned opinion (Art. 28), one-off exceptions (Art. 29), authority-approved transfers to non-adequate countries (Art. 30), plus a check for data coming from abroad (Art. 31); security checklist (Art. 52); right of access, opposition, rectification/deletion and effacement (Art. 39-50).
- Criminal sanctions include prison of 1 to 5 years and fines of 5 to 20 million XOF for ignoring objection rights in marketing.
- Authority: IPDCP; operational start reported on 28 Mar 2025 [S]. No breach-notification article found [P].

### 5.4 Benin, Mali, Guinea

I could not retrieve usable primary texts for these three in the time available (scanned or truncated files).

- **Benin:** Book V of the Digital Code, revised in 2021; authority APDP; obligations listed by a Beninese government agency include declaration of processing with the APDP, information, registers, annual report, DPO designation and impact assessment "where needed" ([ASIN note, July 2024](https://asin.bj/doc/57/download)) [P-gov, summary]. Full text: [sgg.gouv.bj](https://sgg.gouv.bj/doc/loi-2017-20/download) (not read).
- **Mali:** Law 2013-015 and APDP; summaries only [S]. Also of note: an APDP fine against a company was reported by press [S].
- **Guinea:** Law L/2016/037/AN combining cybersecurity and data protection; copy held by the [WHO legal database](https://extranet.who.int/cpcd/health-legislation/loi-2016037an-relative-la-cyber-securite-et-la-protection-des-donnees-caractere) (download failed) [U].

If members from these countries matter for the demo, ask counsel for a one-page check; the common core in section 7 should cover the main points.

## 6. The Malabo Convention (African Union)

Sources: [AU treaty page](https://au.int/en/treaties/african-union-convention-cyber-security-and-personal-data-protection) (adopted 27 Jun 2014); [status list dated 2 Feb 2026](https://au.int/sites/default/files/AFRICAN%20UNION%20CONVENTION%20ON%20CYBER%20SECURITY%20AND%20PERSONAL%20DATA%20PROTECTION%20%281%29.pdf); official English PDF is image-only so I read a [Laws.Africa copy hosted by TanzLII](https://media.tanzlii.org/media/legislation/328847/source_file/9f2fc21813251af6/2014-cyber-security-and-personal-data-protection.pdf) [P, text copy; check wording against the AU PDF].

- **Status:** in force since **8 Jun 2023** (after the 15th ratification deposit). As of 2 Feb 2026: 55 AU states listed, 21 signatures, **20 ratifications**. Relevant ratifications deposited: **Senegal (16 Aug 2016), Guinea (16 Oct 2018), Niger (16 Mar 2022), Togo (19 Oct 2021), Cote d'Ivoire (3 Apr 2023), Benin (12 Nov 2024)**. **Cameroon has signed (12 Aug 2021) but not ratified; Burkina Faso and Mali: no entry.** My reading of the garbled table: I extracted rows in order from the PDF text; the 20-ratifications total matches the document's own note, which supports the reading [P with a caveat].
- **It is a treaty between states, not a law that binds a company directly.** States must have a framework and an independent authority; companies are bound through national laws.
- **Scope (Art. 9):** processing "undertaken in the territory of a State Party", plus processing by persons, State, local communities and public or private bodies. Territorial, like most francophone laws.
- **Prior formalities (Art. 10):** declaration by default; authorisation for genetic/health research, offences, interconnection and national identifiers, biometrics, public-interest processing; an authority may publish simplifying standards; the filing includes the planned **transfer to a non-AU third country, subject to reciprocity**.
- **Authority (Art. 11-12):** independent; powers include warnings, formal notices, withdrawal of authorisations, fines, emergency suspension, and **authorising trans-border transfers**.
- **Principles (Art. 13):** consent and legitimacy (exceptions: legal obligation, public-interest task, contract, protecting vital interests), lawfulness and fairness, purpose limitation, minimisation, retention limits, accuracy, transparency, confidentiality and security (including choosing a processor with sufficient guarantees).
- **Sensitive data (Art. 14):** prohibited with a list of exceptions; no solely automated legal decisions; **transfer to a non-AU state only if it ensures an adequate level of protection, unless the controller requests the national authority's authorisation first** (Art. 14.6).
- **Rights (Art. 16-19):** information, access, objection (including free objection to marketing), rectification/erasure.
- **Obligations (Art. 20-23):** confidentiality, security, storage limits, sustainability.
- **No breach-notification obligation** in the personal-data part of the text I read; no DPO, DPIA or portability provisions. [P]

## 7. Common obligations (the practical core)

| Topic | What most of SN, CI, BF, TG, CM and Malabo require |
|---|---|
| Legal basis | **Consent is the rule**, with exceptions: legal obligation, public-interest task, contract (not in the Cameroon text I read), protection of vital interests/rights. **No "legitimate interests" basis.** Consent is express, free, specific, informed. |
| Purpose, minimisation, retention | Defined purposes; adequate and not excessive data; keep no longer than necessary. |
| Transparency | Information at collection: controller, purposes, categories, recipients, whether replies are mandatory, retention, rights, planned transfers. |
| Data-subject rights | Access (with copy), objection for legitimate reasons (and free opt-out of marketing), rectification, deletion/blocking. Cote d'Ivoire adds erasure and portability; Cameroon adds portability, restriction, post-mortem and automated-decision rights. |
| Sensitive data | Prohibited by default, with exceptions; authorisation for biometrics, health research, offences, national identifiers. |
| Security | Duty to protect against alteration, loss and unauthorised access; processor must offer guarantees under a written contract. Senegal and Togo list concrete measures (access control, audit trail, backups). |
| Registration | Prior declaration (default) or authorisation (sensitive cases) with the national authority, stating retention, security, processor use and planned transfers. A correspondant/DPO can replace declaration in CI. |
| Cross-border transfers | Only to countries with sufficient/adequate protection, plus an authority step: **inform** (SN, TG), **authorise** (CI, BF, CM; Malabo for non-AU states). Exceptions for one-off, non-massive, consented or contract-necessary transfers. |
| Breach notification | **Not a general statutory duty** in SN, CI, BF, TG or the Malabo text. **Cameroon requires** informing the authority and the person "sans delai". The GDPR requires 72 hours. |
| Sanctions | Authority warnings, formal notices, withdrawal of authorisation, fines (SN up to 100 million XOF; CI up to 10 million, repeat up to 100 million or 5% of turnover capped at 500 million; BF 1%/5% of turnover; CM per article), plus criminal penalties. |

## 8. Differences from the GDPR

| Topic | GDPR | Senegal 2008-12 | Cote d'Ivoire 2013-450 | Cameroon 2024/017 | Malabo |
|---|---|---|---|---|---|
| Territorial reach | Establishment in EU, or targeting/monitoring people in the EU (Art. 3) | Territory or means in Senegal; representative if not established (Art. 2) | Processing on national territory (Art. 3) | Territory, establishment, or data subject established, resident or in transit (Art. 2) | Processing in a State Party's territory (Art. 9) |
| Legal bases | Six equal bases incl. **legitimate interests** (Art. 6) | Consent + 4 exceptions (Art. 33) | Consent + exceptions (Art. 14) | Consent + legal duty, public interest, health (Art. 9) | Consent + 4 exceptions (Art. 13) |
| Registration | **None**; records of processing (Art. 30), DPIA for high risk | **Declaration** or authorisation before processing | Declaration or authorisation; correspondant can replace declaration (not for transfers) | **Authorisation**; register; DPIA | Declaration/authorisation |
| Transfers | Adequacy, SCCs/BCRs, derogations (Art. 44-49); no authority approval needed for SCCs | Sufficient protection + **inform CDP**; CDP may authorise others | Equivalent-or-better protection + **ARTCI authorisation** | **Authorisation**, SCCs from the authority | Adequate protection or **authority authorisation** |
| Breach notification | **72 h** to authority; to individuals if high risk (Art. 33-34) | None | None found | **"Sans delai"** to authority and person | None |
| Rights | Access, rectification, erasure, restriction, **portability**, objection, automated decisions (Art. 12-22) | Information, access, objection, rectification/deletion (no portability) | Information, access, objection, rectification, **erasure** (incl. data given as a minor) and **portability** | Close to GDPR, incl. portability and restriction | Information, access, objection, rectification/erasure |
| DPO | Mandatory in defined cases (Art. 37) | Not in the law | Optional "correspondant" with declaration relief | Reported for large sectors [S] | Not in the text |
| Children | Digital consent 16, states may lower to 13 (Art. 8) | Not set in the law | Minor = under 18 | Under 18 needs parental consent | Not set |
| Fines | Up to 20 M EUR or 4% worldwide turnover (Art. 83) | 1 to 100 million XOF (about 1,500 to 152,000 EUR) | Up to 10 M XOF; repeat up to 100 M XOF or 5% turnover (cap 500 M XOF) | Fines 5 to 50 M XOF plus per-day penalties; criminal fines to 1 bn XOF for legal entities | Per state law |
| Authority | Independent DPAs, one-stop-shop | CDP | ARTCI | Authority created by decree (status [U]) | Each state |

The GDPR is generally **more demanding on accountability** (DPIA, records, 72-hour breach notice, privacy by design, portability) and **less bureaucratic on registration and transfers** (no mandatory declaration, no authority approval for SCC-based transfers). The African texts are more front-loaded on the authority's prior involvement and lighter on breach and accountability duties, with Cameroon moving toward the GDPR model.

## 9. Candidate requirements for the security map (inputs, not decisions)

These follow from the findings and map to the open items in map #20 (incident response, processing register and impact assessment, backups and encryption). They are for the map owner to accept or reject.

1. **Declare the processing to the CDP** before the public demo; keep a processing register (also needed by the Cameroon and GDPR models).
2. **Written processor contract with Systalink**, and a short list of sub-processors with the countries they sit in.
3. **Consent and notice screens** with the Art. 58-style content; consent for newsletters and non-essential analytics, separate from core service ("contract") processing.
4. **Rights endpoints** (export, correction, deletion, objection to marketing) with a one-month response SLA; log requests.
5. **Anonymisation on account deletion** (already decided in the glossary) is compatible with the right to deletion only if it is truly irreversible: under GDPR Recital 26, data "rendered anonymous in such a manner that the data subject is not or no longer identifiable" is outside the Regulation, but identifiability is judged on "all the means reasonably likely to be used". Senegal's Art. 69 speaks of deletion ("supprimees"); whether anonymisation satisfies the CDP is [U] and a question for counsel. Keep authored Q&A content from being re-identifiable by profile links.
6. **Incident procedure** with a 72-hour internal target (GDPR) and "without delay" notice to the authority and users (Cameroon), even though Senegal has no statutory duty.
7. **Minimise outbound transfers** (email, logs, analytics, AI providers) and record them in the CDP filing. I found no published list of countries the CDP or ARTCI treat as "sufficient", so ask the CDP which providers' countries are acceptable before choosing sub-processors.
8. **Age gate**: ask for 18+ or parental consent (Cote d'Ivoire and Cameroon treat minors as under 18; the GDPR digital-consent age is 16 unless lowered).
9. **Retention periods** stated per data class (logs, IPs, API-key metadata), as the filing requires them.
10. **Do not target the EU** (no EUR pricing, no EU-directed marketing, no behavioural ad tech); revisit if the hackathon opens an EU track.

## 10. Legal-advice questions and what I could not verify

**Questions for a lawyer (do not treat this document as an answer):**

- Who is the controller and the declarant (organiser, team, a company)? Is a Senegalese representative needed?
- Does Senegal Art. 49 (prior information of the CDP, and CDP verification for foreign-origin data) apply to our expected flows, and which countries does the CDP treat as sufficient? Are SSO profile data pulled from GitHub/GitLab/Google a "transfer"? Are our outbound services?
- Does the Cameroon residence hook bind a Senegal-hosted foreign controller in practice, and is its authority operating? Same question for any Ivorian element (CI-based processing).
- Is anonymisation on deletion acceptable under Senegal Art. 69 and similar provisions?
- Does the GDPR's targeting test apply if the hackathon is promoted in France or to diaspora communities?
- Does the new Senegalese digital-security law (bill 25/2026) bind the hosting provider or us (incident reporting, in-country data storage)?
- Whether the CDP expects a declaration for a pre-launch demo, and how fast it responds.

**Not verified or not reached:**

- The CDP website (cdp.sn) is a JavaScript app that did not render for me: no CDP procedure pages, forms, fees or adequacy list were read. The claim that Senegal "eased" declaration in 2024 comes from a blog and conflicts with the statute.
- Senegal's Code penal provisions on data offences, the 2008-721 decree, and the status of the revision bill after 2024.
- Cote d'Ivoire's text is an OCR of a scan: article numbers are reliable, wording of some quotes is approximate, and the "no breach notification" finding rests on OCR search. Decrees 2015-79 and 2015-812 were not read; ARTCI fees are unknown.
- Cameroon's text is also OCR; the authority's creation decree and operational status are unverified, and the DPO duty reported in press was not located.
- Benin, Mali and Guinea primary texts were not read.
- The Malabo reading comes from a third-party copy of the text (the AU PDF is image-only) and a status table whose columns I reconstructed from raw PDF text.
- The EU adequacy list and Senegal's Convention 108 status come through search summaries because the pages did not load.
- Togo's IPDCP start date and Mali's APDP operating date are from secondary sources.

## Sources

Primary and near-primary:

- GDPR text: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- EDPB Guidelines 3/2018: https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_3_2018_territorial_scope_after_public_consultation_en_1.pdf
- Senegal Law 2008-12: https://www.afapdp.org/wp-content/uploads/2018/05/Senegal-texte-de-loi-2008.pdf and https://www.wipo.int/wipolex/fr/legislation/details/6229
- Senegal CDP: https://www.cdp.sn
- Senegal Bill 25/2026: https://www.vie-publique.sn/documents/14070/projet-loi-25-2026-assemblee-nationale-protection-infrastructures-information-critiques-securite-numerique
- Cote d'Ivoire Law 2013-450: http://www.autoritedeprotection.ci/docs/loi_2013_450_journal.pdf (authority site https://www.autoritedeprotection.ci/lois/)
- Cameroon Law 2024/017: https://www.prc.cm/fr/multimedia/documents/10258-loi-n-2024-017-du-23-12-2024-web
- Burkina Faso Law 001-2021/AN: https://assembleenationale.bf/storage/Loi/kDsWHXOTUCQFVESChh8BlBdiZnCrdTsOpXe1rzmH.pdf
- Togo Law 2019-014 (JO 29 Oct 2019): https://www.afapdp.org/wp-content/uploads/2020/02/TOGO-JOS_29_10_2019-64E-ANNEE-N°26-TER.pdf
- Benin ASIN note: https://asin.bj/doc/57/download ; Benin Code du numerique: https://sgg.gouv.bj/doc/loi-2017-20/download
- Malabo Convention (AU): https://au.int/en/treaties/african-union-convention-cyber-security-and-personal-data-protection ; status list: https://au.int/sites/default/files/AFRICAN%20UNION%20CONVENTION%20ON%20CYBER%20SECURITY%20AND%20PERSONAL%20DATA%20PROTECTION%20%281%29.pdf ; text copy: https://media.tanzlii.org/media/legislation/328847/source_file/9f2fc21813251af6/2014-cyber-security-and-personal-data-protection.pdf
- EU adequacy page: https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/adequacy-decisions_en
- CoE Convention 108 parties: https://www.coe.int/en/web/data-protection/convention108/parties

Secondary (flagged in the text):

- OSIRIS, Senegal law 2008 "obsolete": https://osiris.sn/protection-des-donnees-a-caractere-personnel-la-loi-de-2008-jugee-obsolete-vers.html
- CIPESA, Senegal to revise: https://cipesa.org/2020/01/le-senegal-va-reviser-la-loi-sur-la-protection-des-donnees-personnelles/
- OSIRIS on Bill 25/2026: https://www.osiris.sn/securite-numerique-l-assemblee-renforce-le-cadre-juridique-contre-les.html
- OSIRIS copy of CDP deliberation 2014-015: https://www.osiris.sn/Deliberation-no2014-015-CDP-du-3.html
- CIO Mag on ARTCI (2015): https://cio-mag.com/cote-divoire-artci-le-traitement-des-donnees-personnelles-desormais-soumis-a-une-autorisation-prealable
- Digital Business Africa on Cameroon's authority: https://www.digitalbusiness.africa/cameroun-lautorite-de-protection-des-donnees-a-caractere-personnel-creee/
