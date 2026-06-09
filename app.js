const state = {
  sort: "new",
  query: "",
};

const config = window.VCODIC_CONFIG || {};

const previewClasses = [
  "preview-astria",
  "preview-chatdoc",
  "preview-runway",
  "preview-recraft",
  "preview-resume",
  "preview-story",
];

const feedEndpoint = "/api/feed";
const publicFeedFields = [
  "id",
  "product_name",
  "product_url",
  "tagline",
  "description",
  "creator_name",
  "published_at",
  "created_at",
].join(",");

const featuredCard = document.querySelector("#featured-card");
const featuredKicker = document.querySelector("#featured-kicker");
const featuredTitle = document.querySelector("#featured-title");
const featuredDescription = document.querySelector("#featured-description");
const featuredCreator = document.querySelector("#featured-creator");
const featuredStats = document.querySelector("#featured-stats");
const featuredLink = document.querySelector("#featured-link");
const featuredPreview = document.querySelector(".featured-preview");
const productGrid = document.querySelector("#product-grid");
const secondaryGrid = document.querySelector("#secondary-grid");
const curatedList = document.querySelector("#curated-list");
const makerList = document.querySelector("#maker-list");
const searchInput = document.querySelector("#search-input");
const profileName = document.querySelector("#profile-name");
const profileRole = document.querySelector("#profile-role");
const mobileProfileName = document.querySelector("#mobile-profile-name");
const mobileProfileRole = document.querySelector("#mobile-profile-role");
const savedCount = document.querySelector("#saved-count");
const triedCount = document.querySelector("#tried-count");
const mobilePublishedCount = document.querySelector("#mobile-published-count");
const mobileCreatorCount = document.querySelector("#mobile-creator-count");

let approvedProducts = [];

