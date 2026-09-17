# Web Programming — Project-Based Learning with AI Coding

> **課程定位**：大學資訊工程學系 Web Programming  
> **授課週數**：16 Weeks  
> **評量方式**：100% Project-based  
> **主要技術**：HTML5、CSS3、JavaScript (ES6+)，後段少量 React  
> **開發環境**：VS Code + Git + GitHub + GitHub Copilot  
> **核心教學方法**：前 12 週以 AI coding「做中學」完成個人 Project；後 4 週進入整合、資安檢查、測試、展示與技術答辯  
> **課程原則**：AI 可以協助寫程式，但學生必須能解釋、驗證、修改、除錯與承擔程式碼品質。
> **讓 AI 輔助你【學會了】，不是讓 AI 幫你【學廢了】。**

---

# 0. 課程學習目標

完成本課程後，學生應能 (但不限於此)：

1. 使用 HTML5 建立語意正確、結構清楚的 Web Page。
2. 使用 CSS3 完成 Responsive Web Design。
3. 使用 JavaScript 操作 DOM、事件、資料、非同步流程與 Web API。
4. 理解 Browser、Web Server、HTTP Request/Response、DNS、HTTPS 等 Web 運作基礎。
5. 使用 `fetch()` 呼叫 REST API，理解 JSON、status code、CORS。
6. 理解 Cookie、Session、JWT、localStorage 等登入與狀態管理方式的差異及風險。
7. 具備基本 Web Security 意識，包括：
   - XSS
   - CSRF
   - CORS misconfiguration
   - authentication / authorization
   - secret / API key handling
   - input validation
   - HTTPS
8. 使用 Git / GitHub 管理個人專案版本。
9. 在 VS Code 中使用 GitHub Copilot Chat / Agent 協助：
   - 分析需求：討論清楚專案需求與規格
   - 規畫實作：詢問實作流程與建議UI模組
   - 解釋程式：盡量comments說清楚
   - 除錯：寫心得的好機會
   - refactor（重構）：讓程式碼變得更乾淨、更容易維護、更有效率，但使用者看到的功能不變。
   - 撰寫測試
   - security review
10. 能辨識 AI coding 的錯誤與 hallucination，不把「AI 有產生答案」視為「程式正確」。
11. 能以自己的語言說明專案架構、關鍵程式碼、Web 原理與資安設計。
12. 完成一個可展示、可執行、有 Git history、有技術文件的個人 Web Project。

---

# 1. AI Coding 學習原則

本課程的 AI coding 目標不是「讓 AI 幫你把 Project 寫完」，而是：

> **Ask → Understand → Implement → Test → Explain → Commit**

學生每次使用 AI，至少要做到以下其中數項：

- 請 AI 解釋自己不懂的概念。
- 請 AI 先提出 implementation plan，而不是直接產生整個 Project。
- 要求 AI 將工作拆成小步驟。
- 要求 AI 解釋修改了哪些檔案、為什麼。
- 自己執行程式並觀察結果。
- 看懂 error message 後再請 AI 協助。
- 比較 AI 建議、自己理解與老師上課教材。
- 要求 AI 找 security risk。
- 修改 AI 產生的程式，使自己能說明。
- 每完成一個可驗證的小功能才 commit。

## AI 使用紅線

以下行為不能作為合格的 Project 學習成果：

- 一次要求 AI「幫我完成整個網站」後直接繳交。
- 無法解釋自己 repository 中的主要程式碼。
- 不知道 AI 修改了哪些檔案。
- AI 產生的程式沒有執行或測試。
- 把 API key、password、token commit 到 GitHub。
- 明知有 security warning 仍直接忽略。
- Git history 只有期末一次大量 commit。
- Demo 時只能說「這是 Copilot 幫我寫的」。

教師可在任何一週抽問 repository 中任一段關鍵程式碼。

---

# 2. 成績：100% Project

配分如PPT說明。

## 重要評分規則

**Project = 人設**，也就是上課老師的互動驗證過程，不要毀了你的人設。「功能很多」不等於高分。

評分同時看：

- Correctness
- HTML/CSS/JS 基礎能力
- Web concepts
- Code readability
- Git discipline
- Debugging evidence
- Security awareness
- AI literacy
- Technical explanation

若學生無法解釋自己 Project 的核心功能，即使程式可執行，仍不能取得高分。

---

# 3. Repository 建議結構

每位學生建立一個 GitHub repository，例如：

```text
web-project/
│
├─ README.md
├─ index.html
├─ css/
│  └─ style.css
├─ js/
│  └─ app.js
├─ assets/
│  ├─ images/
│  └─ icons/
│
├─ docs/
│  ├─ proposal.md
│  ├─ architecture.md
│  ├─ security.md
│  └─ final-report.md
│
├─ .github/
│  └─ copilot-instructions.md
│
└─ .gitignore
```

若後續加入 Node.js：

