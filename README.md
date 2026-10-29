# Wenia Service Onboarding — Golden Path in Backstage

Internal Developer Platform for the Wenia Platform Engineer case study.
A developer fills in one form in Backstage and gets a GitHub repository with a working service, containers, CI/CD, Terraform, New Relic observability and documentation — already registered in the catalog.

> **Language note:** the technical document and demo video are in Spanish. Code and READMEs are in English.

---

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Docker Desktop | any recent | must be running |
| Terraform | any recent | |
| git | any | |

No Wenia infrastructure, accounts or credentials are required.

---

## Quick start

### 1. Configure secrets

```bash
cp .env.example .env
# Fill in GITHUB_TOKEN (classic PAT: repo, workflow, delete_repo)

# Leave WENIA_FAILURE_INJECTION empty
```

### 2. Run the environment bootstrap (Ansible, Evidence E7)

```powershell
docker run --rm -v "${PWD}:/workspace" -w /workspace cytopia/ansible:2.15 `
  ansible-playbook ansible/bootstrap.yml -c local
```

This creates `data/`, your `.env` (if missing), and `backstage/app-config.local.yaml`.
Run it twice — the second run must report `changed=0`.

### 3. Start Backstage

```bash
docker compose up --build
```

Backstage is ready at **http://localhost:7007** (guest sign-in).
First start is slow (~3–5 min) while the image builds and migrations run.

### 4. Generate a service

1. Open **http://localhost:7007**
2. Click **Create** → **Wenia Service Template**
3. Fill in the form and click **Create**
4. Follow the links to your new GitHub repository and Catalog entry

## Checklist de inicio limpio

Para reproducir el entorno desde cero:

```powershell
# 1. Clonar el repositorio
git clone https://github.com/santiagovj22/wenia-idp.git
cd wenia-idp

# 2. Configurar secretos
cp .env.example .env
# Editar .env con GITHUB_TOKEN

# 3. Bootstrap del entorno (Ansible)
docker run --rm -v "${PWD}:/workspace" -w /workspace cytopia/ansible:2.15 `
  ansible-playbook ansible/bootstrap.yml -c local

# 4. Iniciar la plataforma
docker compose up --build

# 5. Abrir http://localhost:7007 → Create → Wenia Service Template
```

---

## Repository layout

```
backstage/          Backstage app (runs in Docker)
  catalog/          Seeded Groups and template locations
  plugins/          Scaffold for wenia module
templates/
  service/          Service Template: template.yaml, VERSION, skeleton layers
ansible/            Environment bootstrap playbook
docs/               Technical document, troubleshooting, provenance
validation-evidence/               Screenshots and evidence
```


## Demonstrate failure injection

```powershell
# 1. Enable injection mode in .env
#    WENIA_FAILURE_INJECTION=enabled
# 2. Restart
docker compose down && docker compose up -d
# 3. Submit a request in the template with failureInjection=after-repo-create
# 4. Disable injection and restart when done
```

---

## Planning artifacts

All planning artifacts (brief, PRD, architecture spine, epics) live in `_bmad-output/planning-artifacts/`.

## Provenance and AI usage

See `docs/PROVENANCE.md`.
