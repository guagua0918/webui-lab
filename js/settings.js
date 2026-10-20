const statusText = document.getElementById("profile-status");
const nameText = document.getElementById("profile-name");
const emailText = document.getElementById("profile-email");

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
    nameText.hidden = false;
    emailText.hidden = false;
    nameText.textContent = member.name || "未提供名稱";
    emailText.textContent = member.email || "";
  } catch (error) {
    console.error("無法讀取個人設定", error);
    statusText.textContent = "帳號資料讀取失敗，稍後再試。";
  }
}

loadProfile();
