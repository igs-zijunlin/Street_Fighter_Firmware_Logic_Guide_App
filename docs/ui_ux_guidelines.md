# HADOUKEN IO - Web App UI/UX Design System & Architectural Guidelines

本文檔旨在記錄本專案 (`tool_韌體邏輯web工具/web_app`) 的 UI/UX 設計風格、前端架構選擇以及樣式規範。未來在建立新的說明頁面或擴充功能時，可將此文件提供給 AI 助手作為開發指南，以確保視覺與操作體驗的一致性。

---

## 1. 核心技術選型 (Tech Stack)

*   **框架**: React 19 + TypeScript
*   **建置工具**: Vite 7
*   **路由**: `react-router-dom` (使用 `<HashRouter>` 以便於部署成純靜態檔)
*   **樣式引擎**: Tailwind CSS v4 (透過 `@tailwindcss/vite` 整合)
*   **圖示庫**: `lucide-react`
*   **圖表套件**: `mermaid` (用於繪製系統狀態機、流程圖)
*   **部署託管**: GitHub Pages 搭配 GitHub Actions 自動建置

---

## 2. 設計語言與視覺風格 (Visual Identity)

本專案定位為「韌體邏輯視覺化與操作模擬工具」，因此整體風格採取**乾淨、現代化、帶有科技感 (Cybernetic) 的儀表板設計**。

### 2.1 主題色彩 (Color Palette)
大量使用 Tailwind 預設調色盤中帶有科技感的冷色系與高對比狀態色：
*   **背景色 (Background)**: `bg-slate-50` (主背景), `bg-white` (卡片/區塊)
*   **文字主色 (Text)**: `text-slate-900` (大標題), `text-slate-600` (次要文字), `text-slate-500` (備註/標籤)
*   **主品牌色 (Primary)**: `blue-600` ~ `cyan-600`
    *   *常用於全域標題的漸層：* `bg-gradient-to-r from-cyan-600 to-blue-700` 或相反。
*   **狀態色 (Status)**:
    *   ✅ 成功/補卡/安全：`emerald-500` ~ `emerald-700`
    *   ⚠️ 警告/馬達作動：`amber-500` ~ `amber-600`
    *   ❌ 錯誤/排廢/危險：`rose-500` ~ `rose-700`, `orange-500`

### 2.2 排版與字體 (Typography)
*   **基礎字型**: 預設系統無襯線體 (`Inter`, `system-ui`)
*   **科技感字型 (自定義)**: 透過 CSS 變數 `--font-cyber` 指定，用於系統標題或重要區塊（如 "HADOUKEN IO" 標誌）。
*   **等寬字型 (Monospace)**: 用於顯示日誌 (Logs)、變數數值、硬體狀態 (`font-mono`)。

### 2.3 視覺元素與微動畫 (Micro-interactions)
*   **邊框與陰影**: 卡片使用薄邊框 (`border-slate-200`) 加上淺陰影 (`shadow-sm`)。懸停時加深陰影 (`hover:shadow-md`) 以產生浮現感。
*   **卡片高亮背景**: 特定狀態卡片會使用超級淡的背景色 (例如 `bg-blue-50`) 配上與之對應的文字與邊框顏色。
*   **圓角 (Border Radius)**: 現代感的大圓角 (`rounded-xl`, `rounded-2xl`)。
*   **閃爍提示 (Pulse)**: 重要的狀態燈號或連線指示使用 Tailwind 的 `animate-pulse`。
*   **光澤掃過動畫 (Shimmer)**: 用於被選取的 Tab 按鈕背景，增添科幻儀表板的感覺（自定義 `animate-[shimmer_2s_infinite]`）。

---

## 3. 佈局與響應式設計 (Layout & Responsive)

整個應用程式採用 **側邊欄 (Sidebar) + 主內容區 (Main Content)** 的經典儀表板佈局。

### 3.1 跨裝置響應式策略 (Mobile-First)
*   **斷點使用**: 依賴 Tailwind 預設斷點，主要以 `md:` (>= 768px) 區分手機與桌面版。
*   **桌面版 (Desktop)**:
    *   側邊欄：固定於左側 (`fixed left-0 w-64`)。
    *   主內容：向右偏移側邊欄寬度 (`ml-64 p-8`)。
