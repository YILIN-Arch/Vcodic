const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=60",
};

const QUERY_FIELDS = [
  "id",
  "product_name",
  "product_url",
  "tagline",
  "description",
  "creator_name",
  "screenshot_path",
  "published_at",
  "created_at",
].join(",");

const SCREENSHOT_BUCKET = "submission-images";
const SCREENSHOT_URL_TTL_SECONDS = 3600;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}

function getRequiredEnv(env, key) {
  const value = env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function normalizeBaseUrl(value) {
  return value.replace(/\/+$/, "");
}

async function supabaseFetch(env, path) {
  const supabaseUrl = normalizeBaseUrl(getRequiredEnv(env, "SUPABASE_URL"));
  const serviceRoleKey = getRequiredEnv(env, "SUPABASE_SERVICE_ROLE_KEY");

  return fetch(`${supabaseUrl}${path}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
    },
  });
}

async function supabaseStorageFetch(env, path, body) {
  const supabaseUrl = normalizeBaseUrl(getRequiredEnv(env, "SUPABASE_URL"));
  const serviceRoleKey = getRequiredEnv(env, "SUPABASE_SERVICE_ROLE_KEY");

  return fetch(`${supabaseUrl}/storage/v1${path}`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function signScreenshotUrls(env, items) {
  const paths = [...new Set(items.map((item) => item.screenshot_path).filter(Boolean))];

  if (!paths.length) {
    return new Map();
  }

  const response = await supabaseStorageFetch(env, `/object/sign/${SCREENSHOT_BUCKET}`, {
    paths,
    expiresIn: SCREENSHOT_URL_TTL_SECONDS,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "截图签名失败");
  }

  const signedItems = await response.json();
  const baseUrl = `${normalizeBaseUrl(getRequiredEnv(env, "SUPABASE_URL"))}/storage/v1`;
  const signedUrlByPath = new Map();

  for (const item of Array.isArray(signedItems) ? signedItems : []) {
    const path = item?.path;
    const signedPath = item?.signedURL || item?.signedUrl || null;

    if (!path || !signedPath) {
      continue;
    }

    signedUrlByPath.set(path, `${baseUrl}${signedPath}`);
  }

  return signedUrlByPath;
}

function toPublicItem(item, signedUrlByPath) {
  return {
    id: item.id,
    product_name: item.product_name,
    product_url: item.product_url,
    tagline: item.tagline,
    description: item.description,
    creator_name: item.creator_name,
    screenshot_url: item.screenshot_path ? signedUrlByPath.get(item.screenshot_path) || null : null,
    published_at: item.published_at,
    created_at: item.created_at,
  };
}

export async function onRequestGet(context) {
  try {
    if (!context.env.SUPABASE_URL || !context.env.SUPABASE_SERVICE_ROLE_KEY) {
      return json({
        items: [],
        degraded: true,
      });
    }

    const params = new URLSearchParams();
    params.set("select", QUERY_FIELDS);
    params.set("status", "eq.approved");
    params.set("order", "published_at.desc.nullslast,created_at.desc");
    params.set("limit", "24");

    const response = await supabaseFetch(
      context.env,
      `/rest/v1/submissions?${params.toString()}`,
    );

    if (!response.ok) {
      const text = await response.text();
      return json(
        {
          error: "公开内容读取失败",
          details: text,
        },
        502,
      );
    }

    const items = await response.json();
    const rows = Array.isArray(items) ? items : [];
    let signedUrlByPath = new Map();

    try {
      signedUrlByPath = await signScreenshotUrls(context.env, rows);
    } catch (error) {
      signedUrlByPath = new Map();
    }

    return json({
      items: rows.map((item) => toPublicItem(item, signedUrlByPath)),
    });
  } catch (error) {
    return json(
      {
        error: error.message || "公开内容接口异常",
      },
      500,
    );
  }
}
