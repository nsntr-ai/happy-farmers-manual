const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx'
})
module.exports = withNextra({
  output: 'export',
  basePath: '/happy-farmers-manual',
  assetPrefix: '/happy-farmers-manual/',
  images: {
    unoptimized: true
  }
})
