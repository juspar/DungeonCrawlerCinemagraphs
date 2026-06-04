# Project Scope: Dynamic Crawler Cinemagraphs

### 1. Project Objective

To develop a lightweight, code-driven digital display application that provides immersive, infinitely looping ambient art for readers of the Dungeon Crawler Carl series. The application will serve as a companion piece to the physical or digital reading experience, enhancing the atmosphere of the room without drawing active attention away from the text.

### 2. Technical Architecture

- **Visual Style**: Minimalist, multi-layered papercraft/vector illustration.
- **Animation Method**: Code-driven 2D manipulation (HTML5 Canvas/JavaScript) utilizing separated transparent WebP layers. This ensures zero compression artifacts, flawless infinite loops, and hardware-efficient rendering for long reading sessions.
- **Content Volume**: 2 to 4 distinct ambient scenes per book in the series.

### 3. Core Features

- **Spoiler-Gated UI**: A selection interface that allows the user to lock their visual experience to their exact progress in the series, ensuring later-floor environments or character additions are not prematurely revealed.
- **Seamless Transitions**: Fade or wipe logic between selected scenes that maintains the ambient, low-energy state of the display.

## Image Definition & Aesthetic Intent

This is the design bible for the artwork. Every scene must adhere to these emotional and structural rules.

### 1. The "Glance" Test (Primary Directive)

The image must be designed to be ignored. It is not a comic book panel or a movie still; it is an environment. If a reader glances up from their book, the screen should immediately validate the mood of the chapter they are reading. If they stare at it for 60 seconds, they should not see a story unfold—they should only feel a vibe.

### 2. The Aesthetic of the Quiet Moment

DCC is chaotic, loud, and incredibly violent. Your art must represent the exact opposite: the interstitial spaces.

- **Focus on**: The aftermath, the preparation, the long walks, the eerie silence of a newly revealed floor, or the temporary relief of a Safe Room.
- **Avoid**: Mid-swing action, exploding mobs, or active dialogue framing.

### 3. Rules of Motion (Ambient Presence)

Animation must be restricted entirely to environmental loops and idle states.

- **Permitted Motion**: Falling particles (snow, ash, rain), rolling fog, flickering light sources, scrolling textures (water, lava), and subtle sine-wave breathing/swaying of characters.
- **Forbidden Motion**: Walking cycles, complex gestures, sudden flashes, or any movement that creates a hard cut or demands peripheral attention.

### 4. Color and Composition

- **Tonal Isolation**: Each scene should be dominated by a strict monochromatic or dual-tone color palette (e.g., the freezing blue/white of the winter surface, the sickly green of a goblin tunnel).
- **Deliberate Accents**: Use a single, high-contrast spot color to define the focal point (e.g., the bright pink of a specific cat's accessory, or the ominous glow of a stairwell door).
- **Layered Depth**: Foregrounds should act as dark silhouettes framing the scene, leading the eye deep into the midground where the ambient motion lives.
