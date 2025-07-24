/** @type {import('prettier').Config} */
module.exports = {
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 80,
  useTabs: false,
  quoteProps: 'as-needed',
  arrowParens: 'avoid',
  endOfLine: 'lf',
  bracketSpacing: true,
  bracketSameLine: false,
  
  // Tailwind CSS plugin
  plugins: ['prettier-plugin-tailwindcss'],
  
  // Override for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 200,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 100,
        proseWrap: 'always',
      },
    },
  ],
}