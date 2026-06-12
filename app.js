const state = {
  sort: "featured",
  query: "",
};

const config = window.VCODIC_CONFIG || {};
const feedEndpoint = "/api/feed";
const skeletonCardCount = 8;

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

const worksFeed = document.querySelector("#works-feed");
const searchInput = document.querySelector("#search-input");

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
  const publishedAt = row.published_at || row.created_at || null;
  const description = (row.description || "").trim() || row.tagline;
  const productUrl = safeHttpUrl(row.product_url, "#");
  const imageUrl = safeHttpUrl(row.screenshot_url, "");

  return {
    id: row.id,
    title: row.product_name,
    description,
    shortDescription: row.tagline,
    creator: safeCreator(row.creator_name),
    publishedAt,
    productUrl,
    imageUrl,
    preview: previewClassFor(index),
  };
}

function sortByNewest(items) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.publishedAt || 0).getTime();
    const rightTime = new Date(right.publishedAt || 0).getTime();
    return rightTime - leftTime;
  });
}

function sortByFeatured(items) {
  return sortByNewest(items).sort((left, right) => {
    if (Boolean(left.imageUrl) === Boolean(right.imageUrl)) {
      return 0;
    }

    return left.imageUrl ? -1 : 1;
  });
}

function sortedProducts(items) {
  if (state.sort === "new") {
    return sortByNewest(items);
  }

  return sortByFeatured(items);
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
  return sortedProducts(approvedProducts.filter(matchesQuery));
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
    return `<img class="preview-image" src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.title)} 作品封面" loading="lazy" decoding="async">`;
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

function workDetailUrl(product) {
  const params = new URLSearchParams();
  params.set("id", product.id);
  return `./work.html?${params.toString()}`;
}

function productTone(product, index) {
  if (state.sort === "featured" && product.imageUrl) {
    return "精选";
  }

  if (state.sort === "featured" && index < 3) {
    return "精选";
  }

  if (state.sort === "new" || index < 3) {
    return "最新";
  }

  return "最新";
}

function productCardMarkup(product, index) {
  return `
    <a class="work-card" href="${escapeHtml(workDetailUrl(product))}">
      <div class="${previewClassName("work-card-preview", product)}">
        ${previewMarkup(product)}
        <div class="work-card-title-overlay">
          <h3>${escapeHtml(product.title)}</h3>
        </div>
      </div>
      <div class="work-card-body">
        <div class="work-card-meta">
          <div class="creator-chip">
            <span class="creator-avatar">${escapeHtml(creatorInitial(product.creator))}</span>
            <span>${escapeHtml(product.creator)}</span>
          </div>
          <span class="work-card-badge">${escapeHtml(productTone(product, index))}</span>
        </div>
      </div>
    </a>
  `;
}

function emptyStateMarkup(title, message, actionHref, actionLabel) {
  return `
    <article class="empty-state">
      <div>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(message)}</p>
        <a class="action action-mint" href="${escapeHtml(safeHttpUrl(actionHref, "./submit.html"))}">${escapeHtml(actionLabel)}</a>
      </div>
    </article>
  `;
}

function skeletonMarkup() {
  return Array.from({ length: skeletonCardCount }, (_, index) => `
    <article class="work-card work-card-skeleton" aria-hidden="true">
      <div class="skeleton-cover skeleton-shimmer skeleton-cover-${(index % 4) + 1}"></div>
      <div class="work-card-body">
        <div class="work-card-meta">
          <div class="creator-chip">
            <span class="skeleton-avatar skeleton-shimmer"></span>
            <span class="skeleton-line skeleton-line-mid skeleton-shimmer"></span>
          </div>
          <span class="skeleton-badge skeleton-shimmer"></span>
        </div>
      </div>
    </article>
  `).join("");
}

function renderSkeletons() {
  worksFeed.innerHTML = skeletonMarkup();
}

function renderProducts() {
  const items = visibleProducts();

  if (!items.length) {
    const hasQuery = Boolean(state.query.trim());
    worksFeed.innerHTML = hasQuery
      ? emptyStateMarkup("没有匹配作品", `没有找到和“${state.query.trim()}”相关的小作品。`, "./submit.html", "发布作品")
      : emptyStateMarkup("还没有作品", "发布你的第一个 vibe coding 小作品。", "./submit.html", "发布作品");
    return;
  }

  worksFeed.innerHTML = items.map(productCardMarkup).join("");
}

function renderFetchFailure(message) {
  approvedProducts = [];
  worksFeed.innerHTML = emptyStateMarkup("暂时无法读取作品", message, "./submit.html", "发布作品");
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
    let message = `作品读取失败 (${response.status})`;

    if (payload && payload.error) {
      message = payload.error;
    }

    throw new Error(message);
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
    const message =
      payload?.message ||
      payload?.error_description ||
      payload?.error ||
      `作品读取失败 (${response.status})`;
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
      state.sort = button.dataset.sort || "featured";

      document.querySelectorAll(".sort-pill").forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      renderProducts();
    });
  });
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderProducts();
});

bindSortTabs();
renderSkeletons();

loadFeed()
  .then(renderProducts)
  .catch((error) => {
    renderFetchFailure(error.message || "作品读取失败。");
  });
