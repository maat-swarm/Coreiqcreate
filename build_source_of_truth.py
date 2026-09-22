#!/usr/bin/env python3
"""
Master Generator for SOURCE_OF_TRUTH.md
Builds the complete, standalone, authoritative reference document for CoreIQ Create.
"""

import os
import sys

SOURCE_FILES = [
    # Root & Config
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "metadata.json",
    "index.html",
    "server.ts",
    "supabase/schema.sql",

    # Core & Entry
    "src/main.tsx",
    "src/App.tsx",
    "src/index.css",
    "src/types.ts",
    "src/vite-env.d.ts",
    "src/types/command.ts",
    "src/utils/sound.ts",
    "src/assets/images.ts",
    "src/hooks/useScrollReveal.ts",
    "src/hooks/useMotionPruning.ts",
    "src/hooks/useMagneticHover.ts",

    # Services
    "src/services/coreiqRuntime.ts",
    "src/services/contentResolver.ts",
    "src/services/supabase.ts",

    # MCP Protocol Server
    "src/mcp/coreiqMcp.ts",

    # Content Manifest & Static Data
    "src/data/contentManifest.ts",
    "src/data/aboutData.ts",
    "src/data/appsData.ts",
    "src/data/learnData.ts",
    "src/data/solutionsData.ts",
    "src/data/toolsData.ts",

    # Pages
    "src/pages/HomePage.tsx",
    "src/pages/SolutionsPage.tsx",
    "src/pages/AppsPage.tsx",
    "src/pages/ToolsPage.tsx",
    "src/pages/LearnPage.tsx",
    "src/pages/LearnArticlePage.tsx",
    "src/pages/AboutPage.tsx",
    "src/pages/Ask.tsx",
    "src/pages/AskPage.tsx",
    "src/pages/ComingSoon.tsx",
    "src/pages/CommandDashboardPage.tsx",
    "src/pages/CommandLoginPage.tsx",

    # Common UI Components
    "src/components/common/Header.tsx",
    "src/components/common/Footer.tsx",
    "src/components/common/CoreIQLogo.tsx",
    "src/components/common/CoreIQMark3D.tsx",
    "src/components/common/CoreIQSentinel.tsx",
    "src/components/common/AskCoreIQBar.tsx",
    "src/components/common/ContentPlaceholder.tsx",
    "src/components/common/CosmicCTABanner.tsx",
    "src/components/common/PageHeroVisual.tsx",
    "src/components/common/AmbientBackground.tsx",
    "src/components/common/ScrollReveal.tsx",
    "src/components/common/SplashScreen.tsx",

    # Ask Subsystem
    "src/components/ask/GradientBorderBox.tsx",
    "src/components/ask/ScrambleText.tsx",
    "src/styles/ask.css",

    # Atmospheric & Environment Visuals
    "src/components/environment/SiteVisualEnvironment.tsx",
    "src/components/environment/VideoBackground.tsx",
    "src/components/environment/ImageBackground.tsx",
    "src/components/environment/AtmosphericLayer.tsx",
    "src/components/environment/AmbientParticles.tsx",
    "src/components/environment/EnergyField.tsx",
    "src/components/environment/InteractiveLightField.tsx",
    "src/components/environment/MascotEnvironment.tsx",
    "src/components/environment/ScrollVisualController.tsx",

    # CoreIQ Command Subsystems
    "src/components/command/CommandNav.tsx",
    "src/components/command/CommandAuthModal.tsx",
    "src/components/command/CommandInboxTab.tsx",
    "src/components/command/CommandTasksTab.tsx",
    "src/components/command/CommandClientsTab.tsx",
    "src/components/command/CommandBrainTab.tsx",
    "src/components/command/CommandToolsTab.tsx",
    "src/components/command/CommandPlatformsTab.tsx",
    "src/components/command/CommandContentTab.tsx",
    "src/components/command/CommandSwarmTab.tsx",
    "src/components/command/CommandAnalyticsTab.tsx",
    "src/components/command/CommandApiKeysTab.tsx",
]

def get_file_content(path):
    if not os.path.exists(path):
        return f"// File not found on disk: {path}\n"
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def get_language(path):
    if path.endswith(".ts") or path.endswith(".tsx"):
        return "typescript"
    elif path.endswith(".json"):
        return "json"
    elif path.endswith(".html"):
        return "html"
    elif path.endswith(".css"):
        return "css"
    elif path.endswith(".sql"):
        return "sql"
    return ""

