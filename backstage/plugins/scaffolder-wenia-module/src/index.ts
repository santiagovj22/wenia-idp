/**
 * Backstage backend module: wenia:preflight and wenia:publish.
 * Registered via createBackendModule (new backend system).
 */
import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node';
import { CatalogClient } from '@backstage/catalog-client';
import { createPreflightAction } from './actions/preflight';
import { createPublishAction } from './actions/publish';

export const scaffolderWeniaModule = createBackendModule({
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

        /** Get a service token for calling the catalog on behalf of this backend */
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

        logger.info('[wenia-module] actions registered successfully');
      },
    });
  },
});

export default scaffolderWeniaModule;
