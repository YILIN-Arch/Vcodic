const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=60",
};

const PUBLIC_FIELDS = [
  "id",
  "product_name",
  "product_url",
  "tagline",
  "description",
  "creator_name",
  "published_at",
  "created_at",
].join(",");

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

async function supabaseFetch(env, path) {
  const supabaseUrl = getRequiredEnv(env, "SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv(env, "SUPABASE_SERVICE_ROLE_KEY");

  return fetch(`${supabaseUrl}${path}`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
    },
  });
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
    params.set("select", PUBLIC_FIELDS);
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

    return json({
      items,
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
