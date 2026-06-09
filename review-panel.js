const tokenStorageKey = "vcodic-review-token";

const state = {
  status: "pending",
  token: sessionStorage.getItem(tokenStorageKey) || "",
};

const authForm = document.querySelector("#review-auth-form");
const tokenInput = document.querySelector("#review-token");
const disconnectButton = document.querySelector("#review-disconnect");
const statusNotice = document.querySelector("#review-status");
const reviewList = document.querySelector("#review-list");
const reviewSummary = document.querySelector("#review-summary");

function setNotice(message, tone) {
  statusNotice.textContent = message;
  statusNotice.hidden = !message;
  statusNotice.className = `submit-notice${tone ? ` submit-notice-${tone}` : ""}`;
}

function clearNotice() {
  statusNotice.hidden = true;
  statusNotice.textContent = "";
  statusNotice.className = "submit-notice";
}

function isConnected() {
  return Boolean(state.token);
}

function reviewHeaders(withJson = false) {
  const headers = {
    "x-review-token": state.token,
  };

  if (withJson) {
    headers["Content-Type"] = "application/json";
    headers.Accept = "application/json";
  }

  return headers;
}

function formatDate(value) {
  if (!value) {
    return "未记录";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "未记录";
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function statusLabel(status) {
  if (status === "approved") {
    return "已通过";
  }

  if (status === "rejected") {
    return "已拒绝";
  }

  return "待审核";
}

function emptyMarkup(message) {
  return `
    <article class="empty-state review-empty">
      <div>
        <strong>${statusLabel(state.status)}为空</strong>
        <p>${message}</p>
      </div>
    </article>
  `;
}

function reviewCardMarkup(item) {
  const description = item.description || "未补充详细说明。";
  const creator = item.creator_name || "未填写";
  const screenshot = item.screenshot_path
    ? `<code class="review-code">${item.screenshot_path}</code>`
    : "<span class=\"review-muted\">未上传截图</span>";
  const notes = item.review_notes || "";

  return `
    <article class="review-card" data-id="${item.id}">
      <div class="review-card-head">
        <div>
          <p class="hero-eyebrow">${statusLabel(item.status)}</p>
          <h3>${item.product_name || "未填写产品名称"}</h3>
        </div>
        <a class="action-link" href="${item.product_url || "#"}" target="_blank" rel="noreferrer">打开产品</a>
      </div>

      <p class="review-tagline">${item.tagline || "未填写一句话介绍"}</p>
      <p class="review-description">${description}</p>

      <div class="review-meta-grid">
        <div><strong>提交人</strong><span>${creator}</span></div>
        <div><strong>联系邮箱</strong><span>${item.contact_email || "未填写"}</span></div>
        <div><strong>提交时间</strong><span>${formatDate(item.created_at)}</span></div>
        <div><strong>截图</strong><span>${screenshot}</span></div>
      </div>

      <label class="form-field form-field-wide review-notes-field">
        <span>审核备注</span>
        <textarea data-role="review-notes" rows="3" maxlength="1200" placeholder="记录为什么通过、拒绝，或者后续补充什么。">${notes}</textarea>
      </label>

      <div class="review-actions">
        <button class="action action-mint" data-action="approved" type="button">通过</button>
        <button class="action action-ink" data-action="rejected" type="button">拒绝</button>
        <button class="action action-ghost" data-action="pending" type="button">退回待审</button>
      </div>
    </article>
  `;
}

function lockCard(card, locked) {
  card.querySelectorAll("button, textarea").forEach((element) => {
    element.disabled = locked;
  });
}

async function loadReviewList() {
  if (!isConnected()) {
    reviewSummary.textContent = "先输入 review token 再加载审核列表。";
    reviewList.innerHTML = "";
    return;
  }

  const response = await fetch(`/api/review?status=${encodeURIComponent(state.status)}`, {
    headers: reviewHeaders(),
  });

  if (response.status === 401) {
    sessionStorage.removeItem(tokenStorageKey);
    state.token = "";
    throw new Error("review token 无效，请重新输入。");
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error((payload && payload.error) || `审核列表读取失败 (${response.status})`);
  }

  const payload = await response.json();
  const items = Array.isArray(payload.items) ? payload.items : [];

  reviewSummary.textContent = `${statusLabel(state.status)} ${items.length} 条`;
  reviewList.innerHTML = items.length
    ? items.map(reviewCardMarkup).join("")
    : emptyMarkup("当前筛选下没有记录。");
}

async function updateSubmission(id, nextStatus, reviewNotes) {
  const response = await fetch("/api/review", {
    method: "POST",
    headers: reviewHeaders(true),
    body: JSON.stringify({
      id,
      status: nextStatus,
      reviewNotes,
    }),
  });

  if (response.status === 401) {
    sessionStorage.removeItem(tokenStorageKey);
    state.token = "";
    throw new Error("review token 无效，请重新输入。");
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error((payload && payload.error) || `审核更新失败 (${response.status})`);
  }
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const token = tokenInput.value.trim();
  if (!token) {
    setNotice("先输入 review token。", "warning");
    return;
  }

  state.token = token;
  sessionStorage.setItem(tokenStorageKey, token);
  clearNotice();

  try {
    await loadReviewList();
    setNotice("审核接口已连接。", "warning");
  } catch (error) {
    setNotice(error.message || "审核接口连接失败。", "error");
  }
});

disconnectButton.addEventListener("click", () => {
  sessionStorage.removeItem(tokenStorageKey);
  state.token = "";
  tokenInput.value = "";
  reviewSummary.textContent = "已清除本地 token。";
  reviewList.innerHTML = "";
  setNotice("本地 token 已清除。", "warning");
});

document.querySelectorAll("[data-review-status]").forEach((button) => {
  button.addEventListener("click", async () => {
    state.status = button.dataset.reviewStatus || "pending";

    document.querySelectorAll("[data-review-status]").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    clearNotice();

    if (!isConnected()) {
      reviewSummary.textContent = "先输入 review token 再加载审核列表。";
      reviewList.innerHTML = "";
      return;
    }

    try {
      await loadReviewList();
    } catch (error) {
      setNotice(error.message || "审核列表读取失败。", "error");
    }
  });
});

reviewList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const card = button.closest("[data-id]");
  const id = card && card.dataset.id;
  if (!card || !id) {
    return;
  }

  const notesField = card.querySelector("[data-role='review-notes']");
  const reviewNotes = notesField ? notesField.value.trim() : "";

  clearNotice();
  lockCard(card, true);

  try {
    await updateSubmission(id, button.dataset.action, reviewNotes);
    await loadReviewList();
    setNotice(`已更新为${statusLabel(button.dataset.action)}。`, "warning");
  } catch (error) {
    setNotice(error.message || "审核更新失败。", "error");
  } finally {
    lockCard(card, false);
  }
});

if (state.token) {
  tokenInput.value = state.token;
  loadReviewList().catch((error) => {
    setNotice(error.message || "审核列表读取失败。", "error");
  });
} else {
  reviewSummary.textContent = "先输入 review token 再加载审核列表。";
}
