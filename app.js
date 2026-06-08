const state = {
  mood: "all",
  category: "all",
  sort: "hot",
  query: "",
};

const products = [
  {
    id: "astria",
    title: "Astria - AI 绘图工具",
    description: "一句话生成封面、灵感图和社交配图，不用看参数，打开就能玩。",
    shortDescription: "灵感图、封面图、社媒配图，一句就能起稿。",
    creator: "小舟",
    category: "设计",
    moods: ["fun", "useful"],
    players: "2.4k",
    saves: "1.2k",
    comments: 86,
    hotScore: 98,
    publishedAt: "2026-06-08T09:30:00+08:00",
    preview: "preview-astria",
  },
  {
    id: "ppt",
    title: "10 分钟生成专业 PPT",
    description: "输入主题，自动生成结构和配图，适合汇报和提案。",
    creator: "卡卡罗特",
    category: "办公",
    moods: ["useful", "learn"],
    saves: 987,
    comments: 42,
    hotScore: 91,
    publishedAt: "2026-06-08T08:10:00+08:00",
    preview: "preview-recraft",
  },
  {
    id: "chatdoc",
    title: "ChatDOC",
    description: "上传文档，快速问读和总结，适合读方案和报告。",
    creator: "小舟",
    category: "学习",
    moods: ["useful", "learn"],
    saves: 756,
    comments: 23,
    hotScore: 87,
    publishedAt: "2026-06-07T21:20:00+08:00",
    preview: "preview-chatdoc",
  },
  {
    id: "video",
    title: "一句话生成短视频",
    description: "把想法变成脚本、画面和配音，适合做第一版内容。",
    creator: "五花肉",
    category: "副业",
    moods: ["fun", "useful"],
    saves: 632,
    comments: 18,
    hotScore: 84,
    publishedAt: "2026-06-08T11:00:00+08:00",
    preview: "preview-runway",
  },
  {
    id: "resume",
    title: "AI 简历诊断",
    description: "找出弱点，给出可修改建议，适合求职前最后一轮打磨。",
    creator: "阿爽",
    category: "办公",
    moods: ["useful", "learn"],
    saves: 542,
    comments: 17,
    hotScore: 80,
    publishedAt: "2026-06-06T18:20:00+08:00",
    preview: "preview-resume",
  },
  {
    id: "story",
    title: "把照片变成绘本故事",
    description: "适合做礼物、做内容，也适合快速试一试 AI 表达。",
    creator: "Momo",
    category: "娱乐",
    moods: ["fun"],
    saves: 1203,
    comments: 57,
    hotScore: 89,
    publishedAt: "2026-06-07T14:05:00+08:00",
    preview: "preview-story",
  },
  {
    id: "invoice",
    title: "收据自动归档助手",
    description: "拍照后自动识别、归类和生成月度汇总，适合个体经营者。",
    creator: "小韩",
    category: "办公",
    moods: ["useful"],
    saves: 311,
    comments: 9,
    hotScore: 73,
    publishedAt: "2026-06-08T10:15:00+08:00",
    preview: "preview-chatdoc",
  },
  {
    id: "course",
    title: "拆解一个爆款产品页",
    description: "上传链接后自动给你做结构拆解，适合练产品感觉。",
    creator: "阿泽",
    category: "学习",
    moods: ["learn"],
    saves: 460,
    comments: 14,
    hotScore: 76,
    publishedAt: "2026-06-08T07:40:00+08:00",
    preview: "preview-recraft",
  },
  {
    id: "hook",
    title: "小红书标题起稿器",
    description: "按语气和人群生成多个标题方向，适合内容冷启动。",
    creator: "白桃",
    category: "副业",
    moods: ["fun", "useful"],
    saves: 688,
    comments: 26,
    hotScore: 82,
    publishedAt: "2026-06-07T10:50:00+08:00",
    preview: "preview-story",
  },
  {
    id: "script",
    title: "口播脚本加速器",
    description: "把碎想法整理成结构清楚的口播脚本，适合短视频和直播。",
    creator: "安安",
    category: "副业",
    moods: ["learn", "useful"],
    saves: 502,
    comments: 13,
    hotScore: 75,
    publishedAt: "2026-06-05T19:15:00+08:00",
    preview: "preview-runway",
  },
];

const curatedItems = [
  {
    title: "Recraft V3",
    description: "AI 矢量图形设计工具",
    preview: "preview-astria",
  },
  {
    title: "即梦 AI",
    description: "一站式 AI 创作平台",
    preview: "preview-chatdoc",
  },
  {
    title: "Runway",
    description: "视频生成工具",
    preview: "preview-story",
  },
];

const makers = [
  {
    name: "小舟",
    role: "产品体验者",
  },
  {
    name: "五花肉",
    role: "AI 工具探索者",
  },
  {
    name: "阿爽",
    role: "设计与 AI",
  },
  {
    name: "白桃",
    role: "内容实验者",
  },
];

