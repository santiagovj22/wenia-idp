# Service Template Changelog

All changes to the Service Template are documented here.
Any change to files under `skeleton/` requires a version bump in `VERSION` and an entry here.

## [1.0.0] - 2026-10-28

### Added
- Initial release: Full Slice (Node.js + K8s Service).
- Common layer: `.gitattributes`, `.gitignore`, `.env.example`, `catalog-info.yaml`, `.wenia/template.json`, `docs/`.
- Node.js language layer: Fastify service with 5 Baseline Endpoints, Node built-in test runner, contract test.
- K8s type layer: Dockerfile, Docker Compose, Kustomize manifests, Terraform (container registry + CD role), GitHub Actions CI/CD callers.
- Thin Skeleton stubs for Python/K8s, Node.js/Lambda, Python/Lambda (maturity: thin).
