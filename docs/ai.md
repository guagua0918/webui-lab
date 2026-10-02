# W01
## 1. 本週 Project Goal
建立前端專案骨架，學會用 Git 記錄修改並推到 GitHub

## 2. 本週完成
- 確認 node / npm / git 可用，建立 `webui-lab` 專案
- 先寫 `.gitignore`，再建立 `README.md`、`index.html`
- 完成第一次 commit，並 push 到 GitHub

## 3. 問 AI 的三個重要問題
- 為什麼要先寫 `.gitignore`：學到檔案一旦進 Git 歷史很難清乾淨
- Git 身分是什麼：學到 name/email 是commit署名，不是登入密碼
- `commit`和`push`差在哪：學到本機歷史與 GitHub 雲端備份是兩步

### Q1
- Prompt:
為何專案一開始就要先寫gitignore？如果先安裝套件或先commit，再補ignore，會有什麼後果？

- AI 建議摘要:
`.gitignore` 只忽略「尚未被追蹤」的檔案。`node_modules/`、`.env` 一旦被 commit，之後即使加進 ignore，舊歷史裡通常仍留著，repo 會變大，也有泄露密鑰風險。

- 我驗證的方法:
用 `git status` 確認這些路徑不會被列成待提交檔案。

- 最後我採用 / 修改 / 拒絕了什麼:
採用先 ignore、再開始做專案的順序。

### Q2
- Prompt:
同一個Gmail可以搭配不同git身分名稱嗎？

- AI 建議摘要:
這是寫進每個 commit 的署名（Author）。`--global` 綁的是這台電腦上的使用者設定。同一個 email 可以換不同 `user.name`。

- 我驗證的方法:
執行 `git config --global --list`，再用 `git log -1 --format=full` 看最近一次 commit 的 Author 是否為自己設的名字與 email。

- 最後我採用 / 修改 / 拒絕了什麼:
採用清楚的 name + 自己常用的 email。

### Q3
- Prompt:
commit和push差在哪？為什麼本機 git log看得到，GitHub 網站卻還沒更新？

- AI 建議摘要:
`commit` 只把變更記在本機 Git 歷史；`push` 才送到 GitHub。所以常出現「我明明提交了，網頁還沒變」——其實只是還沒 push。

- 我驗證的方法:
改 README 後先 `git commit`，看 GitHub 是否仍舊；再 `git push`，確認網站更新。並用 `git status` 看是否顯示 ahead of origin。

- 最後我採用 / 修改 / 拒絕了什麼:
採用固定流程：`git status` → `git add` → `git commit` → `git push`；每完成一個可驗證小步驟再提交。

## 4. Web Concept of the Week

這週學的是開發流成:VS Code 負責編輯 → 專案資料夾在本機 → Git 記錄每次修改 → GitHub 做雲端備份與繳交存證。

## 5. Debugging Record

- Problem:

- Error / symptom:

- Root cause:

- How I found it:

- Fix:

## 6. Security Check
- `.env`、密碼、API key 不能 commit，也不該出現在前端程式裡。
- `.gitignore` 從第一天就要排除密鑰與巨大依賴目錄。
- Git 的 name/email 會公開在 commit 歷史中；不要塞入不必要的個資，但 email 需能對應自己的 GitHub 身分。
- Public repo 等同公開程式碼，提交前用 `git status` / `git diff` 再檢查一次。



## 7. Reflection (反思)

算是先建立問問題的方式，即使是算相對簡單的第一課，用拷問自己的方式仍能硬擠出問題來，答不出來是個問題、答得不順是個問題、不能用簡單概念講給別人聽也是個問題(要練習)。

- AI 哪裡講錯、講不清楚或讓我誤判：
確認問題的討論階段就把事情完成，然後事後丟出做了什麼，但他都預設我知道某些東西，讓我很頭痛。

- 如果下次自己做，我會：
先拆成小項目，警告他別這麼快完成，需要我確認完問題:要動那些檔案、為何?才動工。

---
# W02
## 1. 本週 Project Goal
完成足弓評估平台的手機優先靜態前端（多頁 HTML + CSS），並能解釋語意標籤與 class。

## 2. 本週完成
- [x] Project Milestone 確定為足弓評估與矯正平台
- [x] demo頁面
- [x] CSS 拆到 `css/style.css`（相對路徑）

## 3. 問 AI 的三個重要問題（本週一定要會）
- [x] Q1 為何不要整站都用 div／`article` 跟 `class` 差在哪
- [x] Q2 手機優先要做哪些設計
- [x] Q3 為何 CSS 要用相對路徑 `css/style.css`

### Q1
- Prompt: 為什麼不要整個網站都用 div？`article class="card"` 裡哪個是語意、哪個是樣式？
- AI 建議摘要: `article` 表示可獨立理解的內容區塊；`class="card"` 只是給 CSS 用的名字。語意與外觀要分開。
- 我驗證的方法: 對照自己的 `index.html` 與 `style.css` 的 `.card`。
- 最後採用: 結構用語意標籤，樣式用 class。

