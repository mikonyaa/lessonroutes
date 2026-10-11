import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config(js.configs.recommended, ...ts.configs.recommended, {
  languageOptions: { globals: {
    document:'readonly',window:'readonly',Image:'readonly',URL:'readonly',Blob:'readonly',
    File:'readonly',FileReader:'readonly',crypto:'readonly',indexedDB:'readonly',
    IDBDatabase:'readonly',IDBTransaction:'readonly',IDBRequest:'readonly',DOMException:'readonly',
    HTMLElement:'readonly',HTMLInputElement:'readonly',HTMLButtonElement:'readonly',
    HTMLImageElement:'readonly',PointerEvent:'readonly',KeyboardEvent:'readonly',
    ResizeObserver:'readonly',Node:'readonly',Event:'readonly',BeforeUnloadEvent:'readonly',
    atob:'readonly',btoa:'readonly',setTimeout:'readonly',clearTimeout:'readonly',
    console:'readonly',process:'readonly',Buffer:'readonly',TextEncoder:'readonly',requestAnimationFrame:'readonly',
    Uint8Array:'readonly',fetch:'readonly',navigator:'readonly',location:'readonly',structuredClone:'readonly',LessonExporter:'readonly',
  } },
  rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
});
