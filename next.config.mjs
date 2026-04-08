import nextra from 'nextra';

const withNextra = nextra({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx'
});

export default withNextra({
  output: 'export',
  basePath: '/happy-farmers-manual',
  assetPrefix: '/happy-farmers-manual/',
  images: {
    unoptimized: true
  },
  trailingSlash: true
});