function isPublicFeedConfigured() {
  return Boolean(config.supabaseUrl && config.supabaseAnonKey);
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

function apiUrl(path) {
  return `${normalizeBaseUrl(config.supabaseUrl)}${path}`;
}

function previewClassFor(index) {
  return previewClasses[index % previewClasses.length];
}

function toDateLabel(value) {
  if (!value) {
    return "待发布时间";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "待发布时间";
  }

  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function toLongDateLabel(value) {
  if (!value) {
    return "待发布时间";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "待发布时间";
  }

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function safeCreator(value) {
  const normalized = (value || "").trim();
  return normalized || "匿名提交";
}

function normalizeProduct(row, index) {
  const publishedAt = row.published_at || row.created_at || null;
  const description = (row.description || "").trim() || row.tagline;

  return {
    id: row.id,
    title: row.product_name,
    description,
    shortDescription: row.tagline,
    creator: safeCreator(row.creator_name),
    publishedAt,
    productUrl: row.product_url,
    preview: previewClassFor(index),
  };
}

function bySort(items) {
  const sorted = [...items].sort((left, right) => {
    const leftTime = new Date(left.publishedAt || 0).getTime();
    const rightTime = new Date(right.publishedAt || 0).getTime();
    return rightTime - leftTime;
  });

  if (state.sort === "old") {
    return sorted.reverse();
  }

  return sorted;
}

function matchesQuery(product) {
  const query = state.query.trim().toLowerCase();
  if (!query) {
    return true;
  }

  const haystack = [
    product.title,
    product.description,
    product.shortDescription,
    product.creator,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

function visibleProducts() {
  return bySort(approvedProducts.filter(matchesQuery));
}

function previewMarkup(product) {
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

function emptyStateMarkup(title, message, actionHref, actionLabel) {
  const actionMarkup = actionHref && actionLabel
    ? `<a class="action-link" href="${actionHref}">${actionLabel}</a>`
    : "";

  return `
    <article class="empty-state">
      <div>
        <strong>${title}</strong>
        <p>${message}</p>
        ${actionMarkup}
      </div>
    </article>
  `;
}

function miniEmptyMarkup(message) {
  return `<article class="mini-item mini-item-empty"><p>${message}</p></article>`;
}

function makerEmptyMarkup(message) {
  return `<article class="maker-item maker-item-empty"><p>${message}</p></article>`;
}

function updateProfileMetrics(items) {
  const creatorCount = new Set(items.map((item) => item.creator).filter(Boolean)).size;

  savedCount.textContent = String(items.length);
  triedCount.textContent = String(creatorCount);
  mobilePublishedCount.textContent = `${items.length} 已发布`;
  mobileCreatorCount.textContent = `${creatorCount} 提交者`;

  profileName.textContent = "VCodic";
  mobileProfileName.textContent = "VCodic";
  profileRole.textContent = items.length
    ? "人工审核的 AI 产品目录"
    : "等待第一批已通过产品";
  mobileProfileRole.textContent = profileRole.textContent;
}

function updateFeatured(product) {
  if (!product) {
    featuredKicker.textContent = "公开内容池";
    featuredTitle.textContent = "还没有已发布产品";
    featuredDescription.textContent = "先收投稿，再审核发布。第一批通过内容会直接出现在这里。";
    featuredCreator.textContent = "VCodic";
    featuredStats.textContent = "当前公开池为空";
    featuredLink.href = "./submit.html";
    featuredLink.removeAttribute("target");
    featuredLink.removeAttribute("rel");
    featuredLink.textContent = "提交第一条产品";
    featuredPreview.className = "featured-preview preview preview-recraft";
    featuredPreview.innerHTML = previewMarkup({ preview: "preview-recraft" });
    featuredCard.dataset.mode = "empty";
    return;
  }

  featuredKicker.textContent = "最新通过";
  featuredTitle.textContent = product.title;
  featuredDescription.textContent = product.shortDescription || product.description;
  featuredCreator.textContent = product.creator;
  featuredStats.textContent = `${toLongDateLabel(product.publishedAt)} 收录 · 已通过审核`;
  featuredLink.href = product.productUrl;
  featuredLink.target = "_blank";
  featuredLink.rel = "noreferrer";
  featuredLink.textContent = "打开产品";
  featuredPreview.className = `featured-preview preview ${product.preview}`;
  featuredPreview.innerHTML = previewMarkup(product);
  featuredCard.dataset.mode = "ready";
}

function productCardMarkup(product) {
  return `
    <article class="product-card">
      <div class="preview ${product.preview}">
        ${previewMarkup(product)}
      </div>
      <div class="product-card-body">
        <h3>${product.title}</h3>
        <p>${product.description}</p>
        <div class="product-meta">
          <div class="creator-chip">
            <span class="creator-dot"></span>
            <span>${product.creator}</span>
          </div>
          <div class="product-stats">${toDateLabel(product.publishedAt)} 收录</div>
        </div>
        <div class="product-card-actions">
          <a class="action-link" href="${product.productUrl}" target="_blank" rel="noreferrer">打开产品</a>
        </div>
      </div>
    </article>
  `;
}

function renderProducts() {
  const items = visibleProducts();
  const featured = items[0] || null;
  const rest = items.slice(1);

  updateFeatured(featured);

  const primaryItems = rest.slice(0, 4);
  const secondaryItems = rest.slice(4);

  productGrid.innerHTML = primaryItems.length
    ? primaryItems.map(productCardMarkup).join("")
    : emptyStateMarkup(
        state.query.trim() ? "没有匹配结果" : "还没有更多已发布内容",
        state.query.trim()
          ? `没有找到和“${state.query.trim()}”相关的产品。`
          : "第一批通过审核的产品会从这里开始继续扩展。",
      );

  secondaryGrid.innerHTML = secondaryItems.length
    ? secondaryItems.map(productCardMarkup).join("")
    : "";
}

function renderCurated() {
  const items = bySort(approvedProducts).slice(0, 3);

  curatedList.innerHTML = items.length
    ? items
        .map(
          (item) => `
            <article class="mini-item">
              <div class="mini-item-main">
                <div class="mini-preview ${item.preview}"></div>
                <div>
                  <h3>${item.title}</h3>
                  <p>${toLongDateLabel(item.publishedAt)} 收录</p>
                </div>
              </div>
              <a class="action-link" href="${item.productUrl}" target="_blank" rel="noreferrer">打开</a>
            </article>
          `,
        )
        .join("")
    : miniEmptyMarkup("公开列表还没有已通过内容。");
}

function renderMakers() {
  const creators = [];
  const seen = new Map();

  for (const item of approvedProducts) {
    const key = item.creator;
    const count = seen.get(key) || 0;
    seen.set(key, count + 1);
  }

  for (const [name, count] of seen.entries()) {
    creators.push({
      name,
      count,
    });
  }

  creators.sort((left, right) => right.count - left.count);

  makerList.innerHTML = creators.length
    ? creators
        .slice(0, 4)
        .map(
          (maker) => `
            <article class="maker-item">
              <div class="maker-item-main">
                <div class="maker-avatar"></div>
                <div>
                  <h3>${maker.name}</h3>
                  <p>已收录 ${maker.count} 条</p>
                </div>
              </div>
              <span class="follow-button">已发布</span>
            </article>
          `,
        )
        .join("")
    : makerEmptyMarkup("还没有可公开展示的提交者。");
}

function renderEverything() {
  updateProfileMetrics(approvedProducts);
  renderCurated();
  renderMakers();
  renderProducts();
}

function renderFetchFailure(message) {
  approvedProducts = [];
  updateProfileMetrics([]);
  updateFeatured(null);
  featuredKicker.textContent = "数据连接失败";
  featuredDescription.textContent = message;
  productGrid.innerHTML = emptyStateMarkup("暂时无法读取公开内容", message, "./submit.html", "继续收投稿");
  secondaryGrid.innerHTML = "";
  curatedList.innerHTML = miniEmptyMarkup("暂时无法读取公开列表。");
  makerList.innerHTML = makerEmptyMarkup("暂时无法读取提交者列表。");
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
    let message = `公开内容读取失败 (${response.status})`;

    if (payload && payload.error) {
      message = payload.error;
    }

    throw new Error(message);
  }

  return payload;
}

async function loadFeedFromPublicRest() {
  if (!isPublicFeedConfigured()) {
    throw new Error("公开内容尚未配置 Supabase anon 读取。");
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
    const message =
      payload?.message ||
      payload?.error_description ||
      payload?.error ||
      `公开内容读取失败 (${response.status})`;
    throw new Error(message);
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

  const items = Array.isArray(payload?.items) ? payload.items : [];
  approvedProducts = items.map(normalizeProduct);
}

function bindSortTabs() {
  document.querySelectorAll(".sort-pill").forEach((button) => {
    button.addEventListener("click", () => {
      state.sort = button.dataset.sort || "new";

      document.querySelectorAll(".sort-pill").forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      renderProducts();
      renderCurated();
    });
  });
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderProducts();
});

bindSortTabs();

loadFeed()
  .then(renderEverything)
  .catch((error) => {
    renderFetchFailure(error.message || "公开内容读取失败。");
  });
