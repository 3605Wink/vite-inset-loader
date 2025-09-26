import { Logger } from 'tslog';

export const logger = new Logger({
  name: 'vite-plugin-uniapp-injector',
  minLevel: process.env.NODE_ENV === 'production' ? 3 : 1,
  type: 'pretty',
  hideLogPositionForProduction: true,
  prettyLogTimeZone: 'local',
  prettyLogTemplate: '{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}\t{{logLevelName}}\t',
});