const featuredTitle = document.querySelector("#featured-title");
const featuredDescription = document.querySelector("#featured-description");
const featuredCreator = document.querySelector("#featured-creator");
const featuredStats = document.querySelector("#featured-stats");
const featuredPreview = document.querySelector(".featured-preview");
const productGrid = document.querySelector("#product-grid");
const secondaryGrid = document.querySelector("#secondary-grid");
const curatedList = document.querySelector("#curated-list");
const makerList = document.querySelector("#maker-list");
const searchInput = document.querySelector("#search-input");

function formatPublishedAt(value) {
  const date = new Date(value);
  return `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function matchesState(product) {
  const query = state.query.trim().toLowerCase();
  const matchesMood =
    state.mood === "all" || product.moods.includes(state.mood);
  const matchesCategory =
    state.category === "all" || product.category === state.category;
  const haystack = `${product.title} ${product.description} ${product.creator} ${product.category}`.toLowerCase();
  const matchesQuery = !query || haystack.includes(query);
  return matchesMood && matchesCategory && matchesQuery;
}

function sortProducts(items) {
  if (state.sort === "new") {
    return [...items].sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt),
    );
  }

  return [...items].sort((a, b) => b.hotScore - a.hotScore);
}

function getVisibleProducts() {
  return sortProducts(products.filter(matchesState));
}

function updateFeatured(product) {
  featuredTitle.textContent = product.title;
  featuredDescription.textContent = product.shortDescription || product.description;
  featuredCreator.textContent = product.creator;
  featuredStats.textContent = `${product.players || "--"} 在玩 · 收藏 ${product.saves} · 评论 ${product.comments}`;
  featuredPreview.className = `featured-preview preview ${product.preview}`;
  featuredPreview.innerHTML = `
    <div class="preview-window">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <div class="preview-panel"></div>
    <div class="preview-band"></div>
  `;
}

function productCardMarkup(product) {
  const metaTail =
    state.sort === "new"
      ? `${formatPublishedAt(product.publishedAt)} 发布`
      : `${product.saves} 收藏 · ${product.comments} 评论`;

  return `
    <article class="product-card">
      <div class="preview ${product.preview}">
        <div class="preview-window">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="preview-panel"></div>
        <div class="preview-band"></div>
      </div>
      <div class="product-card-body">
        <h3>${product.title}</h3>
        <p>${product.description}</p>
        <div class="product-meta">
          <div class="creator-chip">
            <span class="creator-dot"></span>
            <span>${product.creator}</span>
          </div>
          <div class="product-stats">${metaTail}</div>
        </div>
      </div>
    </article>
  `;
}

function emptyStateMarkup(query) {
  const message = query
    ? `没有找到和“${query}”相关的产品，换个关键词会更快。`
    : "当前筛选下还没有结果，试试切换分栏或分类。";

  return `
    <article class="empty-state">
      <div>
        <strong>这一栏暂时空着</strong>
        <p>${message}</p>
      </div>
    </article>
  `;
}

function renderProducts() {
  const visibleProducts = getVisibleProducts();
  const featured = visibleProducts[0] || products[0];
  const gridItems = visibleProducts.slice(1);

  updateFeatured(featured);

  const primaryItems = gridItems.slice(0, 4);
  const secondaryItems = gridItems.slice(4);

  productGrid.innerHTML = primaryItems.length
    ? primaryItems.map(productCardMarkup).join("")
    : emptyStateMarkup(state.query.trim());

  secondaryGrid.innerHTML = secondaryItems.length
    ? secondaryItems.map(productCardMarkup).join("")
    : "";
}

function renderCurated() {
  curatedList.innerHTML = curatedItems
    .map(
      (item) => `
        <article class="mini-item">
          <div class="mini-item-main">
            <div class="mini-preview ${item.preview}"></div>
            <div>
              <h3>${item.title}</h3>
              <p>${item.description}</p>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderMakers() {
  makerList.innerHTML = makers
    .map(
      (maker) => `
        <article class="maker-item">
          <div class="maker-item-main">
            <div class="maker-avatar"></div>
            <div>
              <h3>${maker.name}</h3>
              <p>${maker.role}</p>
            </div>
          </div>
          <button class="follow-button">关注</button>
        </article>
      `,
    )
    .join("");
}

function bindTabs(selector, key) {
  document.querySelectorAll(selector).forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset[key];
      state[key] = value;

      document.querySelectorAll(selector).forEach((item) => {
        item.classList.toggle("active", item === button);
      });

      renderProducts();
    });
  });
}

bindTabs(".nav-pill", "mood");
bindTabs(".sort-pill", "sort");
bindTabs(".category-item", "category");

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderProducts();
});

renderCurated();
renderMakers();
renderProducts();
