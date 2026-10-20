const PAGES = {
  "掃描": { href: "scan", icon: "👣" },
  "運動菜單": { href: "menu", icon: "☰" },
  "運動": { href: "exercise", icon: "↑" },
};

const slot = document.getElementById("nav-subclass");

function currentPage() {
  const part = location.pathname.replace(/\/+$/, "").split("/").pop();
  return part || "index";
}

function isProtected(page) {
  return Object.values(PAGES).some(function (item) {
    return item.href === page;
  });
}

function markActive() {
  const page = currentPage();
  document.querySelectorAll(".bottom-nav a").forEach(function (link) {
    link.classList.toggle("active", link.getAttribute("href") === page);
  });
}

function showGate(message) {
  const main = document.querySelector("main.content");
  if (!main) return;
  main.replaceChildren();
  const title = document.createElement("h1");
  title.className = "page-title";
  title.textContent = message;
  main.append(title);
  if (message === "請先登入") {
    const lead = document.createElement("p");
    lead.className = "lead";
    lead.textContent = "掃描、運動和運動菜單要登入才能看。";
    const link = document.createElement("a");
    link.className = "btn btn-primary";
    link.href = "api/auth/google/login";
    link.textContent = "登入";
    main.append(lead, link);
  }
}

function renderItems(items) {
  slot.replaceChildren();
  items.forEach(function (item) {
    const page = PAGES[item.child_name];
    if (!page) return;
    const link = document.createElement("a");
    link.href = page.href;
    const icon = document.createElement("span");
    icon.className = "icon";
    icon.textContent = page.icon;
    link.append(icon, document.createTextNode(item.child_name));
    slot.append(link);
  });
  markActive();
}

async function loadNavigation() {
  markActive();
  try {
    const response = await fetch("api/subclass/pcid/1", { credentials: "same-origin" });
    if (response.status === 401) {
      document.querySelectorAll("a").forEach(function (link) {
        const href = link.getAttribute("href");
        if (isProtected(href)) link.hidden = true;
      });
      if (isProtected(currentPage())) showGate("請先登入");
      return;
    }
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    renderItems(await response.json());
  } catch (error) {
    console.error("無法載入目錄", error);
    if (isProtected(currentPage())) showGate("目錄讀取失敗");
  }
}

loadNavigation();
