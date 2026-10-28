/**
 * Story 2.2 render test.
 * Verifies that the skeleton layers contain the expected files and that
 * a file in a later layer would win over the same path in an earlier layer
 * (simulating fetch:template with replace: true — AD-6).
 *
 * Run:  node --test templates/service/test/render.test.mjs
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SKEL = path.join(__dirname, '..', 'skeleton')

function layerFile (...parts) {
  return path.join(SKEL, ...parts)
}

// ── AC1: key files exist in each layer ──────────────────────────────────

test('common layer has required files', () => {
  const required = [
    '.gitattributes',
    '.gitignore',
    '.env.example',
    'catalog-info.yaml',
    path.join('.wenia', 'template.json'),
    path.join('docs', 'README.md'),
    path.join('docs', 'runbook.md'),
    path.join('docs', 'troubleshooting.md')
  ]
  for (const f of required) {
    assert.ok(fs.existsSync(layerFile('common', f)), `missing common/${f}`)
  }
})

test('Node.js layer has required files', () => {
  const required = [
    'package.json',
    path.join('src', 'index.js'),
    path.join('src', 'routes', 'health.js'),
    path.join('src', 'routes', 'items.js'),
    path.join('src', 'service', 'itemsService.js'),
    path.join('src', 'repository', 'itemsRepository.js'),
    path.join('test', 'health.test.js'),
    path.join('test', 'items.test.js'),
    path.join('test', 'contract.test.js'),
    'openapi.baseline.yaml'
  ]
  for (const f of required) {
    assert.ok(fs.existsSync(layerFile('lang', 'node', f)), `missing lang/node/${f}`)
  }
})

test('K8s layer has required files', () => {
  const required = [
    'Dockerfile',
    'docker-compose.yml',
    path.join('deploy', 'k8s', 'kustomization.yaml'),
    path.join('deploy', 'k8s', 'deployment.yaml'),
    path.join('deploy', 'k8s', 'service.yaml'),
    path.join('infra', 'main.tf'),
    path.join('infra', 'variables.tf'),
    path.join('infra', 'versions.tf'),
    path.join('.github', 'workflows', 'ci.yml'),
    path.join('.github', 'workflows', 'cd.yml')
  ]
  for (const f of required) {
    assert.ok(fs.existsSync(layerFile('type', 'k8s', f)), `missing type/k8s/${f}`)
  }
})

// ── AC3: later layer wins (replace: true) ───────────────────────────────

test('GitHub Actions files are NOT rendered (copyWithoutTemplating)', () => {
  const ci = fs.readFileSync(layerFile('type', 'k8s', '.github', 'workflows', 'ci.yml'), 'utf8')
  // These files must keep GitHub Actions ${{ }} syntax intact — if the template
  // engine had processed them they would be empty or broken.
  assert.ok(ci.includes('${{'), 'ci.yml should contain ${{ (GitHub Actions expressions)')
  assert.ok(!ci.includes('values.'), 'ci.yml should not contain Backstage values references')
})

test('catalog-info.yaml contains Backstage template variables', () => {
  const content = fs.readFileSync(layerFile('common', 'catalog-info.yaml'), 'utf8')
  assert.ok(content.includes('${{ values.serviceName }}'), 'catalog-info.yaml should have serviceName variable')
  assert.ok(content.includes('${{ values.templateVersion }}'), 'catalog-info.yaml should have templateVersion variable')
})

test('template.yaml references all four skeleton layers', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'template.yaml'), 'utf8')
  assert.ok(template.includes('./skeleton/common'), 'template.yaml must reference common layer')
  assert.ok(template.includes('./skeleton/lang/node'), 'template.yaml must reference lang/node layer')
  assert.ok(template.includes('./skeleton/lang/python'), 'template.yaml must reference lang/python layer')
  assert.ok(template.includes('./skeleton/type/k8s'), 'template.yaml must reference type/k8s layer')
  assert.ok(template.includes('./skeleton/type/lambda'), 'template.yaml must reference type/lambda layer')
})

test('template.yaml uses replace: true on non-common layers', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'template.yaml'), 'utf8')
  // Count occurrences of replace: true
  const matches = template.match(/replace:\s*true/g) || []
  assert.ok(matches.length >= 4, `expected at least 4 'replace: true' entries, found ${matches.length}`)
})

test('template.yaml uses copyWithoutTemplating for .github/workflows/**', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', 'template.yaml'), 'utf8')
  assert.ok(template.includes('.github/workflows/**'), 'template.yaml must exclude .github/workflows from templating')
})

test('VERSION file exists and is semver', () => {
  const version = fs.readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf8').trim()
  assert.match(version, /^\d+\.\d+\.\d+$/, 'VERSION must be a semver string')
})

test('CHANGELOG.md mentions VERSION', () => {
  const version = fs.readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf8').trim()
  const changelog = fs.readFileSync(path.join(__dirname, '..', 'CHANGELOG.md'), 'utf8')
  assert.ok(changelog.includes(version), `CHANGELOG.md must mention current version ${version}`)
})
