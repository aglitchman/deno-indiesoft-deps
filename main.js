function str2ab(str) {
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

async function handleRequest(request) {
  const { pathname } = new URL(request.url);

  const buf = str2ab(JSON.stringify({
    message: "Hello from Deno Deploy",
  }));

  return new Response(buf, {
    headers: {
      "content-type": "application/zip",
    },
  });
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

/*
// Requires:
// - env variable GITLAB_API_TOKEN
exports.handler = async function(event, context) {
  try {
    if (event.httpMethod !== "GET") {
      console.log("Only GET allowed.")
      return { statusCode: 405, body: "Method Not Allowed" }
    }

    const id = event.queryStringParameters.id | 0
    if (!id) {
      console.log("Bad Request.")
      return { statusCode: 400, body: "Bad Request" }
    }

    let sha = event.queryStringParameters.sha || ""
    if (sha) {
      sha = "?sha=" + encodeURIComponent(sha)
    }

    const requestUrl = `https://gitlab.com/api/v4/projects/${id}/repository/archive.zip${sha}`
    const response = await fetch(requestUrl, {
      headers: {
        "PRIVATE-TOKEN": `${process.env.GITLAB_API_TOKEN}`,
      },
    })

    // Debug:
    // for (var pair of response.headers.entries()) {
    //   console.log("Resp header " + pair[0]+ ': '+ pair[1])
    // }

    const contentType = response.headers.get("Content-Type") || ""
    if (contentType.indexOf("zip") < 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: `Invalid GitLab response ${response.status}, ${contentType}` }),
      }
    }

    const zip = await response.buffer()
    const etag = response.headers.get("ETag") || ('"' + crypto.createHash("sha1").update(zip).digest("hex") + '"')
    return {
      statusCode: 200,
      headers: {
        "Content-type": "application/zip",
        "ETag": etag,
      },
      body: zip.toString("base64"),
      isBase64Encoded: true,
    }
  } catch (err) {
    console.log(err) // output to netlify function log

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}*/
