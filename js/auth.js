const loginLink = document.getElementById("account-login");
const signedIn = document.getElementById("account-signed");
const toggle = document.getElementById("account-toggle");
const dropdown = document.getElementById("account-dropdown");
const accountPhoto = document.getElementById("account-photo");
const accountLetter = document.getElementById("account-letter");
const accountName = document.getElementById("account-name");
const logoutButton = document.getElementById("account-logout");

function closeMenu() {
  dropdown.hidden = true;
  toggle.setAttribute("aria-expanded", "false");
}

function showSignedOut() {
  closeMenu();
  signedIn.hidden = true;
  loginLink.hidden = false;
}

function showSignedIn(member) {
  // 優先自訂 display_name；否則 Google name／email
  const label = member.display_name || member.name || member.email || "已登入";
  loginLink.hidden = true;
  signedIn.hidden = false;
  accountName.textContent = label;
  toggle.setAttribute("aria-label", label);
  if (member.picture) {
    accountPhoto.src = member.picture;
    accountPhoto.alt = "";
    accountPhoto.hidden = false;
    accountLetter.hidden = true;
    accountLetter.textContent = "";
    return;
  }
  accountPhoto.removeAttribute("src");
  accountPhoto.hidden = true;
  accountLetter.hidden = false;
  accountLetter.textContent = label.slice(0, 1);
}

function toggleMenu() {
  const open = dropdown.hidden;
  dropdown.hidden = !open;
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
}

async function logout() {
  if (!window.confirm("確定要登出嗎？")) {
    return;
  }
  logoutButton.disabled = true;
  try {
    const response = await fetch("api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    window.location.reload();
  } catch (error) {
    logoutButton.disabled = false;
    console.error("無法登出", error);
    window.alert("登出失敗，稍後再試");
  }
}

async function loadAccount() {
  try {
    const response = await fetch("api/auth/me", { credentials: "same-origin" });
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    showSignedIn(await response.json());
  } catch (error) {
    showSignedOut();
  }
}

toggle.addEventListener("click", toggleMenu);
logoutButton.addEventListener("click", logout);
document.addEventListener("click", function (event) {
  if (signedIn.hidden || signedIn.contains(event.target)) {
    return;
  }
  closeMenu();
});
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeMenu();
  }
});
loadAccount();
