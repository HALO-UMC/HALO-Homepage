import { getConfiguration } from "./kiri-preregister.js";

function sendStatus(response, payload) {
  response.statusCode = 200;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "public, max-age=0, s-maxage=30, stale-while-revalidate=120");
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.end(JSON.stringify(payload));
}

function publicPolicy(configuration) {
  if (!configuration) {
    return null;
  }

  return {
    dataControllerName: configuration.dataControllerName,
    retentionLabel: configuration.retentionLabel,
    policyVersion: configuration.policyVersion,
  };
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.statusCode = 405;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    return response.end(
      JSON.stringify({
        ready: false,
        message: "지원하지 않는 요청 방식입니다.",
      }),
    );
  }

  const configuration = getConfiguration();
  if (!configuration) {
    return sendStatus(response, {
      ready: false,
      reason: "configuration",
      policy: null,
    });
  }

  let storageResponse;
  try {
    const query = new URL(
      `${configuration.supabaseUrl}/rest/v1/${configuration.table}`,
    );
    query.searchParams.set("select", "id");
    query.searchParams.set("limit", "0");

    storageResponse = await fetch(query, {
      method: "GET",
      headers: {
        apikey: configuration.serviceRoleKey,
        Authorization: `Bearer ${configuration.serviceRoleKey}`,
        Accept: "application/json",
      },
    });
  } catch {
    return sendStatus(response, {
      ready: false,
      reason: "storage",
      policy: publicPolicy(configuration),
    });
  }

  if (!storageResponse.ok) {
    const storageResult = await storageResponse.json().catch(() => null);
    console.error("KIRI preregistration readiness error", {
      status: storageResponse.status,
      code: storageResult?.code || "unknown",
    });

    return sendStatus(response, {
      ready: false,
      reason: "storage",
      policy: publicPolicy(configuration),
    });
  }

  return sendStatus(response, {
    ready: true,
    reason: null,
    policy: publicPolicy(configuration),
  });
}
