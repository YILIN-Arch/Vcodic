const config = window.VCODIC_CONFIG || {};
const feedEndpoint = "/api/feed";

const previewClasses = [
  "preview-astria",
  "preview-chatdoc",
  "preview-runway",
  "preview-recraft",
  "preview-resume",
  "preview-story",
];

const publicFeedFields = [
  "id",
  "product_name",
  "product_url",
  "tagline",
  "description",
  "creator_name",
  "screenshot_url",
  "published_at",
  "created_at",
].join(",");

const workDetail = document.querySelector("#work-detail");

function isPublicFeedConfigured() {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

function apiUrl(path) {
  return `${normalizeBaseUrl(config.supabaseUrl)}${path}`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function safeHttpUrl(value, fallback = "") {
  if (!value) {
    return fallback;
  }

  try {
    const url = new URL(value, window.location.href);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch (error) {
    return fallback;
  }

  return fallback;
}

function previewClassFor(index) {
  return previewClasses[index % previewClasses.length];
}

function safeCreator(value) {
  const normalized = (value || "").trim();
  return normalized || "匿名创作者";
}

function creatorInitial(name) {
  return (name || "V").trim().slice(0, 1).toUpperCase();
}

function normalizeProduct(row, index) {
  const description = (row.description || "").trim() || row.tagline;

  return {
    id: row.id,
    title: row.product_name,
    description,
    shortDescription: row.tagline,
    creator: safeCreator(row.creator_name),
    productUrl: safeHttpUrl(row.product_url, "#"),
    imageUrl: safeHttpUrl(row.screenshot_url, ""),
    preview: previewClassFor(index),
  };
}

function previewClassName(baseClassName, product) {
  const classes = [baseClassName, "preview", product.preview];

  if (product.imageUrl) {
    classes.push("preview-has-image");
  }

  return classes.join(" ");
}

function previewMarkup(product) {
  if (product.imageUrl) {
    return `<img class="preview-image" src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.title)} 作品封面" loading="eager" decoding="async">`;
  }

  return `
    <div class="preview-window">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <div class="preview-panel"></div>
    <div class="preview-band"></div>
  `;
}

function notFoundMarkup(message = "这个作品可能还没有公开，或者已经暂时下架。") {
  return `
    <div class="work-not-found">
      <p class="hero-eyebrow">作品暂时不可见</p>
      <h1>作品暂时不可见</h1>
      <p>${escapeHtml(message)}</p>
      <div class="not-found-actions">
        <a class="action action-ink" href="./index.html">返回首页</a>
        <a class="action action-mint" href="./submit.html">发布作品</a>
      </div>
    </div>
  `;
}

function detailMarkup(product) {
  return `
    <div class="${previewClassName("work-detail-preview", product)}">
      ${previewMarkup(product)}
    </div>
    <div class="work-detail-copy">
      <p class="hero-eyebrow">作品详情</p>
      <h1>${escapeHtml(product.title)}</h1>
      <p class="work-detail-tagline">${escapeHtml(product.shortDescription || product.description)}</p>

      <div class="work-detail-creator">
        <span class="creator-avatar">${escapeHtml(creatorInitial(product.creator))}</span>
        <span>${escapeHtml(product.creator)}</span>
      </div>

      <div class="work-detail-description">
        <h2>这个作品能做什么</h2>
        <p>${escapeHtml(product.description)}</p>
      </div>

      <div class="work-detail-actions">
        <a class="action action-mint" href="${escapeHtml(product.productUrl)}" target="_blank" rel="noreferrer">试试看</a>
        <a class="action-link action-link-subtle" href="./index.html">返回作品流</a>
      </div>
    </div>
  `;
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function loadFeedFromEdge() {
  const response = await fetch(feedEndpoint, {
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload?.error || `作品读取失败 (${response.status})`);
  }

  return payload;
}

async function loadFeedFromPublicRest() {
  if (!isPublicFeedConfigured()) {
    throw new Error("公开作品读取尚未配置 Supabase anon。");
  }

  const params = new URLSearchParams();
  params.set("select", publicFeedFields);
  params.set("status", "eq.approved");
  params.set("order", "published_at.desc.nullslast,created_at.desc");
  params.set("limit", "24");

  const response = await fetch(apiUrl(`/rest/v1/submissions?${params.toString()}`), {
    headers: {
      Accept: "application/json",
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`,
    },
  });

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `作品读取失败 (${response.status})`);
  }

  return {
    items: Array.isArray(payload) ? payload : [],
  };
}

async function loadFeed() {
  let edgePayload = null;
  let payload;

  try {
    edgePayload = await loadFeedFromEdge();

    if (edgePayload?.degraded) {
      try {
        payload = await loadFeedFromPublicRest();
      } catch (error) {
        payload = {
          items: Array.isArray(edgePayload.items) ? edgePayload.items : [],
        };
      }
    } else {
      payload = edgePayload;
    }
  } catch (error) {
    payload = await loadFeedFromPublicRest();
  }

  return Array.isArray(payload?.items) ? payload.items.map(normalizeProduct) : [];
}

function currentWorkId() {
  return new URLSearchParams(window.location.search).get("id") || "";
}

async function initializeWorkDetail() {
  const id = currentWorkId();

  if (!id) {
    workDetail.innerHTML = notFoundMarkup("地址里缺少作品 ID。");
    return;
  }

  try {
    const items = await loadFeed();
    const product = items.find((item) => item.id === id);

    if (!product) {
      workDetail.innerHTML = notFoundMarkup();
      return;
    }

    document.title = `VCodic | ${product.title}`;
    workDetail.innerHTML = detailMarkup(product);
  } catch (error) {
    workDetail.innerHTML = notFoundMarkup(error.message || "作品读取失败。");
  }
}

initializeWorkDetail();
