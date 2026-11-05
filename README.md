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
  i18n/           # fa.ts / en.ts dictionaries (all copy) + site.ts (email, links)
  hooks/
  lib/
  types/
public/
  frames/d, m/    # 60 WebP frames each (desktop 1280w / mobile 720w), ~1.9 MB total
  resume/         # FA + EN résumé PDFs served by the download buttons
scripts/
  extract-frames.sh   # slices a source video into the frame sequence
```

The site is bilingual: Persian at `/` (served from `/fa`) and English at `/en`.
All copy lives in `src/i18n/fa.ts` and `src/i18n/en.ts`; contact details and
links live in `src/i18n/site.ts`. Each language downloads its own résumé from
`public/resume/`.

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

## Cinematic hero (scroll-scrubbed frame sequence)

`FrameSequenceHero.tsx` slices a laptop-opening clip into 60 small WebP
frames (two sets: `public/frames/d` for desktop, `public/frames/m` for phones,
~1.9 MB combined) and draws the matching frame to a `<canvas>` as you scroll.

Performance notes: frames load progressively (first frame, then a coarse pass,
then the rest) with limited concurrency; scrubbing always draws the nearest
loaded frame; drawing is coalesced into one `requestAnimationFrame`; canvas
resolution is capped at 1.5x DPR; on portrait screens the render is zoomed on
the laptop instead of letterboxed.

To replace the footage, slice a new MP4 with:

```bash
./scripts/extract-frames.sh path/to/laptop-reveal.mp4
```

`FRAME_COUNT` in `FrameSequenceHero.tsx` and `scripts/extract-frames.sh` must
stay in sync. With `prefers-reduced-motion`, a single still of the open laptop
is shown instead of the scroll animation.