*   **手機版 (Mobile)**:
    *   **頂部導航列 (Top Nav)**: 顯示專案名稱與「漢堡選單(Hamburger)」按鈕。
    *   **側邊欄行為 (Slide-over)**: 預設隱藏 (`-translate-x-full`)，點擊漢堡按鈕後向右滑出 (`translate-x-0`) 蓋在畫面上，並於背後加上半透明黑色遮罩 (`bg-slate-900/50 backdrop-blur-sm`)。點選任一連結後自動收合。
    *   **主內容**: 移除左側邊距 (`md:ml-64`，預設為 0)，並透過 `pt-20` 避開頂部導航列的高度。

### 3.2 元件排版原則
*   **按鈕 (Buttons)**: 大尺寸、容易點擊 (`py-3`, `px-4`)。在手機上必須允許折行 (`flex-wrap`) 或使用自適應間距，避免撐開父容器。
*   **網格 (Grid)**: 卡片佈局盡量使用 CSS Grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)，確保在小螢幕上會自動變成單欄堆疊。
*   **圖表容器**: 包含 Mermaid 等無法直接縮放長寬比的圖表時，外層容器務必加上 `overflow-x-auto overflow-y-hidden`，在手機上容許橫向滑動。

---

## 4. 關鍵組件實作參考 (Key Components)

### 4.1 流程圖 (MermaidFlowchart.tsx)
為了美觀的顯示硬體狀態機，封裝了 `MermaidFlowchart` 組件：
*   **非同步渲染**: 處理 `mermaid.render` 的非同步特性，並帶有 Loading 遮罩與雷達旋轉圖示 (`Loader2`)。
*   **主題覆寫**: 透過 `mermaid.initialize` 注入符合淺色主題的自定義變數 (如 `primaryColor: '#ffffff'`，`nodeBorder: '#94a3b8'`)，取代原本醜陋的預設顏色。
*   **防呆設計**: 包含 Try-Catch 機制，若圖表語法錯誤會顯示紅色的錯誤日誌區塊，不會導致整個頁明白畫面。

### 4.2 終端日誌 (LogTerminal.tsx)
用於呈現硬體互動的逐行 Log：
*   外觀模擬終端機 (`bg-slate-900 text-slate-300 font-mono`)。
*   根據 Log 的 `level` 賦予不同顏色（INFO: 白, WARN: 黃, ERROR: 紅, SUCCESS: 綠）。
*   利用 React `useEffect` + `useRef` 確保新訊息出現時，視窗自動捲動到最底部。

---

## 5. 部署與自動化建置 (Deployment & CI/CD)

本專案採用前端純靜態網頁架構，並完全整合至 GitHub 的生態系中進行託管與發布：

*   **網頁託管 (Hosting)**: **GitHub Pages**
    *   由於不依賴任何後端伺服器 (Serverless)，所有功能（包含韌體邏輯視覺化與狀態機模擬）皆在客戶端瀏覽器執行。
    *   為相容 GitHub Pages 的靜態路由限制，專案強制使用 `<HashRouter>`，確保使用者重新整理頁面時不會出現 404 Not Found 錯誤。
*   **持續整合與部署 (CI/CD)**: **GitHub Actions**
    *   已經配置了自動化發布工作流程，開發者不需手動上傳打包檔案。
    *   **觸發條件**: 當更新推送 (Push) 至主分支時。
    *   **運作流程**: GitHub Actions 自動安裝依賴套件 ➡️ 透過 Vite 執行 `npm run build` 打包專案 ➡️ 將產生的 `dist` 目錄內容部屬至 `gh-pages` 分支 ➡️ GitHub Pages 即時更新上線。

---

## 6. 給 AI 的 Prompt 建議 (How to instruct AI using this file)

當你需要 AI 幫你建立新的頁面時，可以在開頭加上這段提示：

> "請基於 `[本文檔路徑]/ui_ux_guidelines.md` 描述的設計規範，幫我新增一個名為 `[PageName].tsx` 的頁面。
> 1. 請使用 Tailwind CSS 依照『科技感儀表板』風格刻板。
> 2. 標題請加上漸層文字，並使用 Lucide React Icons 作為裝飾。
> 3. 確保佈局符合響應式設計（在小螢幕上套用 flex-col 或對應的 Grid 設定）。
> 4. 若有狀態流程說明，請善用 `<MermaidFlowchart>` 組件來渲染。"
