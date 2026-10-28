/**
 * wenia:preflight — AD-1, AD-5
 * Validates the Service Request, checks for duplicates, writes openapi.yaml
 * to the workspace as plain data (never rendered by the template engine).
 */
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { CatalogClient } from '@backstage/catalog-client';
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import {
  validateServiceName,
  validateDescription,
  validateApiDefinition,
} from '../rules';
import { appendRunRecord } from '../runLog';
import { randomUUID } from 'crypto';

export function createPreflightAction(options: {
  catalogClient: CatalogClient;
  getToken: () => Promise<string | undefined>;
}) {
  const { catalogClient, getToken } = options;

  return createTemplateAction({
    id: 'wenia:preflight',
    description: 'Validates the Service Request and checks for duplicate names before anything is created.',
    schema: {
      input: z => z.object({
        serviceName: z.string(),
        language: z.string(),
        serviceType: z.string(),
        owner: z.string(),
        description: z.string(),
        apiDefinition: z.string(),
        failureInjection: z.string().optional(),
      }),
    },

    async handler(ctx) {
      const { serviceName, description, apiDefinition } = ctx.input;
      const failureInjection = ctx.input.failureInjection ?? 'none';
      const startMs = Date.now();
      const runId = randomUUID();

      // AD-4: failure injection (before-publish = before this action completes)
      if (failureInjection === 'before-publish') {
        const injectionEnabled = process.env.WENIA_FAILURE_INJECTION === 'enabled';
        if (!injectionEnabled) {
          throw new Error('INJECTION_DISABLED: set WENIA_FAILURE_INJECTION=enabled to use failure injection');
        }
        appendRunRecord({
          runId, serviceName, outcome: 'rejected',
          step: 'preflight', reasonCode: 'INJECTED_FAILURE',
          durationMs: Date.now() - startMs,
          templateVersion: '1.0.0', ts: new Date().toISOString(),
        });
        throw new Error('INJECTED_FAILURE: failure injected at before-publish');
      }

      ctx.logger.info(`[wenia:preflight] validating service request for "${serviceName}"`);

      // ── 1. Validate name ────────────────────────────────────────────────
      const nameResult = validateServiceName(serviceName);
      if (!nameResult.ok) {
        appendRunRecord({ runId, serviceName, outcome: 'rejected', step: 'preflight', reasonCode: nameResult.code, durationMs: Date.now() - startMs, templateVersion: '1.0.0', ts: new Date().toISOString() });
        throw new Error(`${nameResult.code}: ${nameResult.message}`);
      }

      // ── 2. Validate description ─────────────────────────────────────────
      const descResult = validateDescription(description);
      if (!descResult.ok) {
        appendRunRecord({ runId, serviceName, outcome: 'rejected', step: 'preflight', reasonCode: descResult.code, durationMs: Date.now() - startMs, templateVersion: '1.0.0', ts: new Date().toISOString() });
        throw new Error(`${descResult.code}: ${descResult.message}`);
      }

      // ── 3. Validate API definition ──────────────────────────────────────
      const apiResult = validateApiDefinition(apiDefinition);
      if (!apiResult.ok) {
        appendRunRecord({ runId, serviceName, outcome: 'rejected', step: 'preflight', reasonCode: apiResult.code, durationMs: Date.now() - startMs, templateVersion: '1.0.0', ts: new Date().toISOString() });
        throw new Error(`${apiResult.code}: ${apiResult.message}`);
      }

      // ── 4. Check for duplicate in catalog (case-insensitive) ────────────
      try {
        const token = await getToken();
        const entity = await catalogClient.getEntityByRef(
          `component:default/${serviceName.toLowerCase()}`,
          token ? { token } : undefined,
        );
        if (entity) {
          appendRunRecord({ runId, serviceName, outcome: 'rejected', step: 'preflight', reasonCode: 'DUPLICATE_NAME', durationMs: Date.now() - startMs, templateVersion: '1.0.0', ts: new Date().toISOString() });
          throw new Error(`DUPLICATE_NAME: A service named "${serviceName}" already exists in the catalog.`);
        }
      } catch (e: any) {
        if (e.message.startsWith('DUPLICATE_NAME')) throw e;
        ctx.logger.warn(`[wenia:preflight] catalog duplicate check failed (non-blocking): ${e.message}`);
      }

      // ── 5. Check for duplicate on GitHub ───────────────────────────────
      try {
        const githubToken = process.env.GITHUB_TOKEN;
        if (githubToken) {
          const octokit = new Octokit({ auth: githubToken });
          try {
            await octokit.rest.repos.get({ owner: 'santiagovj22', repo: serviceName });
            appendRunRecord({ runId, serviceName, outcome: 'rejected', step: 'preflight', reasonCode: 'DUPLICATE_NAME', durationMs: Date.now() - startMs, templateVersion: '1.0.0', ts: new Date().toISOString() });
            throw new Error(`DUPLICATE_NAME: A GitHub repository named "${serviceName}" already exists under santiagovj22.`);
          } catch (repoErr: any) {
            if (repoErr.status === 404) { /* Good — doesn't exist */ }
            else if (repoErr.message.startsWith('DUPLICATE_NAME')) { throw repoErr; }
            else { ctx.logger.warn(`[wenia:preflight] GitHub duplicate check failed (non-blocking): ${repoErr.message}`); }
          }
        }
      } catch (e: any) {
        if (e.message.startsWith('DUPLICATE_NAME')) throw e;
        ctx.logger.warn(`[wenia:preflight] GitHub check error (non-blocking): ${e.message}`);
      }

      // ── 6. Write openapi.yaml to workspace (never rendered by nunjucks) ─
      const openapiPath = path.join(ctx.workspacePath, 'openapi.yaml');
      fs.writeFileSync(openapiPath, apiDefinition, 'utf8');
      ctx.logger.info(`[wenia:preflight] wrote openapi.yaml to workspace`);
      ctx.logger.info(`[wenia:preflight] preflight passed for "${serviceName}"`);
    },
  });
}
