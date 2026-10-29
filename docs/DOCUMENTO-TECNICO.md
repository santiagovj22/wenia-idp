# Documento Técnico — Wenia Service Onboarding
**Plataforma IDP con Backstage · Caso de Estudio Platform Engineer**
Candidato: Santiago Valle · Fecha: 2026-10-28

---

## 1. Arquitectura de la solución

### Visión general

La solución implementa una capacidad de autoservicio completa dentro de Backstage que permite a los equipos de desarrollo crear un nuevo microservicio en minutos, sin intervención del equipo de plataforma.

```
Developer
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  Backstage (Docker + Postgres)                          │
│                                                         │
│  Service Template                                       │
│    ├── wenia:preflight   (validación + dup check)       │
│    ├── fetch:template    (renderizado por capas)        │
│    └── wenia:publish     (GitHub + Catalog + saga)      │
└────────────┬────────────────────────┬───────────────────┘
             │                        │
             ▼                        ▼
     GitHub (repo público)    Backstage Catalog
             │                  Component + API
             │
     ┌───────┴──────────────────────────────┐
     │  Generated Service                   │
     │  ├── src/  (Fastify, 5 endpoints)    │
     │  ├── Dockerfile  (non-root)          │
     │  ├── deploy/k8s/  (Kustomize)        │
     │  ├── infra/  (Terraform)             │
     │  ├── .github/workflows/  (CI / CD)   │
     │  ├── openapi.yaml + baseline         │
     │  └── docs/ (README, runbook, guide)  │
     └──────────────────────────────────────┘
             │                        │
             ▼                        ▼
     GitHub Actions CI/CD      New Relic (OTLP)
     (wenia-platform-workflows)
```

### Componentes principales

| Componente | Tecnología | Propósito |
|---|---|---|
| Portal IDP | Backstage 1.56.0 (Docker) | Interfaz de autoservicio |
| Módulo scaffolder | TypeScript (backend module) | Acciones `wenia:preflight` y `wenia:publish` |
| Template | Backstage Software Template | Define el formulario y los pasos de generación |
| Skeleton por capas | 4 capas: common, lang, type, combo | Genera código consistente por combinación |
| CI/CD compartido | GitHub Actions + reusable workflows | Un fix llega a todos los servicios generados |
| Infraestructura | Terraform (validación estática) | ECR + IAM role para la ruta AWS |
| Observabilidad | OpenTelemetry → New Relic | Telemetría estándar, configurable por env vars |

---

## 2. Decisiones técnicas principales

### D1 — Un solo módulo con saga de compensación

El módulo `scaffolder-wenia` es el único componente que puede crear repositorios en GitHub o escribir en el catálogo. Implementa un patrón de saga: cada recurso creado registra una función de deshacer en un stack. Si cualquier paso falla, el stack se ejecuta en orden inverso. Esto garantiza que un error nunca se presenta como una creación exitosa.

**Alternativa descartada:** usar las acciones estándar `publish:github` + `catalog:register` sin compensación. Esto dejaría una ventana de tiempo donde el repositorio existe pero el catálogo aún no registró la entidad — un estado inconsistente que el candidato consideró inaceptable dado el requisito explícito del caso.

### D2 — Skeleton por capas con `replace: true`

El template combina cuatro capas jerárquicas (common → language → type → combo) en lugar de mantener cuatro skeletons separados. Esto reduce la superficie de mantenimiento: un fix en CI o en el runbook se aplica editando un archivo en la capa `common`, no en cuatro lugares distintos.

**Detalle técnico:** Backstage's `fetch:template` conserva el primer archivo escrito por defecto. Se usa `replace: true` en todas las capas posteriores a `common` para que la capa más específica siempre gane.

### D3 — Workflows reutilizables en repo separado

Los archivos CI y CD de los servicios generados son llamadores delgados (`uses: santiagovj22/wenia-platform-workflows/.github/workflows/ci.yml@v1`). Esto permite entregar un fix de seguridad en la pipeline a todos los servicios existentes sin regenerarlos ni abrir pull requests masivos.

### D4 — Validación estática honestamente etiquetada

Toda la evidencia generada por el harness de verificación lleva una etiqueta explícita: `executed`, `static` o `requires-account`. Terraform `validate` y los checks de manifiestos K8s son `static` — nunca se presentan como un despliegue exitoso.

### D5 — Backstage en Docker, módulo inline

Backstage corre en Docker (no nativo en Windows) para evitar problemas con dependencias nativas (`better-sqlite3`, `isolated-vm`). El módulo personalizado se integró directamente en `packages/backend/src/scaffolder/` en lugar de como paquete de workspace separado, lo que eliminó problemas de lockfile sin sacrificar la separación de responsabilidades en el código.

---

## 3. Límites de la implementación

