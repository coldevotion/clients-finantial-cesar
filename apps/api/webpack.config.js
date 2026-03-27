const path = require('path');

/**
 * Custom webpack config for NestJS in pnpm monorepo.
 * Workspace packages (@wa/*) are bundled inline so their
 * TypeScript source is included — no need to compile them separately.
 */
module.exports = (options, _webpack) => {
  // Keep only the externals that are NOT workspace packages
  const baseExternals = (options.externals ?? []).map((external) => {
    if (typeof external !== 'function') return external;

    return function (ctx, callback) {
      const request = ctx.request ?? ctx;
      // Bundle workspace packages instead of requiring them at runtime
      if (typeof request === 'string' && request.startsWith('@wa/')) {
        return callback(); // not external → bundled
      }
      return external(ctx, callback);
    };
  });

  return {
    ...options,
    externals: baseExternals,
    resolve: {
      ...options.resolve,
      // Allow webpack to find modules hoisted by pnpm
      modules: [
        'node_modules',
        path.resolve(__dirname, '../../node_modules'),
      ],
      // Follow pnpm symlinks correctly
      symlinks: true,
    },
  };
};
