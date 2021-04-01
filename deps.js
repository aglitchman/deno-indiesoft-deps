// Get a private repository .zip archive from GitLab if you know its Project ID.
// Requires:
// - env variable GITLAB_API_TOKEN

import { createHash } from "https://deno.land/std@0.91.0/hash/mod.ts";

function error(status, err) {
  return new Response(err, {
    status: status,
    headers: {
      "content-type": "text/plain; charset=UTF-8",
    },
  });
}

async function handleRequest(request) {
  const { pathname, searchParams } = new URL(request.url);

  if (pathname == "/") {
    return new Response(
      `<link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.0.4/tailwind.min.css" rel="stylesheet">
      <div class="px-3 py-3">
        <h2>Made with the awesomest <b><a href="https://deno.com/deploy/docs">Deno Deploy</a></b>.</h2>
      </div>`,
      {
        headers: {
          "content-type": "text/html; charset=UTF-8",
        },
      }
    );
  }

  let projectIdMatch = pathname.match(/\d+/g);
  if (!projectIdMatch) {
    return error(400, "No Project ID");
  }

  const id = projectIdMatch.pop();

  let sha = searchParams.get("sha") || "";
  if (sha) {
    sha = "?sha=" + encodeURIComponent(sha);
  }

  const token = Deno.env.get("GITLAB_API_TOKEN");
  if (!token) {
    return error(400, "Environment variable GITLAB_API_TOKEN is not set");
  }

  const archiveUrl = `https://gitlab.com/api/v4/projects/${id}/repository/archive.zip${sha}`;
  const archiveResp = await fetch(archiveUrl, {
    headers: {
      "PRIVATE-TOKEN": `${token}`,
    },
  });

  const contentType = archiveResp.headers.get("Content-Type") || "";
  if (contentType.indexOf("zip") < 0) {
    if (contentType.indexOf("json") > -1) {
      const json = JSON.stringify(await archiveResp.json());
      return error(500, `Something wrong (${archiveResp.status}): ${json}`);
    } else {
      return error(
        500,
        `Invalid response (${archiveResp.status}): ${contentType}`
      );
    }
  }

  const zip = await archiveResp.arrayBuffer();
  const etag =
    archiveResp.headers.get("ETag") ||
    '"' + createHash("sha1").update(zip).toString() + '"';
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