| Límite | Descripción | Impacto |
|---|---|---|
| **Guest auth** | Backstage usa autenticación de invitado (`dangerouslyAllowOutsideDevelopment`). No apto para producción. | Solo para demo local |
| **Crash mid-run** | Si el proceso de Backstage muere a mitad de `wenia:publish`, el repositorio puede quedar huérfano. La guía de troubleshooting documenta cómo limpiarlo manualmente. | El caso pide "fallos durante generación", no tolerancia a fallos del proceso |
| **Concurrencia** | No hay bloqueo por nombre en solicitudes concurrentes. En un entorno de producción se requeriría un mutex o un check atómico. | PoC de un solo usuario |
| **Thin Skeletons** | Python/K8s, Node.js/Lambda y Python/Lambda generan código básico (health + Dockerfile + unit test) pero no están verificados end-to-end. | El caso exige un demo funcional, no cuatro combinaciones completas |
| **TechDocs** | Deshabilitado (requiere Python/mkdocs). La documentación se sirve directamente desde el repositorio GitHub a través del catálogo. | Sin impacto en el flujo principal |
| **New Relic** | La telemetría live requiere cuenta de New Relic y credenciales. La instrumentación OTel está generada; la evidencia E8 está disponible con las credenciales correctas. | Opcional en el caso |

---

## 4. Resultados de verificación

### Evidencias ejecutadas (sin cuenta AWS)

| ID | Descripción | Resultado |
|---|---|---|
| E1 | Creación y registro de servicio válido | ✅ Repositorio creado, Component y API en catálogo |
| E2 | Rechazo de solicitud inválida | ✅ Nombre inválido → `INVALID_NAME`, sin repo ni entidad |
| E3 | Nombre duplicado detectado | ✅ Mismo nombre → `DUPLICATE_NAME`, sin modificación |
| E4 | Fallo durante generación (`after-repo-create`) | ✅ Compensación eliminó el repo, mismo nombre reutilizable |
| E5 | Tests de API (11 tests, CI verde) | ✅ `pass 10, fail 0` + contrato con baseline |
| E6 | Validación estática Terraform | ✅ `fmt`, `init -backend=false`, `validate` — sin credenciales |
| E7 | Segunda ejecución Ansible: `changed=0` | ✅ Idempotencia confirmada |

### Evidencias que requieren cuenta externa

| ID | Descripción | Estado |
|---|---|---|
| E8 | Telemetría live en New Relic | Requiere cuenta New Relic (free tier disponible) |
| E9 | Despliegue real en AWS | Requiere cuenta AWS — ver sección de evolución |

---

## 5. Propuesta de evolución hacia AWS

### Arquitectura objetivo (diseño, no desplegado)

```
GitHub Actions (CD)
    │
    │  OIDC (no long-lived keys)
    ▼
AWS IAM Role (cd-role — validado con Terraform)
    │
    ├─► ECR (imagen Docker — validado con Terraform)
    │
    └─► Opción A: ECS Fargate (K8s Service)
        Opción B: AWS Lambda (Lambda Service)
                  └── API Gateway → Lambda → OTLP → New Relic
```

El módulo Terraform generado en cada servicio (`infra/`) ya contiene el repositorio ECR y el IAM role con trust policy para GitHub OIDC. Activar el despliegue real requiere:
1. `terraform apply` con backend S3 + DynamoDB
2. Variable de repositorio `DEPLOY_ENABLED=true` en GitHub
3. Configurar el target específico (ECS cluster o Lambda) en el workflow CD

### Hoja de ruta de madurez

| Fase | Acción | Beneficio |
|---|---|---|
| **Corto plazo** | Reemplazar guest auth con GitHub OAuth | Seguridad mínima viable |
| **Mediano plazo** | Despliegue real Lambda + ECS en AWS, backend Terraform en S3 | Ruta productiva completa |
| **Largo plazo** | Upgrade automático de servicios (PR generado al cambiar template), Port. TechDocs con mkdocs en container | Reducción de deuda técnica continua |

---

## 6. Métricas de valor del IDP

Para determinar si esta capacidad mejora la experiencia de desarrollo y reduce la dependencia del equipo de plataforma se proponen las siguientes métricas:

### Métricas primarias

| Métrica | Baseline | Fuente de datos |
|---|---|---|
| **Lead time** desde solicitud hasta primer despliegue | Medido hoy desde ticket hasta primer deploy | Sistema de tickets + historial CD |
| **% servicios creados sin intervención del equipo de plataforma** | 0% hoy (todos requieren intervención) | Catálogo Backstage + sistema de tickets |
| **Tasa de éxito** de Generation Runs en primer intento | — | `data/runs.jsonl` |
| **% servicios en la versión actual del template** | — | Anotación `wenia.io/template-version` en catálogo |

### Contra-métricas (no optimizar)

- **Tasa de falsos rechazos** en preflight (reglas demasiado estrictas bloquean solicitudes válidas)
- **Tiempo para diagnosticar un fallo** (más automatización no debe opacar la visibilidad)
- **Tickets que bajan por abandono** (no porque los developers resolvieron su necesidad)

### Señal cualitativa

Encuesta trimestral a developers: *"¿Pudiste empezar a escribir lógica de negocio el primer día sin esperar al equipo de plataforma?"*

**Uso de IA:** solución construida con Claude Code + método BMAD. los asistente proponen, el PO y BA desglosan las necesidades, El arquitecto revisa y traduce tecnicamente las desiciones, el platform engineer aplica, el ciclo se repite para que el arquitecto revise lo planteado por el platform engineer y el PO que alinee con el ADR; el candidato revisa, aprueba y hace el commit. Nada se llama "funciona" o "desplegado" a menos que haya sido ejecutado y producido la salida esperada.