### Q2
- Prompt: 手機優先要做什麼？跟桌面先做好再縮小有何不同？
- AI 建議摘要: 先假設窄螢幕與單手操作：viewport、單欄、大按鈕、底欄、內容區避開固定導覽。
- 我驗證的方法: 用瀏覽器手機寬度查看總覽與底欄是否好點、會不會被擋住。
- 最後採用: 多頁一任務 + 底部 nav + 全寬主按鈕。

### Q3
- Prompt: 為什麼 link 要用 `css/style.css` 而不是 `/css/style.css`？
- AI 建議摘要: 絕對路徑 `/css/...` 在 IIS 子路徑（學號目錄）會指到網站根目錄而 404；相對路徑跟著目前頁面走。
- 我驗證的方法: 看 Network 裡 CSS 是否 200；對照講義 IIS 常見問題。
- 最後採用: 全部相對路徑引用 CSS。

## 4. Web Concept of the Week
HTML 管結構與語意，CSS 管外觀。

## 5. Debugging Record
- Problem: 
- Fix: 

## 6. Security Check
- 足部影像屬健康相關資料，不隨意公開或 commit
- 頁面有免責：不能取代醫療診斷
- 前端不放密碼／API key

## 7. Reflection (反思)
本週必備觀念：語意 HTML、`class` 只負責樣式、手機優先、相對路徑。
- 如果下次自己做，我會: 先定資訊架構（幾頁、導覽），再寫 HTML，最後才調 CSS。

---
# W04
## 1. 本週 Project Goal
足印掃描可以選照片、在圖上點四點，而且大圖在電腦寬螢幕也不會跑出欄外。

## 2. 本週完成
- [x] `scan.html` 上傳後在瀏覽器顯示，並在照片上點四點
- [x] `css/style.css` 把照片限制在中間那欄

## 3. 問 AI 的三個重要問題（本週一定要會）
- [x] Q1 上傳怎麼發生
- [x] Q2 點的是照片還是上面那層
- [x] Q3 Chrome 和 Cursor 畫面為何不同

### Q1
- Prompt: 上傳怎麼發生？照片有沒有送到後端？
- AI 建議摘要: 沒有送到後端，只留在瀏覽器。選到檔之後用 `URL.createObjectURL` 做出暫時網址，再交給 `<img>`。選檔的 `<input type="file">` 用 `display: none` 藏起來，虛線框用 `label` 去打開它。
- 我驗證的方法: 選一張圖，看 Network 沒有把照片 POST 出去，頁面上還是看得到圖。
- 最後採用: 先不開 API，點選和算比值都在前端做。

### Q2
- Prompt: 使用者點下去的是 `<img>` 本身嗎？
- AI 建議摘要: 點的是蓋在照片上面那層 SVG，不是照片本身。點的位置要換算成原圖像素再存，縮小顯示時線才對得準。
- 我驗證的方法: 對照 `scan.html` 裡的 `#overlay`，以及 `style.css` 裡 SVG `position: absolute` 蓋滿圖片。
- 最後採用: 點 SVG，線也畫在 SVG 上。

### Q3
- Prompt: Chrome 和 Cursor 內建瀏覽器畫面不一樣，是瀏覽器不同嗎？
- AI 建議摘要: 不是瀏覽器不同。Chrome 開的是學校網址，Cursor 開的是本機 `127.0.0.1`。學校那邊當時還在吃舊的 CSS，所以「選擇檔案」還在、圖也撐出去。
- 我驗證的方法: 對網址。本機那頁正常；學校那頁強制重新整理後才跟上。
- 最後採用: 改完用 Ctrl+Shift+R，不要只看舊畫面。

## 4. Web Concept of the Week
照片要限制在容器裡：`.app` 用 `max-width: 28rem` 收成一欄，`.content` 加 `min-width: 0`，圖片 `width: 100%`、`height: auto`。

## 5. Debugging Record
- Problem: 電腦版圖片邊邊超出白欄，選圖框在圖出來後還在。
- Error / symptom: 照片以原始寬度往右撐出；「選擇檔案」還疊在畫面上。
- Root cause: flex 子元素預設不會比內容更窄，大圖就把欄撐破。檔案輸入沒有 `display: none`。
- How I found it: 本機改完正常，學校網頁仍舊，對過 CSS 才發現 Chrome 快取舊檔。
- Fix: `min-width: 0`、圖片 `max-width: 100%`，選圖框在有圖之後藏起來。

## 6. Security Check
- 足印照片這週只留在瀏覽器，沒有上傳、也沒有進資料庫。
- 頁面仍僅供居家參考，不能取代醫療診斷。

## 7. Reflection (反思)
大圖會把欄位撐破，要先把寬度限制在容器裡。兩個畫面不一樣時，先看網址和 CSS 有沒有更新，不要先怪瀏覽器。
- 如果下次自己做，我會: 先問要動哪些檔、為何，確認完再改。

---
