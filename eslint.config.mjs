import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**'] },
  js.configs.recommended,
  /* Fichiers de l'application : scripts classiques, environnement navigateur.
     Les fonctions « non utilisées » selon ESLint sont appelées depuis les
     gestionnaires onclick du HTML : on garde cela en simple avertissement. */
  {
    files: ['app.js', 'calc.js', 'lang.js', 'sw.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser, module: 'writable', SWCalc: 'readonly' },
    },
    rules: {
      /* catch vides : choix défensif de l'auteur (localStorage indisponible) */
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }],
    },
  },
  /* Tests et fichiers de configuration : modules Node */
  {
    files: ['tests/**', '*.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node } },
  },
];
