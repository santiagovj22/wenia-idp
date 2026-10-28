# Ansible bootstrap

Idempotent playbook that prepares the local environment.
Run it once before `docker compose up`, and again to prove idempotency (second run must show `changed=0`).

## What it does

| Task | File | Overwrites? |
| --- | --- | --- |
| Create `data/` directory | `data/` | N/A |
| Create `.env` from `.env.example` | `.env` | Never |
| Render `backstage/app-config.local.yaml` | `backstage/app-config.local.yaml` | Never |

## How to run (Windows — PowerShell from the repo root)

```powershell
docker run --rm -v "${PWD}:/workspace" -w /workspace cytopia/ansible:2.15 `
  ansible-playbook ansible/bootstrap.yml -c local
```

## Evidence E7 — idempotency proof

Run the playbook twice and capture the second run output:

```powershell
# First run (makes changes)
docker run --rm -v "${PWD}:/workspace" -w /workspace cytopia/ansible:2.15 `
  ansible-playbook ansible/bootstrap.yml -c local

# Second run (must report changed=0)
docker run --rm -v "${PWD}:/workspace" -w /workspace cytopia/ansible:2.15 `
  ansible-playbook ansible/bootstrap.yml -c local
```

The second run's recap line must read:
```
localhost : ok=3  changed=0  unreachable=0  failed=0
```

Screenshot or copy the recap output into `evidence/E7.md` when running the verification harness.

## Image provenance

`cytopia/ansible:2.15` — https://hub.docker.com/r/cytopia/ansible  
Pin to a digest for production: `cytopia/ansible@sha256:<digest>`
