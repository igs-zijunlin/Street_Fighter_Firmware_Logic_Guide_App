# React + TypeScript + Vite

這個模板提供了一個基本的設定，讓 React 可以在 Vite 中運作，並包含了 HMR (即時模組替換) 以及一些 ESLint 規則。

目前提供了兩個官方外掛：

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) 使用 [Babel](https://babeljs.io/) (或在 [rolldown-vite](https://vite.dev/guide/rolldown) 搭配 [oxc](https://oxc.rs)) 來實現快速更新 (Fast Refresh)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) 使用 [SWC](https://swc.rs/) 來實現快速更新 (Fast Refresh)

## React Compiler (React 編譯器)

此模板預設並未啟用 React 編譯器，因為它會影響開發與建置的效能。如需加入此功能，請參閱[此官方文件](https://react.dev/learn/react-compiler/installation)。

## 擴充 ESLint 設定配置

如果您正在開發正式產品層級的應用程式，我們建議您更新設定，啟用具備型別感知 (type-aware) 的檢查規則：

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // 其他設定...

      // 移除 tseslint.configs.recommended 並替換成以下內容
      tseslint.configs.recommendedTypeChecked,
      // 或是使用以下內容套用更嚴格的規則
      tseslint.configs.strictTypeChecked,
      // 另外也可選擇加入以下內容來取得程式碼風格的規則
      tseslint.configs.stylisticTypeChecked,

      // 其他設定...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // 其他選項...
    },
  },
])
```

您也可以安裝 [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) 與 [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) 獲得針對 React 專屬的檢查規則：

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // 其他設定...
      // 啟用 React 的 lint 規則
      reactX.configs['recommended-typescript'],
      // 啟用 React DOM 的 lint 規則
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // 其他選項...
    },
  },
])
```
