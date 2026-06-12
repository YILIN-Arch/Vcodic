const config = window.VCODIC_CONFIG || {};

const form = document.querySelector("#submission-form");
const submitButton = document.querySelector("#submit-button");
const statusNotice = document.querySelector("#submit-status");
const configNotice = document.querySelector("#submit-config-notice");
const successPanel = document.querySelector("#submit-success");
const screenshotInput = document.querySelector("#screenshot");

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function setNotice(element, message, tone) {
  element.textContent = message;
  element.hidden = !message;
  element.className = `submit-notice${tone ? ` submit-notice-${tone}` : ""}`;
}

function clearNotice(element) {
  element.hidden = true;
  element.textContent = "";
  element.className = "submit-notice";
}

function isConfigured() {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

function apiUrl(path) {
  return `${normalizeBaseUrl(config.supabaseUrl)}${path}`;
}

function normalizeProductUrl(rawValue) {
  const value = rawValue.trim();
  if (!value) {
    throw new Error("请填写作品链接。");
  }

  const normalized = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    return new URL(normalized).toString();
  } catch (error) {
    throw new Error("作品链接格式不正确。");
  }
}

function validateFile(file) {
  if (!file) {
    return;
  }

  if (!allowedMimeTypes.has(file.type)) {
    throw new Error("截图只支持 JPG、PNG 或 WEBP。");
  }

  if (config.maxUploadBytes && file.size > config.maxUploadBytes) {
    throw new Error("截图大小不能超过 5 MB。");
  }
}

function safeFileExtension(file) {
  const name = file.name || "";
  const suffix = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
  if (suffix) {
    return suffix;
  }

  if (file.type === "image/jpeg") {
    return "jpg";
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "bin";
}

async function parseError(response) {
  const fallback = `请求失败 (${response.status})`;

  try {
    const data = await response.json();
    return data.message || data.error_description || data.error || fallback;
  } catch (error) {
    const text = await response.text();
    return text || fallback;
  }
}

async function uploadScreenshot(file) {
  if (!file) {
    return null;
  }

  const objectPath = `pending/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${safeFileExtension(file)}`;
  const response = await fetch(
    apiUrl(`/storage/v1/object/${encodeURIComponent(config.storageBucket)}/${objectPath}`),
    {
      method: "POST",
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        "x-upsert": "false",
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    },
  );

  if (!response.ok) {
    throw new Error(`截图上传失败：${await parseError(response)}`);
  }

  return objectPath;
}

async function insertSubmission(payload) {
  const response = await fetch(apiUrl("/rest/v1/submissions"), {
    method: "POST",
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`投稿写入失败：${await parseError(response)}`);
  }
}

function buildPayload(formData, screenshotPath) {
  const productName = formData.get("product_name").trim();
  const tagline = formData.get("tagline").trim();
  const description = formData.get("description").trim();
  const creatorName = formData.get("creator_name").trim();
  const contactEmail = formData.get("contact_email").trim();

  if (!productName) {
    throw new Error("请填写作品名称。");
  }

  if (!tagline) {
    throw new Error("请填写一句话介绍。");
  }

  if (!contactEmail) {
    throw new Error("请填写联系邮箱。");
  }

  return {
    product_name: productName,
    product_url: normalizeProductUrl(formData.get("product_url")),
    tagline,
    description: description || null,
    creator_name: creatorName || null,
    contact_email: contactEmail,
    screenshot_path: screenshotPath,
    status: "pending",
  };
}

function lockForm(locked) {
  submitButton.disabled = locked;
  submitButton.textContent = locked ? "发布中..." : "发布作品";

  Array.from(form.elements).forEach((element) => {
    if (element === submitButton) {
      return;
    }

    element.disabled = locked;
  });
}

function showSuccess() {
  form.hidden = true;
  clearNotice(statusNotice);
  successPanel.hidden = false;
}

function initializeConfigurationState() {
  if (isConfigured()) {
    clearNotice(configNotice);
    return;
  }

  setNotice(
    configNotice,
    "发布页尚未接入 Supabase。先在 site-config.js 填入 SUPABASE URL 和 anon key，再重新部署。",
    "warning",
  );
  submitButton.disabled = true;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isConfigured()) {
    initializeConfigurationState();
    return;
  }

  clearNotice(statusNotice);

  const formData = new FormData(form);
  const screenshot = screenshotInput.files[0];

  try {
    validateFile(screenshot);
    lockForm(true);

    const screenshotPath = await uploadScreenshot(screenshot);
    await insertSubmission(buildPayload(formData, screenshotPath));

    form.reset();
    showSuccess();
  } catch (error) {
    setNotice(statusNotice, error.message || "提交失败，请稍后重试。", "error");
  } finally {
    lockForm(false);
  }
});

initializeConfigurationState();
