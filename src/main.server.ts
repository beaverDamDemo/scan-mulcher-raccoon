import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';

import { config } from './app/app.config.server';
import { AppShell } from './app/app-shell';

const bootstrap = (context: BootstrapContext) =>
    bootstrapApplication(AppShell, config, context);

export default bootstrap;