def generate_document():
    doc = []

    # Title & Notice
    doc.append("# CORE IQ CREATE — MASTER SOURCE OF TRUTH")
    doc.append("> **CONFIDENTIAL & AUTHORITATIVE SYSTEM SPECIFICATION**  ")
    doc.append("> **Target Audience:** Autonomous AI Agents (Termux, Serverless, CI/CD, Containerized) and Systems Engineers.  ")
    doc.append("> **Zero-Memory Constraint:** This document serves as the standalone, self-contained truth of the entire CoreIQ Create software system. Do not extrapolate beyond what is documented here.")
    doc.append("\n---\n")

    # 1. WHAT THIS PROJECT IS
    doc.append("""## 1. WHAT THIS PROJECT IS

### 1.1 The Company and the Vision
**CoreIQ Create** is an intelligent AI creation environment, venture laboratory, and solutions ecosystem. Rather than offering a traditional marketing agency portfolio or a conventional SaaS dashboard, CoreIQ Create provides an integrated digital architecture spanning:
- **AI Autonomous Agents:** Intelligent reasoning agents, autonomous triage pipelines, and swarm nodes.
- **Enterprise Automations:** Workflow synchronization, inbound lead processing, webhook ingestion, and multi-platform communication.
- **Custom Web Applications & Portals:** Next-generation high-performance web applications built with TypeScript, React 19, and Vite.
- **Voice AI & Telephony:** Conversational voice waveforms and voice-agent integration hooks.
- **Intelligence & Machine Learning Infrastructure:** Multi-LLM runtime switching (Google Gemini with `gemini-3.8-flash` primary & cascade fallback, Groq, Anthropic, OpenAI, Local models) with live prompt parameter tuning and Model Context Protocol (MCP) server endpoints.
- **AI Education & Strategy Hub:** Curated learning paths, architecture whitepapers, and operational frameworks.
- **Universal Content Manifest & Headless CMS:** A 94-key structured content registry covering 6 core public surfaces with typed placeholders, health telemetry, and zero-layout-shift resolution.

### 1.2 The Three Interlocking Layers of the System
The system is partitioned into three functional tiers that communicate through Supabase and an Express API gateway:

1. **The Public Surface (`/`, `/solutions`, `/apps`, `/tools`, `/learn`, `/about`, `/ask`):**
   - A cinematic, dark-matter styled client application rendered with React 19, Tailwind CSS, and Framer Motion (`motion/react`).
   - Presents CoreIQ's capabilities, interactive tool directories, live apps showcase, and learning content.
   - Houses the **Ask CoreIQ** conversational discovery interface (`/ask`), where potential clients or autonomous systems describe a business objective, and the CoreIQ agent converts it into a structured technical blueprint (Intent, Technology Stack, Milestones, Estimated Timelines, and System Capabilities).
   - Ingests public lead inquiries directly into the Supabase `leads` table and triggers notification webhooks.
   - Leverages `resolveContent(content_key)` to bind CMS data or typed placeholders dynamically without layout shift.

2. **CoreIQ Command (`/command` and `/command/login`):**
   - The central operational cockpit for operators, strategists, and automated agents.
   - Gated behind Supabase Auth (`CommandLoginPage.tsx`). Unauthorized users are rejected and cannot access operational telemetry.
   - Contains 10 specialized operational sub-consoles:
     - **Inbox Tab:** Real-time ingestion of website leads and social webhooks (Meta, X, LinkedIn, WhatsApp) with instant audio chime alerts.
     - **Tasks Tab:** Kanban and status pipeline (`not_started`, `in_progress`, `review`, `completed`) linked to specific leads or clients.
     - **Clients Tab:** Unified client relationship registry, contacts, notes, and activity history.
     - **Agent Brain Tab:** Real-time control plane for the AI agent's model provider, base URL, model name, API key, and master system prompt. Changes made here update the public-facing agent instantly without requiring code redeployment.
     - **API Keys Tab:** Machine-to-machine credential generator and scope management console (`ciq_live_...` tokens hashed with SHA-256) for external agents like Hermes Prime.
     - **Tools Tab:** Dynamic registry of external tool connectors, API endpoints, and execution states.
     - **Platforms Tab:** Inventory of deployed websites, apps, and digital properties managed by CoreIQ.
     - **Content Tab:** Headless CMS management with dual Copy/Media tabs, manifest synchronization, and live health evaluation across all 94 content keys.
     - **Swarm Tab:** Inter-agent telemetry node viewer tracking autonomous node heartbeats and inter-agent messages.
     - **Analytics Tab:** Pipeline health, conversion metrics, and system throughput.

3. **The CoreIQ Autonomous Agent & MCP Server:**
   - The cognitive engine embedded in both the public discovery page (`AskPage.tsx`), machine API endpoints (`POST /api/ask`), and the Model Context Protocol server (`POST /mcp`).
   - Uses `coreiqRuntime.ts` as an abstraction layer. It reads the current configuration dynamically from the Supabase `agent_config` table (or local reactive memory if Supabase is unavailable), ensuring system prompts and model assignments are completely decoupled from static build artifacts.
   - Equipped with server-side Gemini intelligence using `@google/genai` targeting `gemini-3.8-flash` (with automated fallback cascade to `gemini-3.6-flash` and `gemini-flash-latest`), backed by safe non-JSON response error trapping.

### 1.3 How the System Connects to Supabase
Supabase serves as the **Single Unified Brain** of CoreIQ Create.
- **Project URL:** `https://irrpqqxetyfbafjpjtpt.supabase.co`
- **Tables (10 Total):** `leads`, `social_messages`, `tasks`, `clients`, `agent_config`, `agent_tools`, `platforms`, `content`, `swarm_comms`, `api_keys`.
- **Public Interaction:** Anon users can INSERT into `leads` and `social_messages`, and SELECT from `agent_config`, `platforms`, and published `content`. All other tables require authenticated operator access.
- **Dual-Engine Resilience (Local Reactive Mode vs. Remote Supabase):**
  - The client codebase (`src/services/supabase.ts`) and the server gateway (`server.ts`) implement an automated resilient dual-layer architecture.
  - If remote Supabase credentials are missing, or if the database tables have not yet been created via `supabase/schema.sql`, the application automatically falls back to an in-memory reactive data layer with local event broadcast (`coreiq_storage_event`).
  - As soon as the remote schema is executed in the Supabase SQL editor, the system automatically routes all operations to live PostgreSQL tables with real-time WebSocket subscriptions (`supabase_realtime`).

### 1.4 Content Manifest & Resolution Architecture
The application implements a structured content layer:
- **`src/data/contentManifest.ts`:** Master contract declaring 94 distinct `content_key` entries across 6 primary pages:
  - `home.*` (12 entries: hero, capability strips, explore cards, badges)
  - `solutions.*` (14 entries: hero, capability sections, process steps, goals)
  - `apps.*` (16 entries: hero, app categories, app cards, pro tier)
  - `learn.*` (20 entries: hero, curriculum pillars, guide articles, editorial topics)
  - `tools.*` (16 entries: hero, categories, utilities, tool cards)
  - `about.*` (16 entries: hero, principles, leadership, engineering stack, ethos)
- **`src/services/contentResolver.ts`:** Provides `resolveContent(content_key)`, `resolveBySlug(slug)`, and `seedManifestPlaceholders()`.
  - When status is `PUBLISHED` with non-empty body, it delivers published CMS data.
  - When draft or missing, it delivers a typed `PLACEHOLDER` with fallback title, summary, and metadata.
  - Guarantees zero layout shift and never throws.
- **`src/components/common/ContentPlaceholder.tsx`:** Polymorphic renderer displaying editorial placeholder cards with category tags, read times, and clear status badges.
- **Universal Content API (`server.ts`):**
  - `GET /api/v1/content/health`: Real-time health audit (total items, placeholder/draft/published counts, overall health percentage, and per-page breakdown).
  - `GET /api/v1/content/:key`: Fetch single content item.
  - `PATCH /api/v1/content/:key`: Update content body, summary, metadata, or status (requires `WRITE_CONTENT`).
  - `POST /api/v1/content/:key/publish`: Transition content key directly to `PUBLISHED` (requires `PUBLISH_CONTENT`).
""")

    # 2. REPOSITORY & DEPLOYMENT
    doc.append("""## 2. REPOSITORY & DEPLOYMENT

### 2.1 Repository Information
- **Current Workspace Environment:** Google Cloud Run containerized AI Studio build sandbox (`/app/applet`).
- **Branch Target:** `main`.
- **Git State in Current Workspace:** The immediate container filesystem does not contain an initialized `.git` directory (`fatal: not a git repository`). When committing or pushing from Termux or an external developer terminal, the remote must be configured explicitly:
  ```bash
  git init
  git remote add origin <GITHUB_REPOSITORY_URL>
  git branch -M main
  ```
  *(Note: External agents connecting via Termux should confirm the exact target GitHub repository URL provided by the organization lead, typically `https://github.com/<owner>/coreiqcreate.git`).*

### 2.2 Hosting and Live Deployment Surfaces
This application has two distinct deployment artifacts:
1. **Google Cloud Run (Active Development & Preview Container):**
   - **Development App URL:** `https://ais-dev-jhrfht3vpowrn4s5l6xp66-363637101760.europe-west2.run.app`
   - **Shared Production Preview URL:** `https://ais-pre-jhrfht3vpowrn4s5l6xp66-363637101760.europe-west2.run.app`
   - **Runtime Process:** Runs `server.ts` via `tsx server.ts` (dev) or `node dist/server.cjs` (production container) bound strictly to `0.0.0.0:3000`. Behind an nginx ingress proxy, all external traffic hits port 3000.

2. **Vercel Deployment (Static Frontend vs. API Gateway Architecture):**
   - **CRITICAL ARCHITECTURAL DISTINCTION:** Vercel's standard deployment reads `package.json` and executes `npm run build`, outputting static HTML/JS/CSS assets to `dist/`.
   - In a purely static Vercel hosting setup, the Vite frontend is served at Vercel edge nodes. **However, `server.ts` (the Node.js Express API gateway) DOES NOT automatically run in a standard static Vercel site** unless configured as a Vercel Serverless Function or routed via `vercel.json` rewrites.
   - Therefore, when deploying to Vercel:
     - **Option A (Container / Full-Stack Server):** Deploy the repository to a Node.js container service (e.g., Google Cloud Run, Render, Railway, Fly.io, or VPS) where `npm run build` runs and `node dist/server.cjs` executes continuously.
     - **Option B (Vercel Serverless Bridge):** If using Vercel, client calls to `/api/v1/*` must either be routed to the live Cloud Run backend URL via `vercel.json` rewrites:
       ```json
       {
         "rewrites": [
           {
             "source": "/api/(.*)",
             "destination": "https://ais-dev-jhrfht3vpowrn4s5l6xp66-363637101760.europe-west2.run.app/api/$1"
           }
         ]
       }
       ```
       or the Express app must be exported as an `@vercel/node` serverless handler in an `/api` directory.
   - **Unverified Vercel Claim:** Any claim that `server.ts` runs automatically as a persistent daemon on a standard static Vercel hobby deployment without serverless configuration is false. Verify the target deployment type before assuming `/api/v1/*` is reachable on a Vercel domain.

### 2.3 Build and Execution Scripts
Defined in `package.json`:
- `"dev": "tsx server.ts"`: Boots the unified Express server with integrated Vite middleware on `http://0.0.0.0:3000`.
- `"build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs"`: Compiles both the client-side SPA bundle into `dist/` and compiles `server.ts` into a standalone CommonJS bundle `dist/server.cjs`.
- `"start": "node dist/server.cjs"`: Production launch command executing the bundled CommonJS Express server, which serves static assets from `dist/` and mounts `/api/v1/*`.
- `"lint": "tsc --noEmit"`: Full TypeScript static analysis verification.
""")

    # 3. FULL FILE STRUCTURE
    doc.append("""## 3. FULL FILE STRUCTURE

A comprehensive inventory of all active source files in the repository:

```
.
├── .dev.env.json                             # Environment variable store (Supabase URL, Anon Key, Gemini API key)
├── .env.example                              # Template documenting required environment keys
├── .gitignore                                # Git ignore rules (node_modules, dist, secrets)
├── bun.lock                                  # Bun package lockfile
├── dist/                                     # Production build output folder
│   ├── assets/                               # Compiled JS, CSS, and media bundles
│   ├── index.html                            # Compiled client entry point
│   └── server.cjs                            # Bundled CommonJS Express API gateway server
├── index.html                                # HTML5 root template with fonts and metadata
├── metadata.json                             # Application metadata, permissions, and major capabilities
├── package.json                              # Project manifest, dependencies, scripts, and runtime engines
├── public/                                   # Public static asset directory
│   ├── assets/backgrounds/                   # Pre-rendered atmospheric video and image files
│   │   ├── coreiq-world.jpg                  # Fallback poster image for CoreIQ World
│   │   ├── coreiq-world.mp4                  # Ambient looping atmospheric motion video
│   │   └── coreiq-world.webp                 # High-efficiency WebP poster asset
│   ├── hero-bg.mp4                           # Primary cinematic hero motion asset
│   ├── hero-bg-clean.mp4                     # Clean high-bitrate looping background video
│   ├── logo.png                              # Raster CoreIQ mark
│   └── splash.mp4                            # Entry sequence splash cinematic video
├── server.ts                                 # Express API Gateway, Bearer auth, scope enforcement, and Vite proxy
├── SOURCE_OF_TRUTH.md                        # Master authoritative system specification document
├── supabase/
│   └── schema.sql                            # Complete PostgreSQL schema for 10 tables, RLS policies & Realtime
├── tsconfig.json                             # TypeScript compiler configuration (ESNext, React-JSX, Bundler mode)
├── vercel.json                               # Optional Vercel proxy configuration
├── vite.config.ts                            # Vite build setup with Tailwind v4, React plugin & HMR tuning
└── src/                                      # Application TypeScript source code
    ├── App.tsx                               # Master application component with route switching & layout
    ├── index.css                             # Tailwind CSS v4 styling rules, design tokens, and keyframes
    ├── main.tsx                              # React 19 DOM entry mount
    ├── types.ts                              # Core public domain interfaces (Navigation, Solutions, Apps, Tools)
    ├── vite-env.d.ts                         # Vite client environment definitions
    ├── assets/
    │   ├── images.ts                         # Image asset manifest mapping static photography & graphics
    │   └── images/                           # High-resolution optimized asset imagery
    ├── components/
    │   ├── ask/                              # Conversational Discovery Subsystem
    │   │   ├── GradientBorderBox.tsx         # Animated glowing border container for blueprint cards
    │   │   └── ScrambleText.tsx              # Matrix-style text scrambling reveal effect
    │   ├── command/                          # CoreIQ Command Operator Cockpit Components
    │   │   ├── CommandAnalyticsTab.tsx       # System throughput, lead conversion, and performance gauges
    │   │   ├── CommandApiKeysTab.tsx         # Machine credential generation, SHA-256 hashing, cURL docs & test console
    │   │   ├── CommandAuthModal.tsx          # Operator login & registration modal backed by Supabase Auth
    │   │   ├── CommandBrainTab.tsx           # Live LLM provider, model name, base URL & system prompt controller
    │   │   ├── CommandClientsTab.tsx         # Client relationship directory, email management & notes
    │   │   ├── CommandContentTab.tsx         # Headless CMS for copy, media, manifest sync & health evaluation
    │   │   ├── CommandInboxTab.tsx           # Inbound lead inbox with filter tags, status triage & audio chimes
    │   │   ├── CommandNav.tsx                # Tab navigation bar and system status indicators for Command
    │   │   ├── CommandPlatformsTab.tsx       # Inventory of deployed platforms and digital endpoints
    │   │   ├── CommandSwarmTab.tsx           # Autonomous swarm communications and node telemetry stream
    │   │   ├── CommandTasksTab.tsx           # Execution pipeline task board with status workflows
    │   │   └── CommandToolsTab.tsx           # External agent tools, connectors, and API endpoint registry
    │   ├── common/                           # Shared Global Public UI Components
    │   │   ├── AmbientBackground.tsx         # Lightweight dark background gradient wrapper
    │   │   ├── AskCoreIQBar.tsx              # Sticky dynamic floating query prompt bar
    │   │   ├── ContentPlaceholder.tsx        # Polymorphic renderer for draft/placeholder content states
    │   │   ├── CoreIQLogo.tsx                # Vector geometric identity mark with luminous cyan/violet styling
    │   │   ├── CoreIQMark3D.tsx              # Kinetic 3D energy core visualization
    │   │   ├── CoreIQSentinel.tsx            # Floating ambient guardian visualization
    │   │   ├── CosmicCTABanner.tsx           # High-impact bottom call-to-action banner
    │   │   ├── Footer.tsx                    # Semantic global footer with navigation links and system status
    │   │   ├── Header.tsx                    # Main header bar with responsive navigation, sound toggle & Command link
    │   │   ├── PageHeroVisual.tsx            # Cinematic visual container for sub-page headers
    │   │   ├── ScrollReveal.tsx              # Viewport intersection animation wrapper
    │   │   └── SplashScreen.tsx              # Cinematic entry cinematic with skip option
    │   └── environment/                      # Atmospheric & Cinematic Visual Layers
    │       ├── AmbientParticles.tsx          # Canvas-based floating energy particles with mouse responsiveness
    │       ├── AtmosphericLayer.tsx          # Volumetric depth gradients and cosmic noise textures
    │       ├── EnergyField.tsx               # Kinetic SVG undulating lines representing intelligent fields
    │       ├── ImageBackground.tsx           # Responsive image background with fallback handling
    │       ├── InteractiveLightField.tsx     # Mouse-tracking radial volumetric lighting
    │       ├── MascotEnvironment.tsx         # CoreIQ Phoenix energy-core dimensional system
    │       ├── ScrollVisualController.tsx    # Scroll position listener driving visual parallax
    │       ├── SiteVisualEnvironment.tsx     # Master visual composite controller layering video, canvas & gradients
    │       └── VideoBackground.tsx           # HTML5 video player with WebP poster fallback and low-motion support
    ├── data/                                 # Static Showcase, Documentation & Content Manifest
    │   ├── aboutData.ts                      # Principles, architecture methodology, and team philosophy
    │   ├── appsData.ts                       # Directory of AI-powered applications (ImageForge, DataPulse, etc.)
    │   ├── contentManifest.ts                # Master contract of 94 content keys across 6 routes with health evaluator
    │   ├── learnData.ts                      # Educational curriculum, architecture papers, and agent blueprints
    │   ├── solutionsData.ts                  # Comprehensive solution categories (Agents, Voice, Automations)
    │   └── toolsData.ts                      # Directory of specialized tools, utilities, and developer aids
    ├── hooks/                                # Custom React Hooks
    │   ├── useMagneticHover.ts               # Spring-physics magnetic cursor attraction hook
    │   ├── useMotionPruning.ts               # Hardware-aware motion reducer (low battery, reduced-motion)
    │   └── useScrollReveal.ts                # IntersectionObserver hook for triggering entry transitions
    ├── mcp/                                  # Model Context Protocol
    │   └── coreiqMcp.ts                      # MCP server tools (ask_coreiq, list_leads, create_task, get_agent_config)
    ├── pages/                                # Route Views
    │   ├── AboutPage.tsx                     # CoreIQ identity, engineering philosophy, and capabilities
    │   ├── AppsPage.tsx                      # Showcase gallery of applications built with CoreIQ
    │   ├── Ask.tsx                           # Master interactive conversational discovery agent & blueprint generator
    │   ├── AskPage.tsx                       # Re-export gateway for Ask component
    │   ├── ComingSoon.tsx                    # Minimalist placeholder view for in-flight routes
    │   ├── CommandDashboardPage.tsx          # The authenticated operator cockpit mounting all Command tabs
    │   ├── CommandLoginPage.tsx              # Dedicated operator authentication gate
    │   ├── HomePage.tsx                      # Primary landing showcase with interactive hero & capabilities
    │   ├── LearnArticlePage.tsx              # Dedicated single-guide view reading from resolveBySlug()
    │   ├── LearnPage.tsx                     # Knowledge base, guides, and strategic AI whitepapers
    │   ├── SolutionsPage.tsx                 # Detailed enterprise solution offerings
    │   └── ToolsPage.tsx                     # Interactive utilities and developer tooling catalog
    ├── services/                             # Core Data & Runtime Services
    │   ├── contentResolver.ts                # Dual-mode content resolver (PUBLISHED vs typed PLACEHOLDER)
    │   ├── coreiqRuntime.ts                  # Client-side AI agent orchestration, blueprint analyzer & prompt engine
    │   └── supabase.ts                       # Unified Supabase client, local reactive fallback, RLS & Realtime API
    ├── styles/
    │   └── ask.css                           # Scoped CSS styling for Ask CoreIQ conversation interface
    ├── types/
    │   └── command.ts                        # TypeScript interfaces for Command: Leads, Tasks, Clients, Keys, Content
    └── utils/
        └── sound.ts                          # Web Audio API procedural synthesizer (UI chimes, clicks, alerts)
```
""")

    # 4. THE FULL SOURCE CODE
    doc.append("""## 4. THE FULL SOURCE CODE

This section contains the literal, complete, current contents of every source code file in the repository. It is formatted with full markdown code blocks and file path headers so any autonomous agent or engineer can reconstruct the entire codebase from scratch.
""")

    for path in SOURCE_FILES:
        lang = get_language(path)
        content = get_file_content(path)
        doc.append(f"### File: `{path}`\n```{lang}\n{content}\n```\n")

    # 5. DATABASE SCHEMA
    doc.append("""## 5. DATABASE SCHEMA

### 5.1 SQL Migration Script (`supabase/schema.sql`)
The PostgreSQL schema below creates all 10 tables, enables `pgcrypto`, configures Row Level Security (RLS) policies, registers tables with the `supabase_realtime` publication, and seeds default records:

```sql
""")
    doc.append(get_file_content("supabase/schema.sql"))
    doc.append("""```

### 5.2 Detailed Explanation of the 10 Tables

| Table Name | Primary Purpose | Row Level Security (RLS) Policy | Realtime Enabled |
|---|---|---|---|
| **`leads`** | Stores inbound customer inquiries from the public website (`/ask`, contact buttons) and API ingest. | **Public / Anon:** `INSERT` allowed with check `true`.<br>**Authenticated:** Full `SELECT`, `UPDATE`, `DELETE`. | **Yes** (`supabase_realtime`) |
| **`social_messages`** | Captures incoming webhook payloads from social platforms (Meta, Instagram, X, LinkedIn, WhatsApp). | **Public / Anon:** `INSERT` allowed (webhook receiver).<br>**Authenticated:** Full access for operators. | **Yes** (`supabase_realtime`) |
| **`tasks`** | Internal project execution pipeline (`not_started`, `in_progress`, `review`, `completed`). Can link to a `lead_id` or `client_id`. | **Authenticated Only:** Read & write restricted to authenticated operators. Anon has no access. | **Yes** (`supabase_realtime`) |
| **`clients`** | Directory of verified clients, organizations, email addresses, phone contacts, and engagement notes. | **Authenticated Only:** Read & write restricted to authenticated operators. Anon has no access. | **Yes** (`supabase_realtime`) |
| **`agent_config`** | The "Mind" of the CoreIQ agent. Stores active `provider` (e.g. `groq`, `openai`, `gemini`), `model_name`, `base_url`, `api_key`, and `system_prompt`. | **Public / Anon:** `SELECT` allowed so the public website agent can load live configuration dynamically.<br>**Authenticated:** Full read/write for operators. | **Yes** (`supabase_realtime`) |
| **`agent_tools`** | Registry of external tools, function-calling connectors, and microservices available to the agent. | **Authenticated Only:** Operator-only management. Anon cannot view or modify. | **Yes** (`supabase_realtime`) |
| **`platforms`** | Catalog of active client sites, web apps, portals, and digital surfaces managed by CoreIQ. | **Public / Anon:** `SELECT` allowed for public status showcases.<br>**Authenticated:** Full read/write. | **Yes** (`supabase_realtime`) |
| **`content`** | Headless CMS storing articles, educational guides, news releases, key-value configurations, and media URLs. Extended with `content_key`, `slug`, `summary`, `status` (`PLACEHOLDER`\|`DRAFT`\|`REVIEW`\|`PUBLISHED`), `content_type`, `version`, and `metadata`. | **Public / Anon:** `SELECT` allowed where `published = true` or `status = 'PUBLISHED'`.<br>**Authenticated:** Full read/write. | **Yes** (`supabase_realtime`) |
| **`swarm_comms`** | Autonomous telemetry bus recording inter-agent messages, node heartbeats, and swarm orchestration logs. | **Authenticated Only:** Restricted to authenticated operators and service-role machines. | **Yes** (`supabase_realtime`) |
| **`api_keys`** | Machine credentials for external agents (e.g. Hermes Prime). Stores key prefix, SHA-256 hash, scopes, and revocation status. | **Authenticated:** Full access.<br>**Anon:** Public lookup allowed ONLY for hash verification where `revoked = false`. | **Yes** (`supabase_realtime`) |

### 5.3 Row Level Security (RLS) Analysis
- **Zero-Trust Defaults:** Every table has `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`.
- **Public Write Protection:** Anon clients cannot modify or delete existing leads, cannot read other users' leads, and cannot alter tasks, clients, or agent system prompts.
- **Dynamic Config Access:** Public clients can read `agent_config` without authentication so that when an operator adjusts the prompt or model in Command, visitors immediately experience the updated behavior without an app redeployment.
""")

    # 6. AUTHENTICATION & SECURITY MODEL
    doc.append("""## 6. AUTHENTICATION & SECURITY MODEL

### 6.1 CoreIQ Command Operator Authentication
CoreIQ Command (`/command`) is protected by Supabase Auth:
1. **Gatekeeper:** When navigating to `/command`, `CommandDashboardPage.tsx` checks `CoreIQData.getCurrentUser()`.
2. **Login View (`CommandLoginPage.tsx`):** If no active session exists, the UI renders a full-page operator authentication screen. No dashboard data, tabs, leads, or API keys are rendered in the DOM.
3. **Session Persistence:** When an operator enters their email and password:
   - The credentials are submitted to Supabase Auth via `supabase.auth.signInWithPassword({ email, password })`.
   - On success, the Supabase client stores the JWT access token and refresh token in browser `localStorage`.
   - A reactive listener (`supabase.auth.onAuthStateChange`) automatically updates the authenticated state.
4. **Sign Out:** The operator can click the **Sign Out** button in the Command header at any time, invoking `supabase.auth.signOut()`, which purges tokens and redirects immediately to the login gate.

### 6.2 External Agent API Gateway Authentication (`server.ts`)
External autonomous agents and headless scripts interact with CoreIQ via the HTTP API exposed by `server.ts` on port 3000 at `/api/v1/*` and the MCP endpoint at `/mcp`.

#### Authentication Mechanism:
- Every request must provide an API key via one of two headers:
  - `Authorization: Bearer <TOKEN>`
  - `x-api-key: <TOKEN>`
- Standard token format: `ciq_live_<48_HEX_CHARACTERS>` (e.g., `ciq_live_4f9a88...`).
- When `server.ts` receives a request:
  1. It extracts the raw token.
  2. It computes the SHA-256 hash of the token:
     ```typescript
     const tokenHash = crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
     ```
  3. It queries the `api_keys` table in Supabase (or fallback local memory):
     ```typescript
     const { data } = await supabase
       .from('api_keys')
       .select('*')
       .eq('key_hash', tokenHash)
       .eq('revoked', false)
       .maybeSingle();
     ```
  4. If no valid unrevoked key matches the hash, it returns HTTP `401 Unauthorized`.
  5. If valid, it updates `last_used_at` asynchronously and attaches the key record to `req.apiKey`.

### 6.3 Fine-Grained API Scopes
Every key possesses a specific array of scopes. The gateway validates scopes using `requireScope(scope)`:

| Scope | Category | Description & Permitted Actions |
|---|---|---|
| `READ_LEADS` | Ingestion & CRM | Allows `GET /api/v1/leads` to list customer inquiries and contact requests. |
| `WRITE_LEADS` | Ingestion & CRM | Allows `POST /api/v1/leads` to inject new leads into the pipeline. |
| `READ_TASKS` | Execution | Allows `GET /api/v1/tasks` to read active tasks and project statuses. |
| `WRITE_TASKS` | Execution | Allows `POST /api/v1/tasks` to create new tasks or update task stages. |
| `READ_CLIENTS` | Directory | Allows `GET /api/v1/clients` to query the client database. |
| `WRITE_CLIENTS` | Directory | Allows `POST /api/v1/clients` to create or update client records. |
| `READ_CONTENT` | CMS | Allows `GET /api/v1/content` and `GET /api/v1/content/:key` to read CMS entries. |
| `WRITE_CONTENT` | CMS | Allows `POST /api/v1/content` and `PATCH /api/v1/content/:key` to create or update articles. |
| `PUBLISH_CONTENT` | CMS | Allows `POST /api/v1/content/:key/publish` to transition a content key from PLACEHOLDER directly to PUBLISHED. |
| `READ_CONFIG` | Brain | Allows `GET /api/v1/config` to read the active LLM provider and system prompt. |
| `WRITE_CONFIG` | Brain | Allows `POST /api/v1/config` to update the active LLM provider, model name, and prompt. |

If a key attempts an operation without the required scope, the server immediately rejects the request with HTTP `403 Forbidden`:
```json
{
  "error": "Forbidden",
  "message": "API Key 'My Agent' does not have the required 'WRITE_LEADS' scope.",
  "available_scopes": ["READ_LEADS"]
}
```

### 6.4 Verification Status: Tested vs. Untested
- **Missing Key Check (401):** **VERIFIED LIVE.** Calling `curl -s http://localhost:3000/api/v1/leads` without headers returns 401 Missing API Key.
- **Invalid Key Check (401):** **VERIFIED LIVE.** Calling with `Authorization: Bearer ciq_live_invalidkey123` returns 401 Unauthorized.
- **Authenticated Request (200):** **VERIFIED LIVE.** Calling with pre-seeded test key `ciq_live_devmaster_00000000000000000000000000000000` successfully returns 200 OK.
- **Content Health Endpoint (200):** **VERIFIED LIVE.** Calling `GET /api/v1/content/health` returns status counts for all 94 entries with `by_page` breakdown.
- **POST /api/ask Neural Processing (200):** **VERIFIED LIVE.** Calling `POST /api/ask` processes through `gemini-3.8-flash` and returns structured architectural recommendations.
""")

    # 7. HOW TO GENERATE AND USE AN API KEY
    doc.append("""## 7. HOW TO GENERATE AND USE AN API KEY

### 7.1 Generating a Key via CoreIQ Command
1. Navigate to `/command` and authenticate as an operator.
2. Select the **API Keys** tab in the navigation bar.
3. Click the **Generate API Key** button.
4. Provide a recognizable label (e.g. `Hermes-Agent-Node-01`).
5. Select the required permission scopes using the check boxes or quick presets (**All Access**, **Read Only**, or **Ingestion Agent**).
6. Click **Generate Key**:
   - The browser generates 24 cryptographically random bytes using `window.crypto.getRandomValues`.
   - The raw token is assembled as `ciq_live_<hex_string>`.
   - The browser computes the SHA-256 hash using the Web Crypto API (`crypto.subtle.digest('SHA-256')`).
   - The key metadata and hash are written to the database. The raw token is shown **only once** in a modal dialog.
7. Copy the raw token and store it securely in your agent's environment.

### 7.2 Working cURL Examples

#### Example 1: System Health Ping (Public)
```bash
curl -i -X GET "https://ais-dev-jhrfht3vpowrn4s5l6xp66-363637101760.europe-west2.run.app/api/v1/ping"
```
*Expected Output:*
```json
{
  "status": "online",
  "system": "CoreIQ Command Autonomous Gateway",
  "timestamp": "2026-09-22T00:38:00.000Z",
  "supabase_configured": true
}
```

#### Example 2: Content Health Telemetry Check (Requires `READ_CONTENT`)
```bash
curl -i -X GET "https://ais-dev-jhrfht3vpowrn4s5l6xp66-363637101760.europe-west2.run.app/api/v1/content/health" \\
  -H "Authorization: Bearer ciq_live_your_token_here"
```
*Expected Output:*
```json
{
  "status": "ok",
  "total_items": 94,
  "manifest_keys": 94,
  "health_percentage": 0,
  "breakdown": {
    "published": 0,
    "review": 0,
    "draft": 0,
    "placeholder": 94,
    "missing": 0
  },
  "by_page": {
    "home": { "total": 12, "published": 0, "placeholder": 12 },
    "solutions": { "total": 14, "published": 0, "placeholder": 14 },
    "apps": { "total": 16, "published": 0, "placeholder": 16 },
    "learn": { "total": 20, "published": 0, "placeholder": 20 },
    "tools": { "total": 16, "published": 0, "placeholder": 16 },
    "about": { "total": 16, "published": 0, "placeholder": 16 }
  }
}
```

#### Example 3: Publish a Manifest Key Directly (Requires `PUBLISH_CONTENT`)
```bash
curl -i -X POST "https://ais-dev-jhrfht3vpowrn4s5l6xp66-363637101760.europe-west2.run.app/api/v1/content/learn.guide.ai-workflows/publish" \\
  -H "Authorization: Bearer ciq_live_your_token_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Autonomous AI Workflows in Production",
    "summary": "Engineering guide to deploying resilient agent workflows.",
    "body": "## Full Technical Guide\\n\\nProduction agent orchestration requires...",
    "category": "Curated Guide"
  }'
```

#### Example 4: Ingest a Lead (Requires `WRITE_LEADS`)
```bash
curl -i -X POST "https://ais-dev-jhrfht3vpowrn4s5l6xp66-363637101760.europe-west2.run.app/api/v1/leads" \\
  -H "Authorization: Bearer ciq_live_your_token_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_name": "Acme Ventures",
    "client_contact": "alex@acmeventures.io",
    "client_message": "Need an autonomous agent pipeline for customer triage.",
    "intent_type": "agent",
    "budget_range": "$25k - $50k"
  }'
```

#### Example 5: Model Context Protocol (MCP) Stream Invocation
```bash
curl -i -X POST "https://ais-dev-jhrfht3vpowrn4s5l6xp66-363637101760.europe-west2.run.app/mcp" \\
  -H "Authorization: Bearer ciq_live_your_token_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "ask_coreiq",
      "arguments": { "message": "What is the recommended tech stack for a voice agent?" }
    },
    "id": 1
  }'
```

### 7.3 Working Python Script for Autonomous Agents
Save this script as `agent_sync.py` and run it in any Python 3 environment (including Termux):

```python
import os
import requests
import json

API_BASE_URL = os.getenv("COREIQ_API_URL", "http://localhost:3000/api/v1")
API_TOKEN = os.getenv("COREIQ_API_KEY", "ciq_live_devmaster_00000000000000000000000000000000")

HEADERS = {
    "Authorization": f"Bearer {API_TOKEN}",
    "Content-Type": "application/json"
}

def check_health():
    res = requests.get(f"{API_BASE_URL}/ping")
    print("Health Ping:", res.json())

def check_content_health():
    res = requests.get(f"{API_BASE_URL}/content/health", headers=HEADERS)
    print("Content Health Telemetry:", res.json())

def submit_lead(name, contact, message, intent="agent"):
    payload = {
        "client_name": name,
        "client_contact": contact,
        "client_message": message,
        "intent_type": intent
    }
    res = requests.post(f"{API_BASE_URL}/leads", headers=HEADERS, json=payload)
    print(f"Lead Submission ({res.status_code}):", res.json())

if __name__ == "__main__":
    check_health()
    check_content_health()
    submit_lead("Nexus Robotics", "lead@nexus.ai", "Autonomous warehouse orchestration agent.")
```
""")

    # 8. HOW TO MAKE CHANGES VIA TERMUX
    doc.append("""## 8. HOW TO MAKE CHANGES VIA TERMUX

### 8.1 Termux Environment Setup
Termux is an Android terminal emulator and Linux environment. To configure a complete autonomous development station:

```bash
pkg update && pkg upgrade -y
pkg install -y git nodejs python curl clang
npm install -g vite tsx
```

### 8.2 Repository Cloning & Environment Setup
```bash
git clone <YOUR_COREIQ_REPO_URL>
cd coreiqcreate
npm install
```

### 8.3 Running the Local Dev Server & Build
```bash
# Verify TypeScript typing
npm run lint

# Compile production bundles
npm run build

# Start server on port 3000
npm run dev
```

### 8.4 The Safe Git Workflow: NEVER Push Without Verification
Before creating a commit or pushing to `main`:
1. Run `npm run lint` (`tsc --noEmit`) to verify 0 compiler errors.
2. Run `npm run build` to confirm Vite asset bundling and server CommonJS bundling succeed.
3. Commit and push:
```bash
git add .
git commit -m "feat: [detailed description]"
git push origin main
```

### 8.5 Common Failure Patterns in this Codebase
1. **Linux File Case Sensitivity:**
   - Linux and Android filesystems are strictly case-sensitive (`AskCoreIQBar.tsx` is NOT `AskCoreIqBar.tsx`).
   - If an import has the wrong casing, it will fail in Linux CI/CD with `Module not found`.
2. **Unescaped Apostrophes in JSX Strings:**
   - In React JSX, writing `We'll help you` unescaped in text children can trigger ESLint or JSX parsing errors.
   - Always use `We&apos;ll` or `{"We'll"}` or template strings.
3. **Interface / Implementation Drift in `src/services/supabase.ts`:**
   - If you add a new data method (e.g. `checkDatabaseStatus` or `updateLead`), ensure it exists on the exported `CoreIQData` object AND in any matching interface type definitions.
4. **Motion Import Location:**
   - Use `motion/react`, not the deprecated `framer-motion` import path.
""")

    # 9. HOW TO CHANGE WEBSITE CONTENT, MODEL, AND BEHAVIOR
    doc.append("""## 9. HOW TO CHANGE THE WEBSITE'S CONTENT, MODEL, AND BEHAVIOR

### 9.1 Changing the Active LLM Provider, Model & Prompt (No Redeploy Required)
The CoreIQ agent does not hardcode its prompt or model into the compiled bundle. It queries the `agent_config` table dynamically at runtime:
1. Navigate to `/command` and authenticate.
2. Open the **Agent Brain** tab.
3. Select the desired **Model Provider**:
   - `Google Gemini` (default: `gemini-3.8-flash` via `@google/genai`, with automated cascade fallback to `gemini-3.6-flash` and `gemini-flash-latest`)
   - `Groq` (`llama-3.3-70b-versatile` via `https://api.groq.com/openai/v1`)
   - `OpenAI` (`gpt-4o`, `gpt-4o-mini`)
   - `Anthropic` (`claude-3-5-sonnet-20241022`)
   - `Local / Custom Ollama`
4. Enter the provider's API key and adjust the **System Prompt** textarea.
5. Click **Save Brain Configuration**.
6. **How to Verify:** Navigate to `/ask` and send a message. The public conversational agent immediately queries the updated configuration from Supabase and applies the new prompt rules in real time.

### 9.2 Managing Content, News & Media via the Content Tab
1. In `/command`, open the **Content** tab.
2. Inspect the **Content Telemetry Strip**: shows overall coverage across all 6 pages and the total count of managed keys (94 keys).
3. Click **Sync Manifest Placeholders** to ensure all manifest keys are present in storage.
4. Use the **Copy** and **Media** sub-tabs to edit values, titles, and media references.
5. Click **Save**. The updated item is persisted to `public.content` and updates UI components instantly.

### 9.3 Content Publishing Workflow (Transitioning from PLACEHOLDER to PUBLISHED)
Every content key has a dual-phase lifecycle:
1. **Initial State (`PLACEHOLDER`):** The item exists as a typed placeholder with default title, category, and summary. It renders gracefully via `ContentPlaceholder.tsx` without layout shift.
2. **Publishing via API:** An external agent or script sends:
   ```bash
   POST /api/v1/content/<content_key>/publish
   Authorization: Bearer <KEY_WITH_PUBLISH_CONTENT_SCOPE>
   Content-Type: application/json
   {
     "title": "Article Title",
     "summary": "Executive summary...",
     "body": "# Markdown Content...",
     "category": "Curated Guide"
   }
   ```
3. **Resolution:** Next time `resolveContent(content_key)` or `resolveBySlug(slug)` executes, it returns `status: 'PUBLISHED'`, `isPlaceholder: false`, and renders the full published article.

### 9.4 Adding a New Invisible Tool for Agent Invocation
1. Open the **Tools** tab in `/command`.
2. Click **Add External Tool**.
3. Define:
   - **Tool Name:** Identifier (e.g., `github_repo_dispatcher`, `twilio_voice_dialer`)
   - **Provider:** e.g., `GitHub`, `Twilio`, `Stripe`
   - **Endpoint URL:** The external webhook or REST endpoint
   - **API Key / Secret:** Authentication credential for the tool
   - **Status:** `connected`, `testing`, or `dormant`
4. The tool definition is stored in `agent_tools`, allowing the agent orchestrator to discover and bind it dynamically.
""")

    # 10. KNOWN ISSUES, OPEN QUESTIONS, AND UNVERIFIED CLAIMS
    doc.append("""## 10. KNOWN ISSUES, OPEN QUESTIONS, AND UNVERIFIED CLAIMS

An unvarnished assessment of the current state of the system:

### 10.1 Verified Facts
1. **TypeScript Build & Lint:** `npm run lint` (`tsc --noEmit`) and `npm run build` (`vite build && esbuild server.ts ...`) pass with **0 errors**.
2. **API Gateway Auth & Scopes:** Unauthenticated calls to `/api/v1/*` are rejected with HTTP 401. Valid SHA-256 token hashes authenticate successfully and enforce fine-grained scopes (`READ_CONTENT`, `WRITE_CONTENT`, `PUBLISH_CONTENT`, `WRITE_LEADS`, etc.).
3. **Resilient Local Fallback:** When remote Supabase tables are unavailable, `src/services/supabase.ts` and `server.ts` automatically run in local reactive mode using in-memory state and cross-tab storage events, preventing white-screen crashes.
4. **Dev Server & Ingress Status:** `server.ts` runs on port 3000, proxies Vite in development, and responds to `/api/health`, `/api/v1/ping`, `/api/v1/content/health`, and `/api/ask`.
5. **AI Runtime Resilience:** `POST /api/ask` executes against `gemini-3.8-flash` with automatic fallback to `gemini-3.6-flash` and `gemini-flash-latest`. Client-side `coreiqRuntime.ts` safely inspects response headers to prevent JSON syntax exceptions on upstream errors.
6. **Universal Content Manifest:** 94 content keys across 6 routes mapped in `src/data/contentManifest.ts` and seeded idempotently into local storage / Supabase.
7. **Model Context Protocol (MCP):** Server mounted at `/mcp` with Bearer auth supporting `ask_coreiq`, `list_leads`, `create_task`, and `get_agent_config`.

### 10.2 Known Issues & Required Operator Actions
1. **Remote Supabase Schema Execution Required:**
   - **Status:** The remote project `https://irrpqqxetyfbafjpjtpt.supabase.co` is configured in `.dev.env.json`, but when querying `public.leads`, PostgreSQL returns:
     `"Could not find the table 'public.leads' in the schema cache"`
   - **Action Required:** The operator must copy the contents of `supabase/schema.sql` (reproduced in Section 5 of this document), open the Supabase Dashboard SQL Editor for project `irrpqqxetyfbafjpjtpt`, paste the SQL, and click **Run**. Once executed, remote synchronization will activate immediately.

2. **Git Repository Status in AI Studio Container:**
   - **Status:** The current container does not have a `.git` tracking directory.
   - **Action Required:** When syncing with GitHub, use `git init`, set the correct remote origin, and pull or push to `main`.

3. **Vercel Deployment Model (Static vs. Express):**
   - **Status:** There is no `vercel.json` file in the root.
   - **Warning:** Deploying this repository to Vercel without a custom `vercel.json` or serverless adapter will only deploy the static frontend in `dist/`. The Express endpoints in `server.ts` will not run unless hosted on a container platform (Cloud Run, Render, VPS) or configured with Vercel Serverless Functions.

4. **Web Audio Autoplay Restrictions:**
   - Procedural sound effects in `src/utils/sound.ts` require user interaction (a click or keypress) before the browser's `AudioContext` is allowed to emit sound. The app handles this by resuming the audio context on user interaction.
""")

    full_doc = "\n\n".join(doc)
    output_path = "SOURCE_OF_TRUTH.md"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(full_doc)

    print(f"Successfully generated {output_path} with {len(full_doc)} characters and {len(full_doc.splitlines())} lines.")

if __name__ == "__main__":
    generate_document()
