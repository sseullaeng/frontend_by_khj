module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // 절대 금지: console.log 커밋 방지
    'no-console': ['error', { allow: ['warn', 'error'] }],
    // 절대 금지: any 타입 사용 경고
    '@typescript-eslint/no-explicit-any': 'warn',
  },
}
