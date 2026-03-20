# NEON DESCENT — Komplett Asset-plan

> Alla assets designade for 360x640px logisk canvas, 30x30px tile-grid, neon-cyberpunk estetik.
> Sprites ar pixel art-stil med glow-effekter. Musik ar synth-driven och adaptiv.

---

## INNEHALL

1. [Tiles](#1-tiles)
2. [Bakgrunder](#2-bakgrunder-per-biom)
3. [Spelarsprites](#3-spelarsprites)
4. [Fiendesprites](#4-fiendesprites)
5. [Projektiler & Vapen-VFX](#5-projektiler--vapen-vfx)
6. [Pickups & Items](#6-pickups--items)
7. [UI-element](#7-ui-element)
8. [Partikeleffekter / VFX-sprites](#8-partikeleffekter--vfx-sprites)
9. [Musik](#9-musik)
10. [Ljudeffekter (SFX)](#10-ljudeffekter-sfx)

---

## 1. TILES

**Storlek:** 30x30px per tile. Varje tile-typ behover varianter per biom (6 biom).

### 1.1 SOLID (Vagg/Mark)

| Biom | Filnamn | Storlek (per tile) | Storlek (sheet, 4 varianter) | Beskrivning | Kansla |
|------|---------|-------------------|-------------------------------|-------------|--------|
| Surface Fracture | `solid_surface.png` | 30x30px | 120x30px | Sprucken betong/metall i morkbla/gra toner (#1a2a3a). Tunna cyan-sprickor som avger svagt ljus. Industriella paneler med synliga nitar. | Overgivet, kallt, precis under ytan — civilisationen ar borta men dess sprickor lever. |
| Neon Gut | `solid_neon_gut.png` | 30x30px | 120x30px | Organiskt material i mork-lila (#2a1a32). Pulserande magenta-vener som loper genom ytan. Biotisk textur, som insidan av en levande varelse. | Obehaglig, levande, som att falla genom en gigantisk organisms innanmate. |
| Data Crypt | `solid_data_crypt.png` | 30x30px | 120x30px | Mork grasgron kretskort-textur (#122a1a). Lysande grona nodslingor och miniatyrtransistorer. Hexagonalt grid-monster. | Kliniskt, digitalt, arkiverat — data har blivit fysisk materia. |
| Hollow Market | `solid_hollow_market.png` | 30x30px | 120x30px | Sliten mork-lila sten (#1e1830). Svaga guld/amber detaljer — gamla skyltar, myntsymboler infallda i vaggarna. | Mystiskt, gammalt, en underjordisk basar som tid glomt. |
| Molten Grid | `solid_molten_grid.png` | 30x30px | 120x30px | Brant, morkbrun sten (#2a2010) med orange-glodande sprickor. Lava syns bakom flagor av sval sten. Varmeskendetaljer. | Intensivt, farligt, temperaturen stiger — nara karnans smaltpunkt. |
| Void Core | `solid_void_core.png` | 30x30px | 120x30px | Nastan svart (#2a1412) med blodroda pulserande adror. Kristallina fragment med inverterad glow. Geometrin kanns "fel". | Kosmisk skrack, avslutet, djupets karna — verkligheten bryter samman. |

**Varianter:** 4 varianter per biom (tileable), packade horisontellt i sheet (120x30px). Slumpmassigt val vid rendering for att undvika repetition.

**States:** Ingen animation, men en subtil **shimmer-variant** (2 frames, 500ms loop, sheet: 60x30px) for tiles nara hazards som reflekterar narliggande glow.

---

### 1.2 PLATFORM (Envagsplattform)

| Biom | Filnamn | Storlek (per tile) | Storlek (sheet: idle + 3 landing frames) | Beskrivning | Kansla |
|------|---------|-------------------|------------------------------------------|-------------|--------|
| Surface Fracture | `platform_surface.png` | 30x30px | 120x30px | Tunn metallbjalk (#334455) med cyan LED-strip langs ovankanten. Svaga dammpartiklar runt kanterna. | Utilitaristisk, funktionell — en gangbro som haller ihop pa ren traghetsmoment. |
| Neon Gut | `platform_neon_gut.png` | 30x30px | 120x30px | Horisontal organism-gren i lila (#553366). Magenta-lysande membran langs toppen. Kanns mjuk men statisk. | Ekligt organisk, som att sta pa en nerve-strand. |
| Data Crypt | `platform_data_crypt.png` | 30x30px | 120x30px | Flytande databar i teal (#225533). Rullande gron-text (matrisstil) i miniatyr. Smal, precis. | Ren data manifesterad som fast yta — geometriskt exakt. |
| Hollow Market | `platform_hollow_market.png` | 30x30px | 120x30px | Sliten tradisk (#443366). Svaga mystiska symboler/runer i guld. Flagad fernissa. | En gammal marknadshylla — det som en gang saldes har ar borta. |
| Molten Grid | `platform_molten_grid.png` | 30x30px | 120x30px | Metallroster (#554422) med orange glow underfran. Antydan av varmeskimmer. | Varm metall som snart kommer smalta — sista stabila ytan innan lavan. |
| Void Core | `platform_void_core.png` | 30x30px | 120x30px | Fragmenterad kristall (#553322) med rod inre glow. Kanterna ar "glitchiga", skiftande. | Instabil verklighet — plattformen existerar bara for att nagot vill att den ska gora det. |

**States:** Idle (1 frame, 30x30px) + **landing-pulse** (3 frames, 100ms, sheet: 90x30px): subtil glow-expansion nar spelaren landar. Totalt 4 frames i 120x30px sheet.

---

### 1.3 HAZARD (Skadetile)

| Biom | Filnamn | Storlek (per frame) | Storlek (sheet, 4 frames) | Beskrivning | Kansla |
|------|---------|--------------------|-----------------------------|-------------|--------|
| Surface Fracture | `hazard_surface.png` | 30x30px | 120x30px | Rad elektriska kablar (#ff2244) med gnistor. Varningstejp-monster i gult/svart runt kanterna. | Industriolycka — detta ar inte menat att vara har. |
| Neon Gut | `hazard_neon_gut.png` | 30x30px | 120x30px | Lysande magenta syrapol (#ff44aa). Bubblar sakta. Toxiskt sken. | Gift, infektion — den levande strukturen ar sjuk. |
| Data Crypt | `hazard_data_crypt.png` | 30x30px | 120x30px | Lila korruptionsrutor (#cc44ff). Glitch-artifacts, skiftande pixlar. | Korrupt data — kontakt innebar att din data ocksa korrumperas. |
| Hollow Market | `hazard_hollow_market.png` | 30x30px | 120x30px | Mystisk orange eldcirkel (#ff8844). Flammande symboler. Uralda fallor. | Magisk falla — nagon satte denna har for lang sedan och den fungerar fortfarande. |
| Molten Grid | `hazard_molten_grid.png` | 30x30px | 120x30px | Oppen lavayta (#ff6622) med glodande kanter. Varmedistortion. | Ren smalt metall — det finns inget mellanting har. |
| Void Core | `hazard_void_core.png` | 30x30px | 120x30px | Rod-svart singularitetsruta (#ff4422). Materia sugs inat. Gravitationslinseffekt. | Mikro-svart hal — grav nar verkligheten kollapsar. |

**Animation:** 4 frames a 30x30px, 200ms per frame (800ms loop). Sheet: 120x30px. Kontinuerlig — hazards ar alltid aktiva och visuellt hotfulla.

---

### 1.4 BREAKABLE

| Alla biom | Filnamn | Storlek (per frame) | Storlek (sheet, 7 frames) | Beskrivning | Kansla |
|-----------|---------|--------------------|-----------------------------|-------------|--------|
| Per biom | `breakable_[biom].png` | 30x30px | 210x30px | Sprickig variant av solid-tile i biom-specifik brytbar farg (se biomes.json). Synliga strukturella svagheter — djupa sprickor, flagig yta, glowing stress-linjer. | Lockande destruktion — spelaren SER att den kan krossas. |

**States (totalt 7 frames, sheet 210x30px):**
- **Idle:** 1 frame (30x30px) — sprickig men intakt
- **Cracking:** 2 frames (60x30px sheet), 80ms — sprickorna vidgas vid forsta traff (om multi-hit)
- **Breaking:** 4 frames (120x30px sheet), 50ms — explosion av fragment utfran. Sista framen ar genomskinlig/tom.

---

### 1.5 BOUNCE

| Alla biom | Filnamn | Storlek (per frame) | Storlek (sheet, 6 frames) | Beskrivning | Kansla |
|-----------|---------|--------------------|-----------------------------|-------------|--------|
| Per biom | `bounce_[biom].png` | 30x30px | 180x30px | Gron/biom-fargad studsplatta. Konvex yta med lysande energilinjer. En upp-pil eller chevron-symbol i mitten. Spring-mekanism synlig i sidorna. | "Hopp pa mig!" — inbjudande, energisk. Spelaren vet direkt vad den gor. |

**Animation (totalt 6 frames, sheet 180x30px):**
- **Idle:** 2 frames (60x30px), 400ms — svag puls, energilinjerna dimmas in/ut
- **Triggered:** 4 frames (120x30px), 60ms — komprimerar, sen SNAP uppat. Intensiv glow-burst pa frame 2. Atergar till idle.

---

### 1.6 ACID_POOL

| Filnamn | Storlek (per frame) | Storlek (sheet, 4 frames) | Beskrivning | Kansla |
|---------|--------------------|-----------------------------|-------------|--------|
| `acid_pool.png` | 30x30px | 120x30px | Gronsyra-yta (#88ff22 till #44cc00). Tjock vatska med bubblor som poppar. Skelettrester eller upplosta metallbitar synliga under ytan. | Avskyvaird, langvarig fara — detta loser upp allt. |

**Animation:** 4 frames a 30x30px, sheet 120x30px, 300ms loop (1200ms totalt). Bubblor riser och poppar, ytan skiftar.

---

### 1.7 LASER

| Filnamn | Storlek (per frame) | Storlek (sheet) | Beskrivning | Kansla |
|---------|--------------------|--------------------|-------------|--------|
| `laser_emitter.png` | 30x30px | 60x30px (2 frames) | Vagg-monterad emitter. Metallhojd med rod lins. Varningsljus. | Teknologisk fara — precision, inte kaos. |
| `laser_beam.png` | 30x8px | 120x8px (4 frames) | Horizontal/vertikal strle (tileable langs beamens langd). Rod karna (#ff2244), rosa glow-aura. | Omeddelbar fara — ror dig inte genom den. |

**Animation:**
- **Emitter:** 2 frames a 30x30px (sheet 60x30px), 500ms — varningslins blinkar
- **Beam:** 3 frames a 30x8px (sheet 90x8px), 100ms — beam fluktuerar i bredd/intensitet
- **Beam-off:** 1 frame a 30x8px — svag rosa linje (forebader var beamen kommer)

---

### 1.8 DARKNESS

| Filnamn | Storlek (per frame) | Storlek (sheet, 3 frames) | Beskrivning | Kansla |
|---------|--------------------|-----------------------------|-------------|--------|
| `darkness_fog.png` | 30x30px | 90x30px | Svart-violett dimma med svag partikelstoft. Semi-transparent. Skuggor som rorer sig. | Okand fara — vad döljer sig darinne? |

**Animation:** 3 frames a 30x30px, sheet 90x30px, 600ms per frame (1800ms loop). Dimman sveper, partiklar driver.

---

## 2. BAKGRUNDER (Per Biom)

Varje biom har en **parallax-bakgrund med 3 lager** (far/mitten/nara) som scrollar med kameran i olika hastigheter.

### 2.1 SURFACE FRACTURE

| Lager | Filnamn | Storlek | Beskrivning | Kansla |
|-------|---------|---------|-------------|--------|
| Far (0.1x scroll) | `bg_surface_far.png` | 360x640px | Morkt natthimmel (#0a0a1a) med svaga distanta stadsljus — blekta skyskrapor i silhouette. Enstaka stjarna blinkar. Tileable vertikalt. | Overgivet — staden ovanfor ar dod, men dess eko nar hit. |
| Mitten (0.3x scroll) | `bg_surface_mid.png` | 360x640px | Industriella ror och kablar i silhouette. Cyan accent-ljus pa nodpunkter. Stalpelare. | Infrastruktur — du ar i stadens skelett nu. |
| Nara (0.5x scroll) | `bg_surface_near.png` | 360x640px | Fallande dammpartiklar. Svaga vattendroppande stalaktiter. Sprickor med ljusstrimmer. | Forfall — allt harifran och nedat ar bortglomt. |

### 2.2 NEON GUT

| Lager | Filnamn | Storlek | Beskrivning | Kansla |
|-------|---------|---------|-------------|--------|
| Far (0.1x scroll) | `bg_neongut_far.png` | 360x640px | Mork-lila bakgrund (#10061a). Distanta pulserande nervknippen. Svagt rosa sken fran osynlig kalla. | Du ar inuti nagot levande och enormt. |
| Mitten (0.3x scroll) | `bg_neongut_mid.png` | 360x640px | Organiska vener och artarer som grenar sig. Lila-rosa bioluminescens. Langsamnt pulserande. | Blodomloppet — den har organismen pumpar, och du ar ivägen. |
| Nara (0.5x scroll) | `bg_neongut_near.png` | 360x640px | Drivande sporer, lysande magenta "celler". Semi-transparenta membran. | Mikro-ekosystem — du ar en inkraktare i en frammande biologi. |

### 2.3 DATA CRYPT

| Lager | Filnamn | Storlek | Beskrivning | Kansla |
|-------|---------|---------|-------------|--------|
| Far (0.1x scroll) | `bg_datacrypt_far.png` | 360x640px | Morkteal (#060e14). Kolumner av fallande gron text (Matrix-eko). Distanta serverrackar. | Arkivet — all varldens information begravd har. |
| Mitten (0.3x scroll) | `bg_datacrypt_mid.png` | 360x640px | Horisontal kretskorts-linjer i teal/gront. Nodpunkter som blinkar. Hexagonalt grid. | Neural narverk — data som tanker, processar, glomt sin skapare. |
| Nara (0.5x scroll) | `bg_datacrypt_near.png` | 360x640px | Holografiska fragment — text, bilder, data som fragmenterats till oigenkannlighet. | Minnesfragment — du simmar genom broken data. |

### 2.4 HOLLOW MARKET

| Lager | Filnamn | Storlek | Beskrivning | Kansla |
|-------|---------|---------|-------------|--------|
| Far (0.1x scroll) | `bg_hollowmarket_far.png` | 360x640px | Mork-lila stenvalv (#0c0a14). Enorma pelarganger i silhouette. Distanta lysande skyltfonster. | En underjordisk katedral av handel — forodande storslagenhet. |
| Mitten (0.3x scroll) | `bg_hollowmarket_mid.png` | 360x640px | Overgivna marknadsstand. Hangande tyger och girlanger. Dimmiga amber-ljuskallor. | Overkade — handlarna ar borta men deras varor maler bort. |
| Nara (0.5x scroll) | `bg_hollowmarket_near.png` | 360x640px | Svavande mynt, drivande papper, brutna lador. Dammpartiklar i amber-ljus. | Overflod som blivit skrap — allt har mist sitt varde har nere. |

### 2.5 MOLTEN GRID

| Lager | Filnamn | Storlek | Beskrivning | Kansla |
|-------|---------|---------|-------------|--------|
| Far (0.1x scroll) | `bg_moltengrid_far.png` | 360x640px | Djup mork-orange (#140e04). Distanta lavafloden. Glodande horisont. Rorkartan. | Underjorden ar nara — det har ar jordens blodomlopp. |
| Mitten (0.3x scroll) | `bg_moltengrid_mid.png` | 360x640px | Kylda lavapelare med orange sprickor. Industriella smaltugnar overgivna. Metallskelett. | Smaltverket — nagon grävde for djupt och fann eld. |
| Nara (0.5x scroll) | `bg_moltengrid_near.png` | 360x640px | Stigande varmedistortion. Glodande askapartiklar som stiger uppat. Droppande smalt metall. | Omedelbar fara — luften sjalv vill skada dig. |

### 2.6 VOID CORE

| Lager | Filnamn | Storlek | Beskrivning | Kansla |
|-------|---------|---------|-------------|--------|
| Far (0.1x scroll) | `bg_voidcore_far.png` | 360x640px | Nastan total morker (#140808). Svaga blodroida nebulosa-strimmor. Enstaka inverterade ljuspunkter (vita prickar som SUGER ljus). | Bortom verkligheten — det har ar inte en plats, det ar en franvaro. |
| Mitten (0.3x scroll) | `bg_voidcore_mid.png` | 360x640px | Fragmenterade geometriska former som svarar i morker. Pulserar rod. Speglar som reflekterar ingenting. | Bruten geometri — rummet sjalvt ar skadat. |
| Nara (0.5x scroll) | `bg_voidcore_near.png` | 360x640px | Glitch-artifacts, scanlines, tearing-effekt. Pulsering som om verkligheten "andas". | Du borde inte vara har — varje pixel skriker at dig att vanda om. |

**Bakgrundsanimation:** Alla bakgrunder ar 360x640px, tileable vertikalt. Antingen statiska med partikel-overlays (renderade av partikelsystemet), eller med 2-3 frames (sheet: 720x640px / 1080x640px) med MYCKET langsam loop (2-4 sekunder) for subtil rorelse.

---

## 3. SPELARSPRITES

**Storlek:** 20x28px hitbox, sprites renderade som 24x32px (2px padding for glow).
**Fargpalett:** Cyan-kropp (#44ddff), bla glow (#22aaff), vit highlight.

### 3.1 STATES & ANIMATIONER

**Per frame:** 24x32px. **Alla frames totalt:** 35 frames → atlas ca 840x32px (eller 168x160px i 7x5 grid).

| State | Frames | Storlek (per frame) | Storlek (sheet) | Loop | Filnamn | Beskrivning |
|-------|--------|--------------------|--------------------|------|---------|-------------|
| **IDLE** | 4 | 24x32px | 96x32px | 600ms, loop | `player_idle_01-04.png` | Svavande i luften, svagt bob-motion. Neon-visir glower. Svag "andnings"-expansion. Hackerprofil — huva, slank kropp, tech-stovlar. |
| **FALLING** | 3 | 24x32px | 72x32px | 200ms, loop | `player_fall_01-03.png` | Armar och ben utstrackte for att bromsa. Manteln/huvan fladder uppat. Cyan trail-effekt under fotterna. Haret/huvan flyger. |
| **STOMP_STARTUP** | 2 | 24x32px | 48x32px | 100ms, engång | `player_stomp_start_01-02.png` | Kroppen dras ihop som en fjar. Energi samlas vid fotterna (glow intensifieras). Armar dras uppat. Anspanning. |
| **STOMPING** | 2 | 24x32px | 48x32px | Loopas under stomp | `player_stomp_01-02.png` | Fullt komprimerad, fotterna forst nedat som en missil. Massiv cyan-glow trail bakom. Energi-shockwave runt kroppen. Ren aggressiv hastighet. |
| **BOUNCING** | 3 | 24x32px | 72x32px | 150ms, engång → FALLING | `player_bounce_01-03.png` | Expansion uppat fran komprimering. Armar kastas ut. Joy-pose pa frame 3. Latt cirkulär glow-burst. |
| **DASHING** | 3 | 24x32px | 72x32px | 80ms totalt, engång | `player_dash_01-03.png` | Horisontell stretch, kroppen ar en cyan-streck. Afterimage/motion blur pa frame 1-2. Frame 3 aterhamtning. Explosiv rorelse. |
| **WALL_SLIDING** | 3 | 24x32px | 72x32px | 300ms, loop | `player_wallslide_01-03.png` | En hand och fot mot vaggen. Gnistpartiklar fran kontaktpunkten. Kroppen lutar bort fran vaggen. Sakta fallande med friktion-effekt. |
| **DEAD** | 5 | 24x32px | 120x32px | 120ms, engång | `player_death_01-05.png` | Frame 1: traff-reaktion. Frame 2-3: kroppen fragmenteras i neon-bitar. Frame 4: fragmenten sprids ut. Frame 5: sista svaga glow fader ut. Digital "de-rez". |
| **INVULNERABLE** | 1 | 24x32px | 24x32px | Overlay | `player_invuln_flash.png` | Semi-transparent vit overlay (blinkar 100ms on/off over aktiv state). Holo-shield-effekt runt kroppen. |
| **FIRING (per riktning)** | 2x4 = 8 | 24x32px | 48x32px per riktning | 60ms, engång | `player_fire_up/down/left/right.png` | Subtil recoil-pose i motsatt riktning. Vapenhand lyser med projektilens farg. Flash vid vapenmynning. |

### 3.2 SPELARDETALJER

Spelarkaraktaren ar en **neon-hackare/dykare** — en anonym figur i en tech-huva med ett glowande cyan-visir. Tunna, smidiga proportioner. Manteln ar halvtransparent med interna ljus-linjer. Stovlarna har neon-sulor. Inga ansiktsdrag synliga — allt uttryck sker genom kroppssprak och glow-intensitet.

**Kansla:** Spelaren ska kanna sig **smidig, farlig och ensam** — en inkraktare i en varld som inte vill ha dem dar.

---

## 4. FIENDESPRITES

Alla fiender behover: **Idle, Attack/Active, Hit (1 frame), Death (3-4 frames)**

### 4.1 FODDER/PRESSURE

#### HOPPER
- **Hitbox:** 24x24px | **Sprite:** 28x28px (2px glow-padding) | **Sheet (9 frames):** 252x28px
- **Farg:** Rosa kropp (#ff4466), rod glow (#ff2244)
- **Idle (3 frames a 28x28px, 400ms loop):** Litet runt vasen med tva knyckiga ben. Studsar pa stallet med en orolig energi. Ogon ar tva vita prickar som darrar. Enkel, nastan sotig — men det ar MANGA av dem.
- **Attack/Jump (2 frames a 28x28px, 100ms):** Komprimerar, sen HOPP — benen rackar ut, en liten rosa trail.
- **Hit (1 frame a 28x28px, flash):** Vit flash, kroppen deformeras kort.
- **Death (3 frames a 28x28px, 80ms):** Poppar som en ballong — rosa fragment och partiklar. "Splat"-effekt.
- **Kansla:** Irriterande, narvos, svarmande. Som neon-loppar.

#### SPLITTER
- **Hitbox:** 26x26px | **Sprite:** 30x30px (2px glow-padding) | **Sheet (8 frames):** 240x30px
- **Fragment — Hitbox:** 14x14px | **Sprite:** 18x18px | **Sheet (4 frames):** 72x18px
- **Farg:** Gron kropp (#44ff88), morkare glow (#22dd66)
- **Idle (3 frames a 30x30px, 500ms loop):** Amob-liknande blob som pulsar. Gron, gelatinos. Interna bubblor ror sig. Kanns som den kan spranga nar som helst.
- **Hit (1 frame a 30x30px):** Kroppen bultar ut, bubblorna accelerar.
- **Splitting/Death (4 frames a 30x30px, 100ms):** Kroppen DELAR SIG — mitten spricker, tva halvor glider isar, varje halva blir en SplitterFragment.
- **SplitterFragment Idle (2 frames a 18x18px, 300ms):** Mindre version, mer desperat — darrar och rorer sig snabbare. Kanns instabil.
- **SplitterFragment Death (2 frames a 18x18px, 60ms):** Losen splatter — gron goo sprids.
- **Kansla:** Eklig, amorph, otrovardigt overlevnadsdriftig — du trodde du dodade den, men den bara BLEV FLER.

#### LEECH
- **Hitbox:** 18x18px | **Sprite:** 22x22px (2px glow-padding) | **Sheet (9 frames):** 198x22px
- **Farg:** Gulgrön (#88ff44), morkare glow (#44cc22)
- **Idle (3 frames a 22x22px, 350ms loop):** Liten flygande parasit-insekt. Vingar surrnar (blur-effekt). Snabell pekar mot spelaren. Lysande ogon.
- **Chasing (2 frames a 22x22px, 150ms loop):** Mer aggressiv vinkelbojning, vingarna gar snabbare. Snarare acceleration.
- **Hit (1 frame a 22x22px):** Fladdrar vilt.
- **Death (3 frames a 22x22px, 80ms):** Imploderar — dras ihop till en punkt sen mini-burst.
- **Kansla:** Enveten, otacklig, personlig — den VILL ata dig. Individuellt svag men i grupp mardrommlig.

#### SWARM DRONE
- **Hitbox:** 12x12px | **Sprite:** 16x16px (2px glow-padding) | **Sheet (4 frames):** 64x16px
- **Farg:** Morkgron (#33aa66), glow (#228844)
- **Idle (2 frames a 16x16px, 200ms loop):** Tiny droneliknande varelse. Roterande "vingar" (linjer). Foljer SwarmMother.
- **Death (2 frames a 16x16px, 50ms):** Liten gnista, sen borta.
- **Kansla:** Obetydlig ensam. Tillsammans med hundra andra? Terrifierande svarmbeteende.

---

### 4.2 RANGED/ZONING

#### TURRET BLOOM
- **Hitbox:** 28x28px | **Sprite:** 32x32px (2px glow-padding) | **Sheet (14 frames):** 448x32px
- **Farg:** Lila (#cc44ff), morkare glow (#aa22dd)
- **Idle (4 frames a 32x32px, 800ms loop):** Blomformad turret fastad i vagg/golv. Kronbladen oppnas och stangs sakta. Centrum har en lysande lila "karna" som pulserar. Organisk-mekanisk hybrid.
- **Charging (3 frames a 32x32px, 200ms):** Kronbladen oppnas fullt. Karnan lyser intensivt. Laddnings-partiklar dras inat.
- **Firing (2 frames a 32x32px, 80ms):** Kronbladen ryggar bakatt vid avfyrning. Lila projektiler avfyras i burst-monster. Recoil-vibration.
- **Hit (1 frame a 32x32px):** Kronbladen fladdrar, karnan flackar.
- **Death (4 frames a 32x32px, 100ms):** Kronbladen faller av ett i taget. Karnan pulsar vilt sen slocknar. Lila sporer faller.
- **Kansla:** Vacker men dodlig — en predatorisk orkide. Lockar ogat, straffar den som stannar.

#### PARASITE CLOUD
- **Hitbox:** 14x14px | **Sprite:** 18x18px (2px glow-padding) | **Sheet (5 frames):** 90x18px
- **Farg:** Lila (#cc44ff), glow (#aa22dd)
- **Idle (3 frames a 18x18px, 500ms loop):** Svavande toxisk dimm-klump. Skiftar form sakta. Semi-transparent med interna ljuspunkter. Drivande.
- **Death (2 frames a 18x18px, 100ms):** Losen sig i luft — fader ut.
- **Kansla:** Passiv fara — den jagar inte, den bara FINNS, och den ar ivägen.

#### RAIL SENTINEL
- **Hitbox:** 26x26px | **Sprite:** 30x30px (2px glow-padding) | **Sheet (12 frames):** 360x30px
- **Farg:** Orange (#ff8844), morkare glow (#dd6622)
- **Idle (3 frames a 30x30px, 400ms loop):** Mekanisk sfar pa en synlig rail/sparlinje. Roterande sensorring. Orange "oga" scannar. Metallisk, precis.
- **Moving (2 frames a 30x30px, 150ms loop):** Snabbare rotering, trail-effekt langs railen. Accelerationspartiklar.
- **Firing (2 frames a 30x30px, 100ms):** Ogat fokuserar (zoom-effekt), avfyrar strale. Orange flash.
- **Hit (1 frame a 30x30px):** Gnistor fran pansar, kort avbrott i rorelse.
- **Death (4 frames a 30x30px, 120ms):** Railen bryts. Sfaren exploderar i mekaniska delar — kugghjul, skruvar, linser.
- **Kansla:** Mekanisk, oflexibel, forutsagbar men dödlig — du kan lasa dess monster, men det kraverperfektion.

#### BOMBER
- **Hitbox:** 20x20px | **Sprite:** 24x24px (2px glow-padding) | **Sheet (11 frames):** 264x24px
- **Farg:** Morkorange (#ff6622), glow (#cc4400)
- **Idle (3 frames a 24x24px, 400ms loop):** Rund varelse med kort stubin/saker. Svag blinkning. Sitter still eller flyter sakta.
- **Throwing (3 frames a 24x24px, 100ms):** Armen kastas bakatt, sen framatt — releasar en glodande bomb-projektil i en bagform.
- **Hit (1 frame a 24x24px):** Stubin-flare.
- **Death (4 frames a 24x24px, 80ms):** Exploderar sjalv — storre explosion an vanliga fiender. Orange-rod flash, fragment.
- **Kansla:** Klumpig men farlig — underskatta den inte. Dess granater ar det riktiga hotet.

---

### 4.3 COMPLEX/ELITE

#### SHIELD BUG
- **Hitbox:** 24x20px | **Sprite:** 28x24px (2px glow-padding) | **Sheet (11 frames):** 308x24px
- **Farg:** Orange (#ffaa22), glow (#dd8800)
- **Idle (3 frames a 28x24px, 500ms loop):** Insektsliknande varelse med en stor, halvtransparent energi-skold framfor sig. Skölden pulserar. Kroppen ar liten bakom skolden.
- **Advancing (2 frames a 28x24px, 200ms loop):** Sakta vandring framat med skolden framfor. Ben i synk.
- **Shield-hit (1 frame a 28x24px):** Skolden blossar upp intensivt vid projektil-block. Energi-vag langs skoldens yta.
- **Exposed (2 frames a 28x24px, 300ms):** Nar skolden ar nerknufad/flanked — kroppen visas, otrygg, ben darrar.
- **Death (3 frames a 28x24px, 100ms):** Skolden spricker forst (energi-shatter), sedan kroppen kollapsar.
- **Kansla:** Feg men outhardlig — tvingar spelaren att TANKA positionellt, inte bara skjuta.

#### MIRROR
- **Hitbox:** 24x24px | **Sprite:** 28x28px (2px glow-padding) | **Sheet (9 frames):** 252x28px
- **Farg:** Ljusbla/silver (#aaccff), glow (#6688cc)
- **Idle (3 frames a 28x28px, 600ms loop):** Flytande spegelliknande yta — rund med metallisk glans. Reflekterar omgivningen (fakererad distortion-effekt). Roterande sakta.
- **Reflecting (2 frames a 28x28px, 80ms):** Blossar upp nar projektil studsar — spegelytan vibrerar, reflekterad projektil avgar.
- **Hit (1 frame a 28x28px, fran sidor):** Sprickor i spegel-ytan.
- **Death (3 frames a 28x28px, 100ms):** Spegeln spricker i bitar — spegelskärvor flyger at alla hall med reflektioner.
- **Kansla:** Trick-fiende. Straffar tanklost skjutande. Elegant, frustrerande. "Sluta skjuta pa DIG SJALV."

#### AMBUSHER
- **Hitbox:** 22x22px | **Sprite:** 26x26px (2px glow-padding) | **Sheet (10 frames):** 260x26px
- **Farg:** Mork rosa-lila (#884466), glow (#662244)
- **Hidden (2 frames a 26x26px, 1000ms loop):** Nastan osynlig — svag silhouette som smälter in med bakgrunden. Subtil skimmer ar enda hintsen.
- **Revealing (2 frames a 26x26px, 80ms):** SNAP — framtrader plotsligt, kroppen fullt synlig. Ogon lyser intensivt.
- **Attacking (2 frames a 26x26px, 60ms):** Lungar framåt i en snabb attack. Klor/blad lyser.
- **Hit (1 frame a 26x26px):** Försöker gömma sig igen — halvtransparent.
- **Death (3 frames a 26x26px, 100ms):** Losen sig som rokpartiklar — fader tillbaka till ingenting.
- **Kansla:** Paranoia — efter du sett en, litar du aldrig pa en "tom" plats igen.

#### CORE CARRIER
- **Hitbox:** 36x36px | **Sprite:** 40x40px (2px glow-padding) | **Sheet (14 frames):** 560x40px
- **Farg:** Magenta/rosa (#ff4488), glow (#dd2266)
- **Idle (4 frames a 40x40px, 600ms loop):** Stor, tungt bepansrad varelse med synligt lysande "karna" i bröstet. Sakta, majestetisk. Tunga metallben. Plating med energi-linjer.
- **Hit (2 frames a 40x40px, 100ms):** Pansar blinkar, karnans glow intensifieras. Stegar bakatt.
- **Low HP (3 frames a 40x40px, 400ms loop):** Pansar sprucken, kärnan exposed och pulsar desperat. Ror sig mer oregelbundet. Gnistor.
- **Death (5 frames a 40x40px, 150ms):** Pansar flyger av i bitar. Kärnan pulserar en sista gang. EXPLOSION — stor rosa-vit flash. Massor av loot/pickups spawnar.
- **Kansla:** Jackpot-fiende. "Jag vill doda den. Jag BEHOVER doda den." Pinata-tillfredsställelse.

---

### 4.4 BOSSAR / MINIBOSSAR

#### SENTINEL MINIBOSS
- **Hitbox:** 40x40px | **Sprite:** 48x48px (4px glow-padding) | **Sheet (19 frames):** 912x48px
- **Farg:** Morkt rosa-rod (#ff2266), glow (#cc0044)
- **Idle (4 frames a 48x48px, 500ms loop):** Forstörd, uppdaterad version av Rail Sentinel. Tva sensorogon istallet for ett. Elektriska urladdningar runt kroppen. Roterande vapensystem.
- **Attack Pattern A (4 frames a 48x48px, 200ms):** Dual laser-avfyrning — bada ogonen skjuter samtidigt.
- **Attack Pattern B (3 frames a 48x48px, 150ms):** Spawnsar Rail Sentinels fran sina sidor.
- **Enrage (2 frames a 48x48px, loop):** Kroppen glower rodar, roterar snabbare, partiklar intensifieras.
- **Death (6 frames a 48x48px, 200ms):** Utdragen explosion — fas 1: vapensystem exploderar. Fas 2: kroppen spricker. Fas 3: karnreaktor-detonation med vit bländning.
- **Kansla:** Upgraderad hot — allt du lart dig om Rail Sentinel, men svårare, snabbare, argare.

#### DATA GUARDIAN
- **Hitbox:** 44x44px | **Sprite:** 52x52px (4px glow-padding) | **Sheet (18 frames):** 936x52px
- **Farg:** Teal (#44ffcc), glow (#22ddaa)
- **Idle (4 frames a 52x52px, 700ms loop):** Svavande holografisk vasen. Genomskinlig med synliga dataströmmar inuti. Geometrisk form — oktahedron eller liknande. Symbaler roterar runt den.
- **Teleporting (3 frames a 52x52px, 80ms):** Glitch-effekt — kroppen pixeleras, forsvinner, materialiseraspa ny position.
- **Laser Charge (3 frames a 52x52px, 200ms):** Data koncentreras i en punkt. Varningslinjer visar var lasern kommer.
- **Laser Fire (2 frames a 52x52px, 60ms):** Teal laser-strile. Sveipande.
- **Phase 2 (1 overlay a 52x52px):** Snabbare, rodar-tonad glow, mer aggressivt beteende. Symbaler lyser intensivare.
- **Death (5 frames a 52x52px, 200ms):** Hologrammet fragmenteras. Datastyckena flyger ut som pixlar. Sista flash ar vit-gron.
- **Kansla:** Mystisk vakiare — den skyddar nagot. Intelligent, teleporterande, opersonlig. Du ar en bug den forsöker patcha.

#### BLOOM HEART
- **Hitbox:** 56x56px | **Sprite:** 64x64px (4px glow-padding) | **Sheet (22 frames):** 1408x64px
- **Farg:** Magenta-pink (#ff44cc), glow (#cc22aa)
- **Idle (4 frames a 64x64px, 1000ms loop):** STOR organisk hjartliknande boss. Pulserande som ett riktigt hjarta — systole/diastole-cykel. Organiska tentakler/rotter sticker ut fran sidorna. Bio-luminescenta vener. Omgiven av svavande sporer.
- **Attack: Tentakler (4 frames a 64x64px, 200ms):** Tentakler slas ut mot spelaren. Whip-motion.
- **Attack: Spore Burst (3 frames a 64x64px, 150ms):** Oppnar sig, releasar en svarm av ParasiteClouds. Inandnings/utandnings-animation.
- **Vulnerable Phase (3 frames a 64x64px, 400ms loop):** Karnan blottas — hjartats yttervaggar oppnar sig, avslojande en svag, lysande karna.
- **Death (8 frames a 64x64px, 300ms):** EPISK dod. Tentakler visnar och faller av en i taget. Hjartat slutar sla. Karnan overloader — kakedja av explosioner ut fran mitten. Sista frame: en enorm glow-burst som fyller halva skarmen.
- **Kansla:** Biologisk fasansfull makt — den har varelten ar BIOMET. Du dodar inte bara en boss, du dodar platsen sjalv.

#### ACID WYRM
- **Hitbox (huvud):** 44x44px | **Sprite (huvud):** 52x52px (4px glow-padding) | **Sheet huvud (16 frames):** 832x52px
- **Segment:** 20x20px hitbox | **Sprite (segment):** 24x24px | **Sheet segment (2 frames):** 48x24px
- **Farg:** Gulgrön (#88ff44), glow (#44cc22)
- **Idle (4 frames a 52x52px, 500ms loop):** Orm-liknande varelse med segmenterad kropp (5-6 segment, varje 24x24px sprite). Huvudet har oppna kakar med droppande syra. Kroppen undulerar.
- **Attacking (3 frames a 52x52px, 150ms):** Kakar oppnas bredt, sprutar syra-projektil.
- **Burrowing (4 frames a 52x52px, 100ms):** Borrar sig ned i mark — segmenten forsvinner ett i taget. Kommer upp pa annan plats.
- **Death (5 frames a 52x52px, 200ms):** Segmenten losnar ett i taget fran svansen och exploderar. Huvudet sist — stor grön syra-burst.
- **Kansla:** Orm i underjorden — snabb, otäck, oforutsagbar. Dess rörelsemonster skramlar.

#### DRILL MOTHER
- **Hitbox:** 60x60px | **Sprite:** 68x68px (4px glow-padding) | **Sheet (21 frames):** 1428x68px
- **Farg:** Orange (#ff8844), glow (#dd6622)
- **Idle (4 frames a 68x68px, 600ms loop):** MASSIV mekanisk varelse med en roterande borr som "ansikte". Tunga larvband/ben. Damm och skrapfragment runt den. Industriell mardrom.
- **Drilling (3 frames a 68x68px, 80ms loop):** Borren roterar i full hastighet. Sten/metall-fragment kastas. Skapar hazard-tiles bakom sig.
- **Charging (3 frames a 68x68px, 200ms):** Vander mot spelaren, borren accelerar, larvbanden grabbar mark — RUSH.
- **Spawning (3 frames a 68x68px, 300ms):** Oppnar luckor pa sidorna — releasar mindre fiender.
- **Death (8 frames a 68x68px, 250ms):** Borren stannar och flyger av. Larvband lossar. Interna explosioner — varje del gar sonder separat. Sista: huvudreaktorn gar up i en orange eldkula.
- **Kansla:** Industriell boss-monstrositet. Du motter en maskin som existerar for att FORSTORA terrang — och du ar i dess vag.

#### SWARM MOTHER
- **Hitbox:** 32x32px | **Sprite:** 36x36px (2px glow-padding) | **Sheet (13 frames):** 468x36px
- **Farg:** Gron-teal (#44cc88), glow (#228866)
- **Idle (4 frames a 36x36px, 600ms loop):** Storre organisk varelse med synliga "bon" pa kroppen dar SwarmDrones hudar. Pulserar. Semi-transparent mage visar blivande droner.
- **Spawning (4 frames a 36x36px, 200ms):** Ett bo oppnas, en drone kravler ut och tar till flygten. Smatt obehaglig "fodsel"-animation.
- **Hit (1 frame a 36x36px):** Krymper ihop defensivt. Bonen stangs.
- **Death (4 frames a 36x36px, 150ms):** Exploderar — alla kvarvarande droner releasas pa en gang i en desperat sista attack.
- **Kansla:** Moderskap som hot. Du vill ta bort kallan, men dota henne innebar FLER barn att hantera.

---

## 5. PROJEKTILER & VAPEN-VFX

### 5.1 SPELARENS PROJEKTILER (per vapen)

| Vapen | Storlek | Filnamn | Beskrivning | Kansla |
|-------|---------|---------|-------------|--------|
| **Pulse Rifle** | 6x3px | `proj_pulse.png` | Gul-orange energipuls (#ffff44). Oval med svans-trail. Snabb, ren. | Palitlig arbetshastat — inte flashig, men effektiv. |
| **Scatter Cannon** | 4x4px (x5) | `proj_scatter.png` | Orange fragment (#ff6644). Runda, kaotiska. Var och en har liten glow-trail. | Kaos, bredspridning — satsar pa flax och volym. |
| **Beam Cutter** | 20x3px | `proj_beam.png` | Lang rod strle (#ff2244) med vit karna. Piercande. Ren linje med energi-aura. | Precision och makt — en skarp linje genom allt. |
| **Ricochet** | 5x5px | `proj_ricochet.png` | Teal-grön studsboll (#44ffaa). Diamantform. Efterlamnar gröna trailprickar vid studspunkter. | Pinball-energi — kul, oforutsagbar, belonande nar den traffar flera. |
| **Chain Shock** | 5x5px projektil + 80x4px chain-arc | `proj_chain.png` + `chain_arc.png` | Cyan elsfar (#44ddff). Vid traff: elektrisk blixt-linje (80x4px, tileable) till nasta fiende. Zapping-chain. | Elektrisk, overväldigande — kedjereaktionen ar den riktiga dopamin-kicken. |
| **Acid Scatter** | 5x5px (x4) | `proj_acid.png` | Gulgron droppform (#88ff22). Lämnar kvar acid-pool vid landing. Semi-transparent, giftig. | Atekling, terrangkontroll — placera gift och lat det gora jobbet. |
| **Drone Support** | 8x8px (dronen) | `drone.png` | Guld-orange minidrone (#ffcc44). Liten propeller-animation (2 frames). Eget litet skott ar en gold-prick. | Kompanjon-kansla — du ar inte ensam, dina droner har din rygg. |

### 5.2 FIENDEPROJECTILER

| Typ | Storlek | Filnamn | Beskrivning |
|-----|---------|---------|-------------|
| **Standard** | 4x4px | `proj_enemy_default.png` | Rod prick med vit karna. Enkel men synlig mot alla bakgrunder. |
| **Turret Burst** | 5x5px | `proj_turret.png` | Lila sfar med trailing rings. Avfyras i burst-monster. |
| **Bomber Grenade** | 8x8px | `proj_bomb.png` | Rundad bomb med blinkande rod prick. Foljer en parabola. |
| **Acid Spit** | 6x6px | `proj_acid_spit.png` | Grön klick som droppar. |
| **Laser Beam** | 4x30px (tileable langs langden) | `proj_laser_beam.png` | Intensiv teal/rod strle beroende pa fiende. |

### 5.3 VAPENEFFEKTER

| Effekt | Filnamn | Storlek (per frame) | Storlek (sheet) | Beskrivning |
|--------|---------|--------------------|--------------------|-------------|
| **Muzzle Flash** (alla vapen) | `vfx_muzzle_01-03.png` | 16x16px per frame | 48x16px (3 frames) | 3 frames, 50ms. Vapenspecifik farg. Cirkulär ljusburst vid vapenposition. |
| **Impact Spark** | `vfx_impact_01-03.png` | 12x12px per frame | 36x12px (3 frames) | 3 frames, 60ms. Nar projektil traffar vagg. Gnistor i projektilens farg. |
| **Enemy Hit Flash** | `vfx_enemy_hit.png` | 32x32px | 32x32px (1 frame) | 1 frame overlay. Vit additiv flash over fiende-sprite. |

---

## 6. PICKUPS & ITEMS

### 6.1 PICKUPS

| Typ | Storlek | Filnamn | Animering | Beskrivning | Kansla |
|-----|---------|---------|-----------|-------------|--------|
| **Health** | 12x12px | `pickup_health.png` | 4 frames, 400ms loop. Svavar upp/ner (bob). Pulserar. | Rott hjarta/kors med rosa glow. Partikel-aura. | Lättnad — "jag överlever lite till." |
| **Shard (Currency)** | 10x10px | `pickup_shard.png` | 3 frames, 300ms loop. Rotera. Glittrar. | Gyllene kristall (#ffcc44) som roterar. Ljuspunkter runt den. | Girighet — "jag behöver den, men ar det värt risken att stanna?" |
| **EMP Charge** | 14x14px | `pickup_emp.png` | 3 frames, 500ms loop. Elektrisk puls. | Cyan-vit orb med blixtar. Intensiv glow. | Makt — "nu kan jag städa skarmen." |
| **Weapon Pickup** | 16x16px | `pickup_weapon.png` | 4 frames, 600ms loop. Svavar, roterar. | Vapensilhouette i guldram. Varje vapen har sin silhouette. | Val-angest — "är det bättre an det jag har?" |

### 6.2 SHOP ITEMS

| Typ | Storlek | Filnamn | Beskrivning |
|-----|---------|---------|-------------|
| **Upgrade Card** | 48x64px | `upgrade_card_frame.png` | Neon-kantad kort med biom-anpassat fargschema. Ikon i mitten, text under. Raritets-glow: gra (common), bla (uncommon), lila (rare), guld (legendary). |
| **Upgrade Icons** (40+) | 24x24px | `icon_[upgrade_id].png` | En ikon per upgrade. Stiliserade symboler: snabbare eld = dubbla pilar, mer HP = hjarta+, storre stomp = nedat-pil med explosion, etc. |

---

## 7. UI-ELEMENT

### 7.1 HUD (In-game overlay)

| Element | Storlek | Filnamn | Beskrivning |
|---------|---------|---------|-------------|
| **HP Hearts** | 16x16px | `ui_heart_full.png`, `ui_heart_empty.png`, `ui_heart_half.png` | Neon-hjarta i cyan. Fyllt = ljust, tomt = svag outline. Half = diagonal split. |
| **Combo Meter** | 100x12px | `ui_combo_bar.png` | Horizontal bar med tier-markeringar. Fyller sig med neon-farg per tier: gul→orange→rod→magenta→vit. |
| **Combo Tier Badge** | 24x24px | `ui_combo_tier_0-4.png` | Nummerikon med tier-specifik glow. Tier 4 har eldeffekt. |
| **Score Counter** | 10x14px per siffra (sheet: 100x14px, 10 siffror) | `ui_digits_0-9.png` | Neon-siffror i monospace. Cyan med glow. Arcade-stil. |
| **Depth Meter** | 40x200px | `ui_depth_bar.png` | Vertikal bar pa höger sida. Visar djup med biom-farger. Marker for miniboss/boss-positioner. |
| **Weapon Heat Bar** | 60x8px | `ui_heat_bar.png` | Bla→gul→rod gradient. Weapon overheat-varning. |
| **Dash Charges** | 12x12px | `ui_dash_full.png`, `ui_dash_empty.png` | Sma vingar/blixtar. Fyllda = redo, tomma = cooldown. |
| **EMP Charge** | 16x16px | `ui_emp_ready.png`, `ui_emp_empty.png` | Cirkel med blixt. Ready = pulserande glow. |

### 7.2 MENYER

| Element | Filnamn | Beskrivning |
|---------|---------|-------------|
| **Logo/Titel** | `ui_logo.png` (200x80px) | "NEON DESCENT" — styliserad cyberpunk-text. Glow-effekt. Neon-ror-kansla. Animerad: bokstaver flackar/tänds en i taget. |
| **Menu Background** | `ui_menu_bg.png` (360x640) | Djup cyberpunk stad i vertikalt perspektiv — man ser ner i en avgrund. Neon-skyltar, dimma, mörker. |
| **Button Frame** | `ui_button.png` (120x40px) | Neon-kantad rektangel. Hover: glow intensifieras. Press: invert. 3 states: normal/hover/pressed. |
| **Death Screen Overlay** | `ui_death_overlay.png` (360x640px) | Semi-transparent mork overlay med roda kantlinjer. "SIGNAL LOST"-stil text. |
| **Shop Frame** | `ui_shop_frame.png` (320x400px) | Ram for upgrade-val. 3 kortplatser. Neon-detaljer. |

---

## 8. PARTIKELEFFEKTER / VFX-SPRITES

Partikelsystemet anvander 512 ring-buffrade partiklar. De flesta renderas procedurellt (fargade prickar), men NYCKELEFFEKTER far egna sprites for visuell kvalitet.

| Effekt | Storlek | Frames | Filnamn | Beskrivning | Kansla |
|--------|---------|--------|---------|-------------|--------|
| **Stomp Shockwave** | 64x16px | 4, 60ms | `vfx_stomp_wave.png` | Cirkulär expanderande energi-vag. Cyan. Distortion-effekt. | IMPACT — skarmen KANNER att du slog ner. |
| **Dash Trail** | 32x8px | 3, 40ms | `vfx_dash_trail.png` | Horisontell ljusstrimma som fader. Afterimage. | Hastighet — du var dar, nu ar du HAR. |
| **Enemy Explosion** (standard) | 24x24px | 4, 80ms | `vfx_explosion_small.png` | Cirkulär burst i fiendens farg. Fragmentpartiklar. | Tillfredsstallelse — det gor "pop" och de ar borta. |
| **Boss Explosion** | 64x64px | 6, 120ms | `vfx_explosion_boss.png` | STOR multi-farg explosion. Ljusblixt, fragmentstorm, shockwave. | Triumf — du besegrade nagot enormt. |
| **Heal Sparkle** | 16x16px | 3, 100ms | `vfx_heal_sparkle.png` | Grona/vita stigande gnistor. Mjuk, varm. | Lattnad, trost — du lever. |
| **Combo Fire** (Tier 4) | 32x640px (vänster/höger kant) | 3, 200ms loop | `vfx_combo_fire.png` | Eldliknande neon-effekt langs skarmkanterna. Sheet: 96x640px. Farg beror pa tier. | OKONTROLLERBAR MAKT — du ar i zonen, allt brinner. |
| **Wall Slide Sparks** | 8x16px | 2, 80ms loop | `vfx_wallspark.png` | Gnistor som flyger ut fran vagg-kontaktpunkt. Orange-gul. | Friktion — du bromsar mot nagonting hartfar. |
| **Bounce Burst** | 20x20px | 3, 60ms | `vfx_bounce.png` | Uppatstigande energi-ring. Gron med studsplattans farg. | Studs! Spring! Energi! |
| **Near Miss** | 12x12px | 2, 60ms | `vfx_nearmiss.png` | Vit blixt-streck nara spelaren. Adrenalinkick. | Precis bredvid — skarpt, angstframkallande, belonade. |
| **Biome Transition** | 360x640px | 6, 100ms | `vfx_biom_transition.png` | Scanline-effekt som sveper over skarmen med nya biomets farg. | Visuell shift — "du ar nagon annanstans nu." |
| **Pickup Attract** | 8x8px | 2, 40ms | `vfx_attract.png` | Liten ljuspunkt som dras mot spelaren nar pickup sugs in. | Magnetism — beloning KOMMER till dig. |

---

## 9. MUSIK

Musiken ar **4-lager adaptiv** och skiftar med biom och combograd.

### 9.1 FORMAT & STRUKTUR
- **Format:** `.ogg` (primar) + `.webm` (fallback)
- **Bitrate:** 128kbps (balans storlek/kvalitet for PWA)
- **Loop:** Alla stems måste vara sömlöst loopbara
- **BPM:** Biom-specifik (se nedan)
- **Tempo-synk:** Alla lager i ett biom delar exakt samma BPM och loop-langd
- **Loop-langd:** 8 takter i 4/4 = 32 beats. Langd = 32 * (60/BPM) sekunder

### 9.2 BIOM-MUSIK

#### SURFACE FRACTURE (BPM: 110, 8 takter = 17.5s loop)
| Lager | Filnamn | Langd | Beskrivning | Kansla |
|-------|---------|-------|-------------|--------|
| **L0: Ambient** | `music_surface_ambient.ogg` | 17.5s | Mork drone i A1 (55Hz). Reverb-drankt sawtooth-pad med LFO-modulerad lowpass. Svaga metalliska resonanser. Vatten-droppljud i fjärran. | Ensamhet — du sjunker nedat och ingen vet att du ar har. |
| **L1: Percussion** | `music_surface_perc.ogg` | 17.5s | Industriella kicks pa 1 & 3. Metalliska hihats i 8-delstakt. Svagt ekande snare. Rostiga slagverk — ror, metallskrot. | Maskinell puls — nagot lever i infrastrukturen, ett mekaniskt hjärtslag. |
| **L2: Melody** | `music_surface_melody.ogg` | 17.5s | Pentatonisk arpeggio (A minor pentatonic) i sawtooth-synth. Kallt, ensamnt. Melodin spiral nedat, aldrig uppat. Reverb + delay. | Melankoli — vackert men sorgligt. Du vet att du inte kommer tillbaka. |
| **L3: Intensity** | `music_surface_intense.ogg` | 17.5s | Pulsande sub-bass. Distortad sawtooth-lead med aggressivt filter-sweep. Dubbeltids-kick. Sidechained. | Akut fara — adrenalin. Allt accelerar, overlevnadsinstinkten tar over. |

#### NEON GUT (BPM: 120, 8 takter = 16.0s loop)
| Lager | Filnamn | Langd | Beskrivning | Kansla |
|-------|---------|-------|-------------|--------|
| **L0: Ambient** | `music_neongut_ambient.ogg` | 16.0s | Mork squarewave-drone i C#1. Pulserande, organisk modulation — som ett hjärtslag. Distanta gurglande lågfrekvensljud. | Obehag — du ar i nagot som andas. |
| **L1: Percussion** | `music_neongut_perc.ogg` | 16.0s | Mjuka, tjocka kicks som "hjärtslag". Organiskt ljud — membraner som slår, inte trummor. Hi-hat ersatt med "tandgnissling"-ljud. | Biologisk rytm — inte mekanisk, utan kvickande, organisk. |
| **L2: Melody** | `music_neongut_melody.ogg` | 16.0s | Square-wave arpeggio i Eb minor blues. Psykedeliskt, virvlande. Pitch-bend pa varje ton. | Feber — musik som lat dig kanna "sjuk men euforisk". |
| **L3: Intensity** | `music_neongut_intense.ogg` | 16.0s | Aggressiv acid-bassline. Resonant filter-svep. Distortion. "Squelchy" lead. Intensivt tempo. | Parasitisk panik — nagonting kryper och du maste rora dig NU. |

#### DATA CRYPT (BPM: 125, 8 takter = 15.4s loop)
| Lager | Filnamn | Langd | Beskrivning | Kansla |
|-------|---------|-------|-------------|--------|
| **L0: Ambient** | `music_datacrypt_ambient.ogg` | 15.4s | Triangle-wave drone i F#1. Svaga digitala artefakter — bit-crush glitches. Kliniskt, rent. Lagfrekvensrumble. | Arkivets tystnad — data soverfar, men den ar inte dod. |
| **L1: Percussion** | `music_datacrypt_perc.ogg` | 15.4s | Precisa, kvantiserade kicks. Skarpa digital hi-hats. Allt ar pricksäkert — inga swing, ren grid. Glitch-fills. | Klock-precision — maskinen kanner ingen groove, bara takt. |
| **L2: Melody** | `music_datacrypt_melody.ogg` | 15.4s | Triangle-wave arpeggio i F# minor pentatonic. Snabb, teknisk. Som data som processas i realtid. Staccato. | Beräkning — melodin ar ett program som kors, inte en kansla som uttrycks. |
| **L3: Intensity** | `music_datacrypt_intense.ogg` | 15.4s | Breakbeat-influerad drum & bass. Mork, aggressiv. Sub-bass pulsar. Hög-register digital skriker. | System overload — processen har blivit instabil, och du ar i mitt i crashen. |

#### HOLLOW MARKET (BPM: 95, 8 takter = 20.2s loop)
| Lager | Filnamn | Langd | Beskrivning | Kansla |
|-------|---------|-------|-------------|--------|
| **L0: Ambient** | `music_hollowmarket_ambient.ogg` | 20.2s | Sine-wave drone i E1. Varm, mork. Reverb-tungt. Distanta klockljud, som vindspel i en tom katedral. Amber-tonad. | Nostalgi — skönhet i forodelse. Det har var en gang en plats av liv och handel. |
| **L1: Percussion** | `music_hollowmarket_perc.ogg` | 20.2s | Trip-hop-influerad — sakta, tung kick med massiv reverb. Borstad snare. Finger-snaps. Sakta, drovande. | Marknadsdag — gangna tider ekar i rytmen. |
| **L2: Melody** | `music_hollowmarket_melody.ogg` | 20.2s | Sine-wave i E major pentatonic. Varmare, nastan vacker. Lang sustain. Nostalgisk. En enkel fras som repeteras med variationer. | Glomda minnen — det har var en gang en sang man sjong har. |
| **L3: Intensity** | `music_hollowmarket_intense.ogg` | 20.2s | Det vackra bryts — distortion adderas till melodin. Kicken dubblas. Morkare ackord. Tempot stannar kvar lAngsamt men energin okar. | Desperatiar — marknaden vaknar och den ar INTE vanligi. |

#### MOLTEN GRID (BPM: 130, 8 takter = 14.8s loop)
| Lager | Filnamn | Langd | Beskrivning | Kansla |
|-------|---------|-------|-------------|--------|
| **L0: Ambient** | `music_moltengrid_ambient.ogg` | 14.8s | Djup sawtooth-drone i F1. Tunga, rullande bas-vibrationer. "Seismisk" känsla. Distanta explosioner. | Jordskalv — allt skakar, grunden sjalv ar instabil. |
| **L1: Percussion** | `music_moltengrid_perc.ogg` | 14.8s | Tunga, industriella slagverk. Dubba kicks. Metallkedja-ljud. Hammarslag-snare. Brutalt tempo. | Smedjan — allt ar metall, eld, slag. Obarmhärtig kraft. |
| **L2: Melody** | `music_moltengrid_melody.ogg` | 14.8s | Sawtooth arpeggio i F Locrian (b5). Aggressivt. Snabb, nastan kaotisk skala. Dissonant. | Lava-flode — melodin ar en okontrollerad kraft som floder over allt. |
| **L3: Intensity** | `music_moltengrid_intense.ogg` | 14.8s | Full-on industriell metal-synth. Distortad allt. Maskinell raseri. Sub-bass pa varje slag. | Smaltpunkt — temperaturen ar MAXIMAL, allting brakar samman. |

#### VOID CORE (BPM: 140, 8 takter = 13.7s loop)
| Lager | Filnamn | Langd | Beskrivning | Kansla |
|-------|---------|-------|-------------|--------|
| **L0: Ambient** | `music_voidcore_ambient.ogg` | 13.7s | Square-wave drone i Bb0. Extremt lag. Pulserar i ojamna intervall — inte pa beat. Svaga reversed ljud. "Rymdsus". | Tomhet — bortom allt. Inte tystnad, utan franvaron av mening. |
| **L1: Percussion** | `music_voidcore_perc.ogg` | 13.7s | Aggressiv, brutal. Gabba-influerade kicks. Snabba hats. Reversed cymbaler. Off-beat accenter som destabiliserar. | Kaos — rytmen sjalv ar en fiende. Du kan inte folja den, bara reagera. |
| **L2: Melody** | `music_voidcore_melody.ogg` | 13.7s | Square-wave i Bb diminished (b5). Dissonant, skrammande. Riff som repeteras men ALDRIG exakt likadant — subtila variationer varje loop. | Galenskap — ar melodin dar eller inbillar du dig? |
| **L3: Intensity** | `music_voidcore_intense.ogg` | 13.7s | ALLT. Distortion, layered leads, dubbeltids-allt, sub-bass shaker. Korta tystnad-gap som gor det varre. | Slutstriden — allt du har ar i detta ogonblick. Overlevnad ar seger. |

### 9.3 MENY-MUSIK
| Filnamn | Langd | Beskrivning | Kansla |
|---------|-------|-------------|--------|
| `music_menu.ogg` | 60.0s (loopbar) | Lugnare version av Surface Fracture ambient. Mer melodisk. Mjuk synth-pad med reverb. Svag beat i bakgrunden. | Forväntan — nagot väntar darunner. Du ar redo. |

### 9.4 SPECIAL
| Filnamn | Langd | Beskrivning | Kansla |
|---------|-------|-------------|--------|
| `music_death_sting.ogg` | 3.0s | Stinger. Dramatiskt fallande ackord. Reverb tail. Spelas en gang, loopas ej. | Forlust — skarpt, omedelbart, sen tystnad. |
| `music_boss_intro.ogg` | 4.0s | Stinger. Morkt, tungt, byggande. Overgaar till biom-musik med alla lager aktiva. Spelas en gang. | "Har kommer den" — adrenalin + dread. |

---

## 10. LJUDEFFEKTER (SFX)

**Format:** `.ogg` (primar) + `.webm` (fallback)
**OBS:** Nuvarande system anvander procedurellt genererade ljud via Web Audio API. Dessa filade SFX ERSATTER de procedu rella for hogre kvalitet men behaller samma karaktar.

### 10.1 SPELAR-SFX

| Ljud | Filnamn | Langd | Beskrivning | Kansla |
|------|---------|-------|-------------|--------|
| **Weapon Fire (Pulse)** | `sfx_fire_pulse.ogg` | 60ms | Snabb "pew" — hog bandpass-noise burst + sine click. Tight, snappy. | Kontrollfulllt — varje skott ar avsiktligt. |
| **Weapon Fire (Scatter)** | `sfx_fire_scatter.ogg` | 100ms | Tjock "BOOM-spritt" — lagfrekvent burst med hog splatter. | Brutal, over-the-top — du fyller luften med projekt. |
| **Weapon Fire (Beam)** | `sfx_fire_beam.ogg` | 150ms | Lang "ZZAAP" — kontinuerlig hog-energi laser. | Fokuserad makt — en ren linje av destruktion. |
| **Weapon Fire (Ricochet)** | `sfx_fire_ricochet.ogg` | 80ms | Metallisk "ping-pjuu" — bounce-ljud. | Lekfullt — bollen ar i spel! |
| **Weapon Fire (Chain)** | `sfx_fire_chain.ogg` | 80ms | Elektrisk "BZZZT" — sawtooth-zap. | Elektrisk, farlig — akta dig sjalv! |
| **Weapon Fire (Acid)** | `sfx_fire_acid.ogg` | 100ms | "Splortch" — vattenigt noise-burst med filter. | Ackelvarigt, klibbigt — du kastade nagot vidrig. |
| **Weapon Fire (Drone)** | `sfx_fire_drone.ogg` | 50ms | Tiny "pip-pip" — hog triangle snabb. | Gulligt — dronen gor sitt basta. |
| **Stomp Start** | `sfx_stomp_start.ogg` | 150ms | Fallande "whoosh" — sawtooth sweep ner. | Forvanting — du ar pa vag NER. |
| **Stomp Impact** | `sfx_stomp_hit.ogg` | 250ms | TUNGT "THUD" — djup sine sweep + lowpass noise burst. Skarmskakning i ljud. | BRUTAL IMPACT — marken skakar. Inget överlever detta. |
| **Dash** | `sfx_dash.ogg` | 150ms | "WOOSH" uppat — bandpass noise sweep + sine pitch rise. | Hastighet — du ar borta innan de hinner reagera. |
| **Wall Slide** | `sfx_wallslide.ogg` | 100ms (loopbar) | Kort friktions-noise — highpass filtered. | Bromsning — nagel mot tavla, men kontrollerat. |
| **Player Damage** | `sfx_player_hit.ogg` | 250ms | Distortad "CRUNCH" — sawtooth + waveshaper + noise burst. | SMARTA — du har blivit traffad, och det gor ont. |
| **Player Death** | `sfx_player_death.ogg` | 600ms | Dramatisk fallande sekvens — 4 nedatstigande toner + lag rumble. | Forlust — allt faller. Signalen dor. |
| **Heal** | `sfx_heal.ogg` | 200ms | Stigande "sparkle" — 3 ascending sines. | Lattnad, varme — livet atervander. |
| **Near Miss** | `sfx_nearmiss.ogg` | 80ms | Snabb hog whoosh fran ena sidan. | Adrenalinkick — SÅ NARA. |

### 10.2 FIENDE-SFX

| Ljud | Filnamn | Langd | Beskrivning | Kansla |
|------|---------|-------|-------------|--------|
| **Enemy Hit** | `sfx_enemy_hit.ogg` | 80ms | Kort metallisk "ping" — random-pitch square. | Traffar! — snabb feedback, belonande. |
| **Enemy Death** | `sfx_enemy_death.ogg` | 150ms | "POP-crunch" — bandpass noise + fallande sawtooth. | Tillfredsställelse — de ar borta. |
| **Boss Death** | `sfx_boss_death.ogg` | 800ms | Utdragen explosion-kaskad. Stigande ljud, sen BOOM, sen reverb-svans. | TRIUMF — du besegrade det. |
| **Chain Shock Zap** | `sfx_chain_zap.ogg` | 60ms | Elektrisk "SNAP" — snabb square sweep. | Koppling — kedjan lades vidare. |

### 10.3 PICKUP/UI-SFX

| Ljud | Filnamn | Langd | Beskrivning | Kansla |
|------|---------|-------|-------------|--------|
| **Pickup Health** | `sfx_pickup_health.ogg` | 120ms | Varm sparkle — basfrekvens 800Hz, uppat. | Lattnad. |
| **Pickup Shard** | `sfx_pickup_shard.ogg` | 120ms | Metallisk sparkle — basfrekvens 1000Hz, snabbare. | Girigt tillfredsställande — KA-CHING. |
| **Pickup Energy** | `sfx_pickup_energy.ogg` | 120ms | Elektrisk sparkle — 600Hz, djupare. | Makt — du laddas. |
| **Combo Tick** | `sfx_combo_tick.ogg` (per tier: 0-4) | 80ms | Stigande triangle-pip. Hogre per tier. | Momentum — varje kill bygger vidare. |
| **Combo Break** | `sfx_combo_break.ogg` | 300ms | Sorglig nedatstigande triangle. | Forlust — streaken ar over. Borja om. |
| **Menu Select** | `sfx_menu_select.ogg` | 100ms | Ren "bling" — 660→880Hz sine. | Ren interaktion — tydlig feedback. |
| **Menu Confirm** | `sfx_menu_confirm.ogg` | 150ms | Hogre "bling-bling" — tva toner. | Beslut — du valde, det ar gjort. |
| **Achievement** | `sfx_achievement.ogg` | 300ms | 4-tons stigande chime (660, 880, 1100, 1320). | Stolthet — du uppnadde nagot. |
| **Shop Purchase** | `sfx_shop_buy.ogg` | 200ms | Metallisk "ka-ching" + stigande ton. | Investering — valbart, hoppfullt. |
| **Biome Transition** | `sfx_biome_shift.ogg` | 500ms | Lang filter-sweep — laag till hog. Nytt biom-andas in. | Forandring — djupet skiftar, nya regler galler. |

---

## SAMMANFATTNING — ANTAL ASSETS

| Kategori | Antal filer (uppskattning) |
|----------|--------------------------|
| Tiles (alla biom + varianter) | ~50-60 sprite sheets |
| Bakgrunder (6 biom x 3 lager) | 18 |
| Spelarsprites (alla states) | ~35-40 frames |
| Fiendesprites (19 typer x 4-8 states) | ~150-200 frames |
| Projektiler & VFX | ~40-50 frames |
| Pickups & Items | ~20-25 frames |
| UI-element | ~30-35 |
| Partikeleffekter | ~25-30 frames |
| Musikfiler (6 biom x 4 lager + extras) | 28-30 |
| SFX-filer | ~35-40 |
| **TOTALT** | **~430-510 individuella assets** |

### REKOMMENDERAD SPRITESHEET-STRATEGI
- Packa alla spelarsprites i EN atlas (player_atlas.png)
- Packa alla fiender per typ eller per biom-grupp
- Alla tiles per biom i en atlas
- Alla UI i en atlas
- Alla VFX i en atlas
- Anvand TexturePacker JSON-format (redan refererat i arkitekturen)

### PRIORITETSORDNING FOR PRODUKTION
1. **Spelarsprites** — kärnan av spelets kansla
2. **Tiles (solid + platform + hazard)** — varldens grund
3. **Fodder-fiender (Hopper, Splitter, Leech)** — vanligast pa skarm
4. **Projektiler** — synliga hela tiden
5. **Pickups & HUD** — konstant feedback
6. **Bakgrunder** — atmosfar
7. **Resterande fiender** — djup och variation
8. **Musik** — biom-identitet
9. **SFX** — polish
10. **Bossar** — slutinnehall
