// W08：表單 + 前端驗證 + 安全 DOM（textContent，不用 innerHTML）
const statusText = document.getElementById("profile-status");
const profileCard = document.getElementById("profile-card");
const form = document.getElementById("profile-form");
const displayNameInput = document.getElementById("display-name");
const nameError = document.getElementById("name-error");
const googleNameInput = document.getElementById("google-name");
const emailInput = document.getElementById("profile-email");
const pictureField = document.getElementById("picture-field");
const pictureImg = document.getElementById("profile-picture");
const formMessage = document.getElementById("form-message");
const saveBtn = document.getElementById("btn-save");

function setNameError(message) {
  if (!message) {
    nameError.hidden = true;
    nameError.textContent = "";
    return;
  }
  nameError.hidden = false;
  nameError.textContent = message;
}

function setFormMessage(message, isError) {
  formMessage.textContent = message || "";
  formMessage.classList.toggle("is-error", Boolean(isError));
}

function validateDisplayName(value) {
  const name = value.trim();
  if (name.length < 2) {
    return "顯示名稱至少 2 個字元。";
  }
  if (name.length > 40) {
    return "顯示名稱最多 40 個字元。";
  }
  return "";
}

function fillForm(member) {
  const fallback = member.name || member.email || "";
  displayNameInput.value = member.display_name || fallback;
  googleNameInput.value = member.name || "（Google 未提供）";
  emailInput.value = member.email || "";
  if (member.picture) {
    pictureImg.src = member.picture;
    pictureImg.alt = "";
    pictureField.hidden = false;
  } else {
    pictureImg.removeAttribute("src");
    pictureField.hidden = true;
  }
}

function refreshHeaderLabel(label) {
  const accountName = document.getElementById("account-name");
  const accountLetter = document.getElementById("account-letter");
  const accountPhoto = document.getElementById("account-photo");
  if (accountName) {
    accountName.textContent = label;
  }
  if (accountLetter && accountPhoto && accountPhoto.hidden) {
    accountLetter.textContent = label.slice(0, 1);
  }
}

async function loadProfile() {
  try {
    const response = await fetch("api/auth/me", { credentials: "same-origin" });
    if (response.status === 401) {
      statusText.textContent = "請先登入。";
      return;
    }
    if (!response.ok) {
      throw new Error("HTTP " + response.status);
    }
    const member = await response.json();
    statusText.hidden = true;
    profileCard.hidden = false;
    fillForm(member);
  } catch (error) {
    console.error("無法讀取個人設定", error);
    statusText.textContent = "帳號資料讀取失敗，稍後再試。";
  }
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  setFormMessage("");
  const error = validateDisplayName(displayNameInput.value);
  if (error) {
    setNameError(error);
    return;
  }
  setNameError("");

  const displayName = displayNameInput.value.trim();
  saveBtn.disabled = true;
  try {
    const response = await fetch("api/auth/me", {
      method: "PATCH",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: displayName }),
    });
    if (response.status === 401) {
      setFormMessage("請先登入。", true);
      return;
    }
    if (!response.ok) {
      let detail = "HTTP " + response.status;
      try {
        const body = await response.json();
        if (body.detail) {
          detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
        }
      } catch (e) { /* ignore */ }
      throw new Error(detail);
    }
    const member = await response.json();
    fillForm(member);
    const label = member.display_name || member.name || member.email || "已登入";
    refreshHeaderLabel(label);
    setFormMessage("已儲存顯示名稱。");
  } catch (err) {
    setFormMessage(err.message || "儲存失敗", true);
  } finally {
    saveBtn.disabled = false;
  }
});

loadProfile();
