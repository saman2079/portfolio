# Portfolio — Next.js + TypeScript + Tailwind + Docker

A frontend-only developer portfolio with a scroll-driven 3D laptop hero
(opens on scroll, reveals a fake VS Code screen typing out an "about me"
code snippet). No backend — the contact form uses a `mailto:` link.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Framer Motion (scroll-linked animation)
- Docker (multi-stage build, standalone output)

## Project structure

```
src/
  app/            # routes, layout, global styles
  components/
    layout/       # Header, Footer
    sections/     # Hero, About, Skills, Projects, Contact
    hero/         # FrameSequenceHero (cinematic), LaptopScene (CSS fallback),
                  # CodeEditorScreen, TypewriterCode
    ui/           # small reusable pieces (SectionHeading, ProjectCard, ...)
  data/           # site.ts, projects.ts, skills.ts — edit these to personalize
  hooks/
  lib/
  types/
public/
  frames/         # drop frame_0001.webp..frame_0120.webp here (see below)
scripts/
  extract-frames.sh   # slices a source video into the frame sequence
```

To make this your own, edit `src/data/site.ts`, `src/data/projects.ts` and
`src/data/skills.ts` — no component code needs to change.

## Local development

Requirements: Node.js 20+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build   # production build
npm run start   # run the production build locally
npm run lint    # eslint
npm run type-check
```

## Running with Docker locally

```bash
docker compose up --build -d
```

Visit http://localhost:3000. Logs: `docker compose logs -f`. Stop:
`docker compose down`.

---

## Deploying to an Ubuntu cloud server (step by step)

This assumes a fresh Ubuntu 22.04/24.04 VPS (DigitalOcean, Hetzner, AWS
Lightsail, etc.) and a domain pointed at the server's IP (an `A` record).

### 1. Connect and do basic hardening

```bash
ssh root@YOUR_SERVER_IP
```

```bash
apt update && apt upgrade -y

# create a non-root user
adduser deploy
usermod -aG sudo deploy

# basic firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# switch to the new user for everything below
su - deploy
```

### 2. Install Docker Engine + Compose plugin

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# allow running docker without sudo
sudo usermod -aG docker $USER
newgrp docker

docker --version
docker compose version
```

### 3. Get the code onto the server

Push this project to a GitHub repo, then on the server:

```bash
cd ~
git clone https://github.com/yourusername/portfolio.git
cd portfolio
```

(No `.env` is required for this project since there's no backend.)

### 4. Build and run the container

```bash
docker compose up --build -d
docker compose ps
```

The app now listens on `127.0.0.1:3000` on the server (not yet public —
that's what Nginx + a domain are for, next).

### 5. Install Nginx as a reverse proxy

```bash
sudo apt install -y nginx
```

Create a site config:

```bash
sudo nano /etc/nginx/sites-available/portfolio
```

Paste, replacing `yourdomain.com`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it and reload:

```bash
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

At this point `http://yourdomain.com` should show the site.

### 6. Add free HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot edits the Nginx config to redirect HTTP → HTTPS and sets up
auto-renewal (`systemctl status certbot.timer` to confirm the timer is
active).

### 7. Deploying updates later

```bash
cd ~/portfolio
git pull
docker compose up --build -d
```

Docker rebuilds only the changed layers, so this is fast after the first
build.

### Optional: zero-downtime-ish restarts

For a personal portfolio, brief downtime during `docker compose up --build
-d` (a few seconds) is normally fine. If you want to avoid it entirely later,
look into `docker compose up --build -d --no-deps --scale portfolio=2`
behind Nginx, or a dedicated tool like Watchtower / a CI pipeline that
builds an image and does a rolling `docker compose up -d`.

## Cinematic hero (real rendered frame sequence)

`FrameSequenceHero.tsx` is the Apple-product-page technique: a real,
photorealistic laptop-opening clip is sliced into individual frames, all
frames are preloaded, and on scroll the matching frame is drawn to a
full-bleed `<canvas>`. No 3D engine runs in the browser — the realism comes
entirely from the source frames you provide, since I can't generate video or
photorealistic imagery myself in this environment (no image/video-generation
tool is available here).

**Two ways to get the actual frames:**

1. **AI video generation.** Feed your exact cinematic prompt (the "Frame 1 /
   Frame 30 / Frame 60..." brief) into a text-to-video tool that supports
   this style — Runway Gen-4, Luma Dream Machine, Kling, or Pika — and export
   a ~5 second MP4.
2. **Stock/3D footage.** Royalty-free "laptop opening" 3D renders exist on
   Pexels (free, no account needed) and on Vecteezy/iStock, several with a
   green-screen matte specifically so you can key in your own VS Code
   screen recording in an editor like DaVinci Resolve or After Effects:
   - https://www.pexels.com/search/videos/opening%20laptop/
   - https://www.vecteezy.com/free-videos/laptop-opening-animation
   - https://www.istockphoto.com/videos/laptop-opening-animation (search
     "laptop opening green screen" for chroma-key versions)

Once you have an MP4 (from either path), slice it into the sequence the
component expects:

```bash
./scripts/extract-frames.sh path/to/laptop-reveal.mp4
```

This writes `public/frames/frame_0001.webp` … `frame_0120.webp`. Frame count
(`FRAME_COUNT`) and resolution are configurable at the top of
`FrameSequenceHero.tsx` and `scripts/extract-frames.sh` — keep them in sync.

**Until real frames are added**, `public/frames/` is empty and
`FrameSequenceHero` automatically falls back to `LaptopScene.tsx`, the
CSS-only animated laptop from the previous version, so the hero is never
broken in the meantime.

`prefers-reduced-motion` is respected everywhere: both hero variants swap in
a static, non-animated version for users who've asked their OS for reduced
motion.