```text
web-project/
├─ client/
├─ server/
├─ docs/
├─ .github/
├─ README.md
└─ .gitignore
```

若選擇 React，可改為：

```text
web-project/
├─ src/
├─ public/
├─ docs/
├─ .github/
├─ package.json
└─ README.md
```

---

# 4. 每週固定學習流程

從 W01 到 W12，學生每週都遵循：

```text
1. Pull / Sync repository
      ↓
2. 建立本週目標
      ↓
3. Ask AI：先解釋概念
      ↓
4. Ask AI：提出小步驟 implementation plan
      ↓
5. 自己 + AI pair programming
      ↓
6. 在 Browser / DevTools 中測試
      ↓
7. Ask AI：review / debugging / security check
      ↓
8. 自己確認 diff
      ↓
9. Commit
      ↓
10. Push to GitHub
      ↓
11. 加入學習心得於 web.md and ai.md
```

推薦 commit message：

```bash
git commit -m "feat: add project landing page"
git commit -m "style: add responsive navigation"
git commit -m "feat: add form validation"
git commit -m "fix: handle failed API request"
git commit -m "security: sanitize user generated content"
git commit -m "docs: add week 8 learning notes"
```

---

# 5. 每週學習心得

自行歸類，每週補充建立：web.md and ai.md

內容範例：

```markdown
# W02 Learning Log

## 1. 本週 Project Goal
我本週希望完成什麼？

## 2. 本週完成
- [x] item1
- [] item2
- [] item3

## 3. 問 AI 的三個重要問題
- [x] Q1 ...：學到 ...
- [] item2
- [] item3

### Q1
Prompt:

AI 建議摘要:

我原本不知道什麼:

我驗證的方法:

最後我採用 / 修改 / 拒絕了什麼:

### Q2
...

### Q3
...

## 4. Web Concept of the Week
用自己的話解釋本週概念。

## 5. Debugging Record
Problem:

Error / symptom:

Root cause:

How I found it:

Fix:

## 6. Security Check
本週功能有哪些 security / privacy risk？

## 7. Reflection (反思)
這週 AI 最有幫助的地方：

AI 哪裡講錯、講不清楚或讓我誤判：

如果下次自己做，我會：
```

---

# 6. GitHub Copilot Project Instructions

目前 VS Code / GitHub Copilot 支援 repository-wide instructions。建議在：

```text
.github/copilot-instructions.md
```

加入下列教學版規則：

```markdown
# Web Programming Course — Copilot Instructions

You are acting as a programming tutor and pair programmer.

## Course goals

The student is learning:
- HTML5
- CSS3
- JavaScript
- browser APIs
- HTTP and REST APIs
- basic web security
- optionally basic React

## Teaching rules

1. Do not implement the entire project at once.
2. Break tasks into small, testable steps.
3. Before writing code, explain the idea and affected files.
4. Prefer HTML/CSS/vanilla JavaScript unless React is explicitly requested.
5. Use semantic HTML.
6. Explain unfamiliar JavaScript syntax.
7. Do not hide errors with unnecessary try/catch.
8. When debugging, explain the likely root cause before changing code.
9. After implementation, tell the student how to test the feature.
10. Point out security and privacy risks.
11. Never place secrets, API keys, passwords, or tokens in client-side source code.
12. Ask the student to inspect changes before committing.
13. Prefer official standards and documentation when uncertain.
14. Keep code simple enough for a Web Programming student to explain.
15. When generating code, add comments only where they improve understanding.

## Security

Always consider:
- XSS
- CSRF
- CORS
- authentication vs authorization
- input validation
- HTTPS
- secret handling
- dependency risk

## Completion

A task is not complete until:
- the code runs,
- the student knows how it works,
- basic failure cases are tested,
- security implications are discussed.
```

Repository-level custom instructions可讓Copilot在該repository的互動持續取得專案規範；VS Code亦支援`AGENTS.md`及path-specific instruction files。課程初期只使用`.github/copilot-instructions.md`，避免工具複雜度蓋過Web基礎。

---

# 7. Git / GitHub 工作流程規範
- **每週至少 3 次 commit**，commit message 格式：`W<週次>: <這次做了什麼>`（例：`W05: add fetch API for weather data`）。
- 週五（或課程指定截止日）前必須 push 到 GitHub，作為該週進度存證。
- 建議每週開一個 branch（`w05-fetch-api`），功能穩定後再 merge 回 `main`，養成正式專案的分支習慣。
- `.gitignore` 從 W01 就要設定好（至少排除 `node_modules/`、`.env`）。
- **不要把任何 API key、密碼 commit 進 repo**——這是 W09（JWT）與 W13（Secrets 管理）會正式教的資安概念，但從 W01 就要開始養成習慣。

---

> **AI Coding Scaffold = W01–W12，共12週。**  
> W13之後仍可使用AI，但教師不再提供逐步prompt；學生必須自行決定何時、為何使用AI。

---
