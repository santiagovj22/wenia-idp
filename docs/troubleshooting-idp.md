# Troubleshooting — Wenia IDP (Backstage Service Onboarding)

Guía para diagnosticar fallos en la plataforma IDP y en el proceso de generación de servicios.

---

## 1. Backstage no arranca

**Síntoma:** `docker compose up` falla o el contenedor se reinicia en loop.

| Causa probable | Diagnóstico | Solución |
| --- | --- | --- |
| Docker Desktop no está corriendo | `docker ps` devuelve error | Iniciar Docker Desktop |
| `.env` no existe | `ls .env` → no encontrado | `cp .env.example .env` y completar `GITHUB_TOKEN` |
| Puerto 7007 ocupado | `netstat -an | findstr 7007` | Cambiar el puerto en `docker-compose.yml` |
| Error de YAML en `app-config.production.yaml` | Logs: `YAMLParseError` | Revisar indentación — no puede haber claves duplicadas (e.g. `backend:` dos veces) |
| Postgres no inicia a tiempo | Logs: `ECONNREFUSED 5432` | Esperar y reintentar; el healthcheck reintenta 10 veces |

```powershell
# Ver logs completos
docker compose logs backstage --tail 50
docker compose logs postgres --tail 20
```

---

## 2. La plantilla no aparece en "Create"

**Síntoma:** el catálogo está vacío o no muestra "Wenia Service Template".

| Causa | Diagnóstico | Solución |
| --- | --- | --- |
| La ubicación del template no está registrada | Logs: `file ... does not exist` | Verificar que `backstage/catalog/wenia-template-location.yaml` apunta a la ruta correcta (`../templates/service/template.yaml`) |
| El template tiene un error de sintaxis YAML | Logs: `Failed to read template` | Abrir `templates/service/template.yaml` y validar la sintaxis |
| El catálogo no ha refrescado | — | Esperar 30–60 segundos; el catálogo hace polling |

```powershell
docker compose logs backstage 2>&1 | Select-String "template|Template|error"
```

---

## 3. Errores durante la generación (wenia:preflight)

### INVALID_NAME
El nombre del servicio no cumple la regla: `^[a-z][a-z0-9-]{1,38}[a-z0-9]$`

- Debe ser kebab-case en minúsculas
- Entre 3 y 40 caracteres
- Empieza con letra, termina con letra o dígito
- Sin guiones al final ni nombres reservados (`con`, `prn`, `aux`, etc.)

✅ `payments-notifier` ❌ `MyService` ❌ `a` ❌ `con`

### INVALID_DESCRIPTION
La descripción está vacía o supera 200 caracteres, o contiene caracteres no permitidos.

### INVALID_API_DEFINITION / UNSAFE_API_DEFINITION
El documento OpenAPI no es YAML/JSON válido, supera 200 KB, o contiene referencias externas (`$ref: https://...`).
Usar el ejemplo prefillado como punto de partida.

### UNKNOWN_OWNER
El equipo seleccionado no existe en el catálogo. Verificar que los grupos están sembrados:
```powershell
curl.exe http://localhost:7007/api/catalog/entities?filter=kind=Group
```

---

## 4. Errores durante la generación (wenia:publish)

### GITHUB_ERROR: GITHUB_TOKEN is not configured
`GITHUB_TOKEN` no está en `.env` o el contenedor no se reinició después de agregarlo.

```powershell
# Verificar que el token está disponible en el contenedor
docker compose exec backstage env | findstr GITHUB_TOKEN
# Si no aparece, reiniciar
docker compose down && docker compose up -d
```

### GITHUB_ERROR: Resource not accessible by personal access token
El token no tiene los scopes necesarios. Verificar en https://github.com/settings/tokens:
- ✅ `repo` (control total de repositorios privados y públicos)
- ✅ `workflow` (necesario para archivos `.github/workflows/`)
- ✅ `delete_repo` (necesario para la compensación de fallos)

### DUPLICATE_NAME
Ya existe un servicio con ese nombre en el catálogo de Backstage **o** como repositorio en GitHub.
Solución: elegir un nombre diferente, o eliminar el repositorio huérfano en GitHub.

### COMPENSATION_FAILED — repositorio huérfano
Si el proceso de compensación falla, el repositorio puede quedar en GitHub sin entidad en el catálogo.

```powershell
# 1. Verificar en GitHub
curl.exe -H "Authorization: Bearer $env:GITHUB_TOKEN" `
  https://api.github.com/repos/santiagovj22/<nombre-servicio>

# 2. Eliminar manualmente si existe
curl.exe -X DELETE -H "Authorization: Bearer $env:GITHUB_TOKEN" `
  https://api.github.com/repos/santiagovj22/<nombre-servicio>

# 3. Verificar que no quedó en el catálogo
# Ir a http://localhost:7007/catalog y buscar el servicio
```

---

## 5. El componente no aparece en el catálogo después de generarse

**Causa más común:** Backstage no puede leer `catalog-info.yaml` desde GitHub.

```powershell
docker compose logs backstage 2>&1 | Select-String "Unable to read|not allowed|<nombre-servicio>"
```

**Si aparece "Reading from ... is not allowed":**
Verificar que `raw.githubusercontent.com` está en la lista de hosts permitidos en `backstage/app-config.production.yaml`:
```yaml
backend:
  reading:
    allow:
      - host: raw.githubusercontent.com
```

**Si no aparece el error pero tampoco el componente:**
El catálogo puede tardar hasta 2 minutos en procesar una nueva ubicación. Esperar y refrescar.

---

## 6. El CI falla en el repositorio generado

### Dependencies lock file is not found
El repositorio generado no tiene `package-lock.json`. El flujo de CI usa `npm install` (no `npm ci`) para evitar este problema. Si el error persiste, revisar que `wenia-platform-workflows` está en la versión correcta del tag `v1`.

```powershell
# Verificar el tag v1 en wenia-platform-workflows
curl.exe https://api.github.com/repos/santiagovj22/wenia-platform-workflows/git/refs/tags/v1
```

### Cannot find module 'js-yaml'
El servicio fue generado con una versión anterior del template que no incluía `js-yaml` como devDependency. Solución: agregar manualmente al `package.json` del repositorio generado:
```json
"devDependencies": {
  "js-yaml": "^4.1.0"
}
```

---

## 7. Demostrar failure injection

```powershell
# 1. Habilitar en .env
#    WENIA_FAILURE_INJECTION=enabled

# 2. Reiniciar el contenedor
docker compose down && docker compose up -d

# 3. En Backstage: usar el template con failureInjection=after-repo-create
#    El run fallará, el repo creado se eliminará automáticamente,
#    y el mismo nombre se podrá reutilizar.

# 4. Deshabilitar cuando no requiera simular error
#    WENIA_FAILURE_INJECTION=   (dejar vacío)
docker compose down && docker compose up -d
```

---

## 8. Comandos útiles de diagnóstico

```powershell
# Estado de los contenedores
docker compose ps

# Logs en tiempo real
docker compose logs backstage -f

# Ver registros de runs (log de generaciones)
docker compose exec backstage cat /app/data/runs.jsonl

# Reinicio rápido (sin rebuilding)
docker compose down && docker compose up -d

# Rebuild completo (cuando hay cambios en código o config)
docker compose up --build

# Acceder al shell del contenedor
docker compose exec backstage sh
```

---

## 9. Checklist de inicio limpio

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
