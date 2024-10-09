const prettierConfig = {
  bracketSpacing: true,
  endOfLine: 'auto',
  printWidth: 120,
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  plugins: ['prettier-plugin-embed', 'prettier-plugin-sql'],
};

/** @type {import('prettier-plugin-embed').PrettierPluginEmbedOptions} */
const prettierPluginEmbedConfig = {
  embeddedSqlTags: ['prisma.$queryRaw', 'Prisma.sql'],
};

/** @type {import('prettier-plugin-sql').SqlBaseOptions} */
const prettierPluginSqlConfig = {
  language: 'postgresql',
  keywordCase: 'upper',
};

const config = {
  ...prettierConfig,
  ...prettierPluginEmbedConfig,
  ...prettierPluginSqlConfig,
};

export default config;
