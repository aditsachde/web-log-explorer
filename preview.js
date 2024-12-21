import select from "@inquirer/select";
import { exec } from "child_process";
import http from "http";
import { stderr, stdout } from "process";
import path from "path";
import fs from "fs";

const logUrl = await select({
  message: "Select a log",
  choices: [
    {
      name: "Andxor TLog",
      value: "https://tlog.andxor.it/",
    },
    {
      name: "Itko CT Log 2025",
      value: "https://ct2025.itko.dev/",
    },
    {
      name: "Armored Witness Firmware Prod",
      value:
        "https://api.transparency.dev/armored-witness-firmware/prod/log/1/",
    },
    {
      name: "Armored Witness Firmware Dev",
      value: "https://api.transparency.dev/armored-witness-firmware/ci/log/4/",
    },
    {
      name: "Armory Drive Log",
      value:
        "https://raw.githubusercontent.com/f-secure-foundry/armory-drive-log/master/log/",
    },
    {
      name: "LVFS",
      value: "https://fwupd.org/ftlog/lvfs/",
    },
  ],
});

// Create an HTTP server
const server = http.createServer(async (req, res) => {
  try {
    if (req.url === "/") {
      // Serve ./build/index.html for the root path
      const filePath = path.join("./", "build", "index.html");
      const content = fs.readFileSync(filePath);
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.end(content);
    } else {
      // Forward the request to the target URL using the fetch API
      const targetResponse = await fetch(logUrl + req.url, {
        method: req.method,
        headers: req.headers,
      });

      // Get the response body as text
      const innerbody = await targetResponse.arrayBuffer();
      const body = new Uint8Array(innerbody);

      // Set the response headers
      res.statusCode = targetResponse.status;
      res.setHeader(
        "Content-Type",
        targetResponse.headers.get("Content-Type") || "text/plain"
      );
      let lastModified = targetResponse.headers.get("Last-Modified");
      if (lastModified)
        res.setHeader("Last-Modified", lastModified );
      res.setHeader("Access-Control-Allow-Origin", "*");

      // Send the response body
      res.end(body);
    }
  } catch (error) {
    // Handle any errors that occur during the request
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end("Error occurred while processing the request.");
    console.error("Error:", error);
  }
});

// Listen on the specified port and hostname
const hostname = "localhost";
const port = 5174;
server.listen(port, hostname, () => {
  console.log(
    `Proxy server running at http://${hostname}:${port}/ to ${logUrl}`
  );
});

// Run the vite server
const command = `VITE_LOG_URL=http://${hostname}:${port}/ FORCE_COLOR=1 npm run dev`;
const child = exec(command);
child.stdout.pipe(stdout);
child.stderr.pipe(stderr);
child.on("error", (error) => {
  console.error("Error:", error);
});
