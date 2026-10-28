/**
 * Inline Backstage backend module for the Wenia IDP scaffolder actions.
 * Lives directly in packages/backend to avoid workspace/lockfile complications
 * in the PoC. In production this would be a separate package.
 */
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node';
import { CatalogClient } from '@backstage/catalog-client';
import { createPreflightAction } from './actions/preflight';
import { createPublishAction } from './actions/publish';

const scaffolderWeniaModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'wenia',
  register(reg) {
    reg.registerInit({
      deps: {
        scaffolderActions: scaffolderActionsExtensionPoint,
        logger: coreServices.logger,
        auth: coreServices.auth,
        discovery: coreServices.discovery,
      },
      async init({ scaffolderActions, logger, auth, discovery }) {
        logger.info('[wenia-module] registering wenia:preflight and wenia:publish');

        const catalogClient = new CatalogClient({ discoveryApi: discovery });

        const getToken = async () => {
          try {
            const credentials = await auth.getOwnServiceCredentials();
            const { token } = await auth.getPluginRequestToken({
              onBehalfOf: credentials,
              targetPluginId: 'catalog',
            });
            return token;
          } catch {
            return undefined;
          }
        };

        scaffolderActions.addActions(
          createPreflightAction({ catalogClient, getToken }),
          createPublishAction({ catalogClient, getToken }),
        );

        logger.info('[wenia-module] wenia:preflight and wenia:publish registered');
      },
    });
  },
});

export default scaffolderWeniaModule;
