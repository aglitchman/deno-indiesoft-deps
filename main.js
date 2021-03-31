// Requires:
// - env variable GITLAB_API_TOKEN
async function handleRequest(request) {
  const { pathname, searchParams } = new URL(request.url);

  const projectIdMatch = pathname.match(/\d+/g);
  if (!projectIdMatch) {
    throw new Error("No Project ID");
  }

  const id = projectIdMatch[0];

  let sha = searchParams.get("sha") || "";
  if (sha) {
    sha = "?sha=" + encodeURIComponent(sha);
  }

  const token = Deno.env.get("GITLAB_API_TOKEN");
  if (!token) {
    throw new Error("Environment variable GITLAB_API_TOKEN is not set");
  }

  const archiveUrl = `https://gitlab.com/api/v4/projects/${id}/repository/archive.zip${sha}`;
  const archiveResp = await fetch(archiveUrl, {
    headers: {
      "PRIVATE-TOKEN": `${token}`,
    },
  });

  const contentType = archiveResp.headers.get("Content-Type") || "";
  if (contentType.indexOf("zip") < 0) {
    throw new Error(
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
