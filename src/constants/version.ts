/**
 * App Version
 *
 * Imports version from package.json for display in the UI.
 * This ensures the displayed version always matches the package version.
 */

import packageJson from '../../package.json';

export const APP_VERSION = packageJson.version;
