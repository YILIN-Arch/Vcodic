const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const REVIEW_FIELDS = [
  "id",
  "product_name",
  "product_url",
  "tagline",
  "description",
  "creator_name",
  "contact_email",
  "screenshot_path",
  "status",
  "review_notes",
  "created_at",
  "reviewed_at",
  "published_at",
].join(",");

const VALID_STATUSES = new Set(["pending", "approved", "rejected"]);

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

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function authorize(request, env) {
  const expectedToken = getRequiredEnv(env, "VCODIC_REVIEW_TOKEN");
  const incomingToken = request.headers.get("x-review-token");

  return Boolean(incomingToken && incomingToken === expectedToken);
}

async function supabaseFetch(env, path, init = {}) {
  const supabaseUrl = getRequiredEnv(env, "SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv(env, "SUPABASE_SERVICE_ROLE_KEY");

  const headers = new Headers(init.headers || {});
  headers.set("apikey", serviceRoleKey);
  headers.set("Authorization", `Bearer ${serviceRoleKey}`);

  return fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers,
  });
}

async function handleList(request, env) {
  const url = new URL(request.url);
  const requestedStatus = (url.searchParams.get("status") || "pending").trim();
  const status = VALID_STATUSES.has(requestedStatus) ? requestedStatus : "pending";
  const params = new URLSearchParams();

  params.set("select", REVIEW_FIELDS);
  params.set("status", `eq.${status}`);
  params.set("order", "created_at.desc");
  params.set("limit", "50");

  const response = await supabaseFetch(
    env,
    `/rest/v1/submissions?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    return json(
      {
        error: "审核列表读取失败",
        details: text,
      },
      502,
    );
  }

  const items = await response.json();
  return json({ items, status });
}

async function handleUpdate(request, env) {
  const payload = await request.json();
  const id = typeof payload.id === "string" ? payload.id.trim() : "";
  const nextStatus = typeof payload.status === "string" ? payload.status.trim() : "";
  const reviewNotes =
    typeof payload.reviewNotes === "string" ? payload.reviewNotes.trim() : "";

  if (!isUuid(id)) {
    return json({ error: "无效的投稿 ID。" }, 400);
  }

  if (!VALID_STATUSES.has(nextStatus)) {
    return json({ error: "无效的审核状态。" }, 400);
  }

  const now = new Date().toISOString();
  const updatePayload = {
    status: nextStatus,
    review_notes: reviewNotes || null,
  };

  if (nextStatus === "pending") {
    updatePayload.reviewed_at = null;
    updatePayload.published_at = null;
  } else if (nextStatus === "approved") {
    updatePayload.reviewed_at = now;
    updatePayload.published_at = now;
  } else {
    updatePayload.reviewed_at = now;
    updatePayload.published_at = null;
  }

  const params = new URLSearchParams();
  params.set("id", `eq.${id}`);
  params.set("select", REVIEW_FIELDS);

  const response = await supabaseFetch(
    env,
    `/rest/v1/submissions?${params.toString()}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation",
        Accept: "application/json",
      },
      body: JSON.stringify(updatePayload),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    return json(
      {
        error: "审核更新失败",
        details: text,
      },
      502,
    );
  }

  const items = await response.json();
  return json({
    item: items[0] || null,
  });
}

export async function onRequest(context) {
  try {
    if (!authorize(context.request, context.env)) {
      return json({ error: "未授权" }, 401);
    }

    if (context.request.method === "GET") {
      return handleList(context.request, context.env);
    }

    if (context.request.method === "POST") {
      return handleUpdate(context.request, context.env);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (error) {
    return json(
      {
        error: error.message || "审核接口异常",
      },
      500,
    );
  }
}
