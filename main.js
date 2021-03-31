// Requires:
// - env variable GITLAB_API_TOKEN
function error(status, err) {
  return new Response(err, {
    status: status,
    headers: {
      "content-type": "text/plain",
    },
  });
}

async function handleRequest(request) {
  const { pathname, searchParams } = new URL(request.url);

  const projectIdMatch = pathname.match(/\d+/g);
  if (!projectIdMatch) {
    return error("No Project ID");
  }

  const id = projectIdMatch[0];

  let sha = searchParams.get("sha") || "";
  if (sha) {
    sha = "?sha=" + encodeURIComponent(sha);
  }

  const token = Deno.env.get("GITLAB_API_TOKEN");
  if (!token) {
    return error("Environment variable GITLAB_API_TOKEN is not set");
  }

  const archiveUrl = `https://gitlab.com/api/v4/projects/${id}/repository/archive.zip${sha}`;
  const archiveResp = await fetch(archiveUrl, {
    headers: {
      "PRIVATE-TOKEN": `${token}`,
    },
  });

  const contentType = archiveResp.headers.get("Content-Type") || "";
  if (contentType.indexOf("zip") < 0) {
    return error(
      `Invalid GitLab response ${archiveResp.status}, ${contentType}`
    );
  }

  const zip = await archiveResp.buffer();
  const etag =
    archiveResp.headers.get("ETag") ||
    '"' + crypto.createHash("sha1").update(zip).digest("hex") + '"';
  return new Response(zip, {
    headers: {
      "content-type": "application/zip",
      ETag: etag,
    },
  });
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
