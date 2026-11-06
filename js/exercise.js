(function () {
  const CATALOG_NAME = "運動分類";

  const lead = document.getElementById("exercise-lead");
  const form = document.getElementById("search-form");
  const qInput = document.getElementById("search-q");
  const suggestList = document.getElementById("suggest-list");
  const filterGrid = document.getElementById("filter-grid");
  const resultCount = document.getElementById("result-count");
  const exerciseList = document.getElementById("exercise-list");
  const viewSearch = document.getElementById("view-search");
  const viewDetail = document.getElementById("view-detail");
  const resetBtn = document.getElementById("search-reset");

  /** @type {{ cid: number, name: string }} */
  let catalog = null;
  /** @type {Array<{ group: string, label: string, options: Array<{ cid: number, code: string, name: string }> }>} */
  let filterGroups = [];
  /** @type {Array<{ oid: number, title: string, des: string, class: string }>} */
  let allItems = [];
  let suggestTimer = null;
  let activeSuggest = -1;
  let suggestions = [];

  function doseLine(item) {
    const bits = [];
    if (item.sets != null) bits.push(item.sets + " 組");
    if (item.reps != null) bits.push(item.reps + " 次");
    if (item.hold_seconds != null) bits.push("維持 " + item.hold_seconds + " 秒");
    if (item.frequency) bits.push(item.frequency);
    return bits.join(" · ");
  }

  function youtubeId(url) {
    if (!url) return null;
    const text = String(url).trim();
    const short = text.match(/youtu\.be\/([A-Za-z0-9_-]{6,})/);
    if (short) return short[1];
    const watch = text.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
    if (watch) return watch[1];
    const embed = text.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{6,})/);
    if (embed) return embed[1];
    return null;
  }

  /** youtu.be / watch?v= → embed URL；其他連結原樣當 src */
  function youtubeEmbedSrc(url) {
    const id = youtubeId(url);
    if (id) return "https://www.youtube.com/embed/" + id;
    if (url && /^https?:\/\//i.test(String(url).trim())) return String(url).trim();
    return null;
  }

  function thumbSrc(item) {
    if (item.picture) return item.picture;
    const id = youtubeId(item.video_path);
    if (id) return "https://img.youtube.com/vi/" + id + "/hqdefault.jpg";
    return null;
  }

  function truncate(text, max) {
    const s = (text || "").trim();
    if (s.length <= max) return s;
    return s.slice(0, max - 1) + "…";
  }

  async function api(path) {
    const response = await fetch(path, { credentials: "same-origin" });
    if (response.status === 401) throw new Error("請先登入");
    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.json();
  }

  function showSearch() {
    viewDetail.hidden = true;
    viewDetail.replaceChildren();
    viewSearch.hidden = false;
    lead.textContent = "關鍵字搜尋，再用目錄條件篩選";
  }

  function selectedCids() {
    const cids = [];
    filterGroups.forEach(function (group) {
      const el = document.getElementById("filter-" + group.group);
      if (!el || !el.value) return;
      const cid = Number(el.value);
      if (cid) cids.push(cid);
    });
    return cids;
  }

  function hideSuggest() {
    suggestList.hidden = true;
    suggestList.replaceChildren();
    qInput.setAttribute("aria-expanded", "false");
    activeSuggest = -1;
    suggestions = [];
  }

  function categorySuggestPool() {
    const pool = [];
    filterGroups.forEach(function (group) {
      group.options.forEach(function (opt) {
        pool.push({
          kind: "category",
          label: opt.name,
          value: opt.name,
          cid: opt.cid,
          group: group.group,
        });
      });
    });
    return pool;
  }

  function buildSuggest(q) {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    const out = [];
    allItems.forEach(function (item) {
      const title = (item.title || "").toLowerCase();
      const des = (item.des || "").toLowerCase();
      if (title.indexOf(needle) >= 0 || des.indexOf(needle) >= 0) {
        out.push({
          kind: "title",
          label: item.title,
          value: item.title,
          oid: item.oid,
        });
      }
    });
    categorySuggestPool().forEach(function (item) {
      if ((item.label || "").toLowerCase().indexOf(needle) >= 0) {
        out.push(item);
      }
    });
    return out.slice(0, 8);
  }

  function renderSuggest(items) {
    suggestions = items;
    activeSuggest = -1;
    suggestList.replaceChildren();
    if (!items.length) {
      hideSuggest();
      return;
    }
    items.forEach(function (item, index) {
      const li = document.createElement("li");
      li.id = "suggest-" + index;
      li.className = "suggest-item";
      li.setAttribute("role", "option");
      const kind = document.createElement("span");
      kind.className = "suggest-kind";
      kind.textContent = item.kind === "category" ? "目錄" : "動作";
      const label = document.createElement("span");
      label.textContent = item.label;
      li.append(kind, label);
      li.addEventListener("mousedown", function (event) {
        event.preventDefault();
        applySuggest(item);
      });
      suggestList.append(li);
    });
    suggestList.hidden = false;
    qInput.setAttribute("aria-expanded", "true");
  }

  function highlightSuggest(index) {
    activeSuggest = index;
    Array.from(suggestList.children).forEach(function (li, i) {
      li.classList.toggle("is-active", i === index);
    });
  }

  function applySuggest(item) {
    hideSuggest();
    if (item.kind === "title") {
      qInput.value = item.value;
      if (item.oid != null) {
        openDetail(item.oid);
        return;
      }
    } else if (item.kind === "category") {
      qInput.value = "";
      const el = document.getElementById("filter-" + item.group);
      if (el) el.value = String(item.cid);
    } else {
      qInput.value = item.value;
    }
    runSearch();
  }

  function renderFilters(groups) {
    filterGrid.replaceChildren();
    filterGroups = groups;
    groups.forEach(function (group) {
      const label = document.createElement("label");
      label.className = "field-label";
      label.htmlFor = "filter-" + group.group;
      label.textContent = group.label;

      const select = document.createElement("select");
      select.id = "filter-" + group.group;
      select.name = group.group;
      select.className = "field-select";

      const any = document.createElement("option");
      any.value = "";
      any.textContent = "不限";
      select.append(any);

      group.options.forEach(function (opt) {
        const option = document.createElement("option");
        option.value = String(opt.cid);
        option.textContent = opt.name;
        select.append(option);
      });

      select.addEventListener("change", function () {
        runSearch();
      });

      const wrap = document.createElement("div");
      wrap.className = "filter-field";
      wrap.append(label, select);
      filterGrid.append(wrap);
    });
  }

  function renderResults(items) {
    exerciseList.replaceChildren();
    resultCount.hidden = false;
    resultCount.textContent = "共 " + items.length + " 個動作";

    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "muted";
      empty.textContent = "沒有符合條件的動作，試試放寬篩選或換關鍵字。";
      exerciseList.append(empty);
      return;
    }

    items.forEach(function (item) {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "ex-item";

      const thumb = document.createElement("div");
      thumb.className = "ex-thumb";
      const src = thumbSrc(item);
      if (src) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        thumb.append(img);
        if (youtubeId(item.video_path)) {
          const play = document.createElement("span");
          play.className = "ex-thumb-play";
          play.setAttribute("aria-hidden", "true");
          thumb.append(play);
        }
      } else {
        thumb.classList.add("is-placeholder");
        thumb.textContent = (item.title || "?").slice(0, 1);
      }

      const body = document.createElement("div");
      body.className = "ex-item-body";
      const title = document.createElement("strong");
      title.textContent = item.title || ("#" + item.oid);
      const purpose = document.createElement("p");
      purpose.className = "muted";
      purpose.textContent = truncate(item.des, 56);
      body.append(title, purpose);

      card.append(thumb, body);
      card.addEventListener("click", function () {
        openDetail(item.oid);
      });
      exerciseList.append(card);
    });
  }

  function intersectByOid(lists) {
    if (!lists.length) return [];
    let map = new Map();
    lists[0].forEach(function (item) {
      map.set(item.oid, item);
    });
    for (let i = 1; i < lists.length; i += 1) {
      const next = new Set(lists[i].map(function (item) {
        return item.oid;
      }));
      map = new Map(
        Array.from(map.entries()).filter(function (entry) {
          return next.has(entry[0]);
        })
      );
    }
    return Array.from(map.values());
  }

  function filterByKeyword(items, q) {
    const needle = (q || "").trim().toLowerCase();
    if (!needle) return items;
    return items.filter(function (item) {
      const title = (item.title || "").toLowerCase();
      const des = (item.des || "").toLowerCase();
      return title.indexOf(needle) >= 0 || des.indexOf(needle) >= 0;
    });
  }

  async function runSearch() {
    hideSuggest();
    showSearch();
    try {
      const cids = selectedCids();
      let items;
      if (!cids.length) {
        items = allItems.slice();
      } else {
        const lists = await Promise.all(
          cids.map(function (cid) {
            return api("api/objectlist/cid/" + cid);
          })
        );
        items = intersectByOid(lists);
      }
      items = filterByKeyword(items, qInput.value);
      items.sort(function (a, b) {
        return a.oid - b.oid;
      });
      renderResults(items);
    } catch (error) {
      resultCount.hidden = true;
      exerciseList.replaceChildren();
      const err = document.createElement("p");
      err.className = "muted";
      err.textContent = error.message || "搜尋失敗";
      exerciseList.append(err);
      console.error(error);
    }
  }

  async function openDetail(oid) {
    hideSuggest();
    try {
      const ex = await api("api/object/oid/" + oid);
      viewSearch.hidden = true;
      viewDetail.hidden = false;
      lead.textContent = ex.ename || "教學細節";
      viewDetail.replaceChildren();

      const back = document.createElement("button");
      back.type = "button";
      back.className = "crumb-link";
      back.textContent = "← 回搜尋結果";
      back.addEventListener("click", function () {
        showSearch();
        runSearch();
      });
      viewDetail.append(back);

      const head = document.createElement("article");
      head.className = "card";
      const h2 = document.createElement("h2");
      h2.textContent = ex.title || ("#" + ex.oid);
      const purpose = document.createElement("p");
      purpose.className = "muted";
      purpose.textContent = ex.purpose || ex.des || "";
      const dose = document.createElement("p");
      dose.className = "ex-meta";
      dose.textContent = doseLine(ex);
      head.append(h2, purpose);
      if (dose.textContent) head.append(dose);
      viewDetail.append(head);

      const embedSrc = youtubeEmbedSrc(ex.video_path);
      if (embedSrc) {
        const videoCard = document.createElement("article");
        videoCard.className = "card";
        const h3 = document.createElement("h3");
        h3.textContent = "示範影片";
        const frameWrap = document.createElement("div");
        frameWrap.className = "video-frame";
        const iframe = document.createElement("iframe");
        iframe.src = embedSrc;
        iframe.title = (ex.title || "示範") + " 影片";
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute(
          "allow",
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        );
        iframe.referrerPolicy = "strict-origin-when-cross-origin";
        frameWrap.append(iframe);
        videoCard.append(h3, frameWrap);
        viewDetail.append(videoCard);
      }

      if (ex.steps && ex.steps.length) {
        const stepsCard = document.createElement("article");
        stepsCard.className = "card";
        const h3 = document.createElement("h3");
        h3.textContent = "步驟";
        const ol = document.createElement("ol");
        ol.className = "list";
        ex.steps.forEach(function (step) {
          const li = document.createElement("li");
          li.textContent = step;
          ol.append(li);
        });
        stepsCard.append(h3, ol);
        viewDetail.append(stepsCard);
      }
    } catch (error) {
      lead.textContent = error.message || "載入失敗";
      console.error(error);
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    runSearch();
  });

  resetBtn.addEventListener("click", function () {
    qInput.value = "";
    filterGroups.forEach(function (group) {
      const el = document.getElementById("filter-" + group.group);
      if (el) el.value = "";
    });
    hideSuggest();
    runSearch();
  });

  qInput.addEventListener("input", function () {
    clearTimeout(suggestTimer);
    suggestTimer = setTimeout(function () {
      renderSuggest(buildSuggest(qInput.value));
    }, 120);
  });

  qInput.addEventListener("keydown", function (event) {
    if (suggestList.hidden || !suggestions.length) {
      if (event.key === "Escape") hideSuggest();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      highlightSuggest(Math.min(activeSuggest + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      highlightSuggest(Math.max(activeSuggest - 1, 0));
    } else if (event.key === "Enter" && activeSuggest >= 0) {
      event.preventDefault();
      applySuggest(suggestions[activeSuggest]);
    } else if (event.key === "Escape") {
      hideSuggest();
    }
  });

  qInput.addEventListener("blur", function () {
    setTimeout(hideSuggest, 120);
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".suggest-wrap")) hideSuggest();
  });

  async function loadCatalogAndFilters() {
    const roots = await api("api/subclass/pcid/0");
    const catalogRow = roots.find(function (row) {
      return row.child_name === CATALOG_NAME;
    });
    if (!catalogRow) throw new Error("找不到「運動分類」目錄");
    catalog = { cid: catalogRow.cid, name: catalogRow.child_name };

    const groups = await api("api/subclass/pcid/" + catalog.cid);
    const filterData = [];
    for (let i = 0; i < groups.length; i += 1) {
      const group = groups[i];
      const leaves = await api("api/subclass/pcid/" + group.cid);
      filterData.push({
        group: "g" + group.cid,
        label: group.child_name,
        options: leaves.map(function (leaf) {
          return {
            cid: leaf.cid,
            code: String(leaf.cid),
            name: leaf.child_name,
          };
        }),
      });
    }
    renderFilters(filterData);
  }

  async function boot() {
    try {
      await loadCatalogAndFilters();
      allItems = await api("api/objectlist/cid/" + catalog.cid);
      await runSearch();
    } catch (error) {
      lead.textContent = error.message || "載入失敗";
      console.error(error);
    }
  }

  boot();
})();
