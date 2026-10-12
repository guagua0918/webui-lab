const account = document.getElementById("account");
const accountMark = document.getElementById("account-mark");
const accountName = document.getElementById("account-name");
const accountHint = document.getElementById("account-hint");

function showSignedOut() {
  account.href = "api/auth/google/login";
  account.classList.add("avatar-login");
  account.setAttribute("aria-label", "使用 Gmail 登入");
  accountMark.textContent = "";
  accountMark.classList.remove("is-letter");
  accountName.textContent = "登入";
  accountHint.hidden = false;
}

function showSignedIn(member) {
  const label = member.name || member.email || "已登入";
  account.removeAttribute("href");
  account.classList.remove("avatar-login");
  account.setAttribute("aria-label", label);
  accountName.textContent = label;
  accountHint.hidden = true;
  if (!member.picture) {
    accountMark.textContent = label.slice(0, 1);
    accountMark.classList.add("is-letter");
    return;
  }
  const photo = document.createElement("img");
  photo.className = "avatar-photo";
  photo.alt = "";
  photo.src = member.picture;
  accountMark.replaceWith(photo);
}

fetch("api/auth/me", { credentials: "same-origin" })
  .then(function (response) {
    if (!response.ok) {
      throw new Error("signed out");
    }
    return response.json();
  })
  .then(showSignedIn)
  .catch(showSignedOut);
