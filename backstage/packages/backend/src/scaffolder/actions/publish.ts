/**
 * wenia:publish — AD-1, AD-2, AD-3, AD-4
 * Creates the GitHub repository, pushes the workspace content, and registers
 * the entity in the Backstage catalog.
 * Uses a saga (undo stack) so a failure leaves nothing behind.
 */
import { createTemplateAction, initRepoAndPush } from '@backstage/plugin-scaffolder-node';
import { CatalogClient } from '@backstage/catalog-client';
import { Octokit } from '@octokit/rest';
import { appendRunRecord } from '../runLog';
import { randomUUID } from 'crypto';

type UndoFn = () => Promise<void>;

async function runCompensation(undoStack: UndoFn[], logger: any): Promise<string[]> {
  const leftovers: string[] = [];
  for (const undo of [...undoStack].reverse()) {
    try {
      await undo();
    } catch (e: any) {
      logger.error(`[wenia:publish] compensation step failed: ${e.message}`);
      leftovers.push(e.message);
    }
  }
  return leftovers;
}

export function createPublishAction(options: {
  catalogClient: CatalogClient;
  getToken: () => Promise<string | undefined>;
}) {
  const { catalogClient, getToken } = options;

  return createTemplateAction({
    id: 'wenia:publish',
    description: 'Creates the GitHub repository, pushes content, and registers in the catalog. Undoes everything on failure.',
    schema: {
      input: z => z.object({
        serviceName: z.string(),
        language: z.string(),
        serviceType: z.string(),
        owner: z.string(),
        description: z.string(),
        templateVersion: z.string(),
        templateRef: z.string(),
        failureInjection: z.string().optional(),
      }),
      output: z => z.object({
        repoUrl: z.string(),
        entityRef: z.string(),
      }),
    },

    async handler(ctx) {
      const { serviceName, description, templateVersion } = ctx.input;
      const failureInjection = ctx.input.failureInjection ?? 'none';
      const startMs = Date.now();
      const runId = randomUUID();
      const undoStack: UndoFn[] = [];
      const injectionEnabled = process.env.WENIA_FAILURE_INJECTION === 'enabled';

      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        throw new Error('GITHUB_ERROR: GITHUB_TOKEN environment variable is not set. Add it to .env and restart.');
      }

      const octokit = new Octokit({ auth: githubToken });
      let locationId = '';
      let repoUrl = '';

      try {
        // ── Step 1: create repository ─────────────────────────────────────
        ctx.logger.info(`[wenia:publish] creating repository santiagovj22/${serviceName}`);
        const { data: repo } = await octokit.rest.repos.createForAuthenticatedUser({
          name: serviceName,
          description,
          private: false,
          auto_init: false,
        });
        repoUrl = repo.html_url;

        undoStack.push(async () => {
          ctx.logger.info(`[wenia:publish] compensation: deleting repo ${repoUrl}`);
          try {
            await octokit.rest.repos.delete({ owner: 'santiagovj22', repo: serviceName });
          } catch (e: any) {
            if ((e as any).status !== 404) throw new Error(`Could not delete ${repoUrl}: ${e.message}`);
          }
        });

        if (failureInjection === 'after-repo-create' && injectionEnabled) {
          throw new Error('INJECTED_FAILURE: failure injected after repository creation');
        }

        // ── Step 2: push workspace content ───────────────────────────────
        ctx.logger.info(`[wenia:publish] pushing content to ${repo.clone_url}`);
        await initRepoAndPush({
          dir: ctx.workspacePath,
          remoteUrl: repo.clone_url,
          defaultBranch: 'main',
          auth: { username: 'x-access-token', password: githubToken },
          logger: ctx.logger,
          commitMessage: `feat: create ${serviceName} via Wenia IDP (template@${templateVersion})`,
          gitAuthorInfo: { name: 'Wenia IDP', email: 'idp@wenia.local' },
        });

        // ── Step 3: register in catalog (last step — AD-2) ───────────────
        if (failureInjection === 'at-register' && injectionEnabled) {
          throw new Error('INJECTED_FAILURE: failure injected at catalog registration');
        }

        ctx.logger.info(`[wenia:publish] registering entity in catalog`);
        const catalogInfoUrl = `https://raw.githubusercontent.com/santiagovj22/${serviceName}/main/catalog-info.yaml`;
        const token = await getToken();
        const { location } = await catalogClient.addLocation(
          { type: 'url', target: catalogInfoUrl },
          token ? { token } : undefined,
        );
        locationId = location.id;

        undoStack.push(async () => {
          ctx.logger.info(`[wenia:publish] compensation: removing catalog location ${locationId}`);
          try {
            await catalogClient.removeLocationById(locationId, token ? { token } : undefined);
          } catch (e: any) {
            throw new Error(`Could not remove catalog location ${locationId}: ${e.message}`);
          }
        });

        // ── Success ───────────────────────────────────────────────────────
        const entityRef = `component:default/${serviceName}`;
        appendRunRecord({
          runId, serviceName, outcome: 'succeeded',
          durationMs: Date.now() - startMs,
          templateVersion, ts: new Date().toISOString(),
        });

        ctx.output('repoUrl', repoUrl);
        ctx.output('entityRef', entityRef);
        ctx.logger.info(`[wenia:publish] success — repo: ${repoUrl}, entity: ${entityRef}`);

      } catch (err: any) {
        ctx.logger.error(`[wenia:publish] run failed: ${err.message}; running compensation`);
        const leftovers = await runCompensation(undoStack, ctx.logger);

        appendRunRecord({
          runId, serviceName, outcome: 'failed',
          step: err.message.split(':')[0],
          reasonCode: err.message.startsWith('INJECTED_FAILURE') ? 'INJECTED_FAILURE' : 'GITHUB_ERROR',
          durationMs: Date.now() - startMs,
          templateVersion, ts: new Date().toISOString(),
        });

        if (leftovers.length > 0) {
          throw new Error(
            `COMPENSATION_FAILED: run failed (${err.message}) and cleanup left orphan resources:\n` +
            leftovers.map((l: string) => `  - ${l}`).join('\n') +
            `\nDelete them manually and retry.`,
          );
        }
        throw err;
      }
    },
  });
}
