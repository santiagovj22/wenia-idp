# Wenia Service Onboarding — Golden Path in Backstage

A PoC for the Wenia Platform Engineer case study.
A developer fills in one form in Backstage and gets a GitHub repository with a working service, containers, CI/CD, Terraform, New Relic observability and documentation — already registered in the catalog.

> **Language note:** the technical document and demo video are in Spanish. Code and READMEs are in English.

---

## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Docker Desktop | any recent | must be running |
| Terraform | any recent | for evidence E6 |
| git | any | |

No Wenia infrastructure, accounts or credentials are required.

---

## Quick start

### 1. Configure secrets

```bash
cp .env.example .env
# Fill in GITHUB_TOKEN (classic PAT: repo, workflow, delete_repo)
# Fill in NEW_RELIC_LICENSE_KEY if you want live telemetry (optional)
# Leave WENIA_FAILURE_INJECTION empty
```

### 2. Run the environment bootstrap (Ansible, Evidence E7)

```powershell
docker run --rm -v "${PWD}:/workspace" -w /workspace cytopia/ansible:2.15 `
  ansible-playbook ansible/bootstrap.yml -c local
```

This creates `data/`, your `.env` (if missing), and `backstage/app-config.local.yaml`.
Run it twice — the second run must report `changed=0` (Evidence E7).

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

---

## Repository layout

```
backstage/          Backstage app (runs in Docker)
  catalog/          Seeded Groups and template locations
modules/
  scaffolder-wenia/ Custom scaffolder module (wenia:preflight, wenia:publish)
templates/
  service/          Service Template: template.yaml, VERSION, skeleton layers
ansible/            Environment bootstrap playbook (Evidence E7)
docs/               Technical document, troubleshooting, provenance, AI usage
data/               Screenshots and evidence (gitignored at runtime)
```

---

## Verification evidence

Evidence is documented with screenshots in `data/`. See `docs/DOCUMENTO-TECNICO.md` for the full verification results.

| ID | Description | Needs account |
| --- | --- | --- |
| E1 | Valid service created and registered | None |
| E2 | Invalid request rejected | None |
| E3 | Duplicate name detected | GitHub token |
| E4 | Failure during generation handled | GitHub token |
| E5 | API tests pass (CI green) | None |
| E6 | Terraform static validation | None |
| E7 | Ansible second run: changed=0 | None |
| E8 | Live telemetry in New Relic | New Relic (free) |
| E9 | Real AWS deployment | AWS (stretch) |

Static checks (E6, K8s manifests) are labelled as such and are **not** deployments.

---

## Demonstrate failure injection (Evidence E4)

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

See `docs/PROVENANCE.md` and `docs/AI-USAGE.md`.
