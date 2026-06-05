const state = {
  currentPath: ".",
  selectedFile: null,
  selectedContent: "",
  mode: "view",
};

const refs = {
  refreshButton: document.querySelector("#refreshButton"),
  crumbs: document.querySelector("#crumbs"),
  folderCount: document.querySelector("#folderCount"),
  markdownCount: document.querySelector("#markdownCount"),
  folderList: document.querySelector("#folderList"),
  markdownList: document.querySelector("#markdownList"),
  fileType: document.querySelector("#fileType"),
  fileTitle: document.querySelector("#fileTitle"),
  filePath: document.querySelector("#filePath"),
  viewButton: document.querySelector("#viewButton"),
  editButton: document.querySelector("#editButton"),
  saveButton: document.querySelector("#saveButton"),
  status: document.querySelector("#status"),
  preview: document.querySelector("#preview"),
  editor: document.querySelector("#editor"),
  content: document.querySelector(".content"),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setStatus(message, isError = false) {
  refs.status.textContent = message;
  refs.status.classList.toggle("error", isError);
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }

  return data;
}

function button(label, className, onClick) {
  const node = document.createElement("button");
  node.type = "button";
  node.className = className;
  node.textContent = label;
  node.addEventListener("click", onClick);
  return node;
}

function renderEmpty(target, message) {
  target.replaceChildren();
  const node = document.createElement("div");
  node.className = "empty-state";
  node.textContent = message;
  target.append(node);
}

function renderCrumbs(currentPath) {
  refs.crumbs.replaceChildren();

  const parts = currentPath === "." ? [] : currentPath.split(/[\\/]/);
  refs.crumbs.append(button("root", "crumb", () => openFolder(".")));

  let nextPath = "";
  for (const part of parts) {
    nextPath = nextPath ? `${nextPath}/${part}` : part;
    refs.crumbs.append(button(part, "crumb", () => openFolder(nextPath)));
  }
}

function renderFolderList(directories) {
  refs.folderCount.textContent = directories.length;
  refs.folderList.replaceChildren();

  if (directories.length === 0) {
    renderEmpty(refs.folderList, "No child folders.");
    return;
  }

  for (const directory of directories) {
    const node = button(`Folder  ${directory.name}`, "nav-item", () => openFolder(directory.path));
    refs.folderList.append(node);
  }
}

function renderMarkdownList(markdownFiles) {
  refs.markdownCount.textContent = markdownFiles.length;
  refs.markdownList.replaceChildren();

  if (markdownFiles.length === 0) {
    renderEmpty(refs.markdownList, "No Markdown files.");
    return;
  }

  for (const file of markdownFiles) {
    const node = button(`MD  ${file.name}`, "nav-item", () => openMarkdown(file.path));
    node.dataset.path = file.path;
    node.classList.toggle("active", file.path === state.selectedFile);
    refs.markdownList.append(node);
  }
}

async function loadFolder(path, options = {}) {
  const { updateHash = true, updateHeader = true } = options;
  setStatus("Loading folder...");
  const data = await requestJson(`/api/scan?path=${encodeURIComponent(path)}`);

  state.currentPath = data.currentPath;
  if (updateHash) {
    window.location.hash = `folder=${encodeURIComponent(data.currentPath)}`;
  }
  renderCrumbs(data.currentPath);
  renderFolderList(data.directories);
  renderMarkdownList(data.markdownFiles);

  if (updateHeader) {
    refs.fileType.textContent = "Folder";
    refs.fileTitle.textContent = data.currentPath === "." ? "Project root" : data.currentPath;
    refs.filePath.textContent = data.root;
  }
  setStatus("");
}

async function openFolder(path) {
  state.selectedFile = null;
  await loadFolder(path);
  updateMode();
}

async function openMarkdown(path) {
  setStatus("Loading Markdown...");
  const data = await requestJson(`/api/file?path=${encodeURIComponent(path)}`);
  const parentPath = data.path.split(/[\\/]/).slice(0, -1).join("/") || ".";

  await loadFolder(parentPath, { updateHash: false, updateHeader: false });

  state.selectedFile = data.path;
  state.selectedContent = data.content;
  state.mode = "view";

  refs.fileType.textContent = "Markdown";
  refs.fileTitle.textContent = data.path.split(/[\\/]/).pop();
  refs.filePath.textContent = data.path;
  refs.editor.value = data.content;
  refs.preview.innerHTML = renderMarkdown(data.content);
  window.location.hash = `file=${encodeURIComponent(data.path)}`;
  updateMode();
  const active = refs.markdownList.querySelectorAll(".nav-item");
  for (const node of active) {
    node.classList.toggle("active", node.dataset.path === data.path);
  }
  setStatus("");
}

async function saveMarkdown() {
  if (!state.selectedFile) {
    return;
  }

  setStatus("Saving...");
  const data = await requestJson("/api/file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: state.selectedFile,
      content: refs.editor.value,
    }),
  });

  state.selectedContent = refs.editor.value;
  refs.preview.innerHTML = renderMarkdown(state.selectedContent);
  setStatus(`Saved ${data.path}.`);
}

function updateMode() {
  const isEditing = state.mode === "edit";
  refs.content.classList.toggle("is-editing", isEditing);
  refs.viewButton.setAttribute("aria-pressed", String(!isEditing));
  refs.editButton.setAttribute("aria-pressed", String(isEditing));
  refs.viewButton.disabled = !state.selectedFile;
  refs.editButton.disabled = !state.selectedFile;
  refs.saveButton.disabled = !state.selectedFile || !isEditing;
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderTable(lines) {
  const rows = lines.map((line) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => inlineMarkdown(cell.trim())),
  );
  const header = rows[0] || [];
  const body = rows.slice(2);

  return `<table><thead><tr>${header.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody>${body
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function renderMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let list = [];
  let code = [];
  let table = [];
  let inCode = false;

  const flushList = () => {
    if (list.length > 0) {
      html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
      list = [];
    }
  };

  const flushTable = () => {
    if (table.length > 0) {
      html.push(renderTable(table));
      table = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
      } else {
        flushList();
        flushTable();
      }
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      code.push(line);
      continue;
    }

    if (/^\|.+\|$/.test(line)) {
      flushList();
      table.push(line);
      continue;
    }

    flushTable();

    if (line.trim() === "") {
      flushList();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const listItem = /^[-*]\s+(.+)$/.exec(line);
    if (listItem) {
      list.push(listItem[1]);
      continue;
    }

    if (line.startsWith(">")) {
      flushList();
      html.push(`<blockquote>${inlineMarkdown(line.replace(/^>\s?/, ""))}</blockquote>`);
      continue;
    }

    flushList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  flushList();
  flushTable();

  if (inCode) {
    html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  }

  return html.join("");
}

function loadFromHash() {
  const hash = window.location.hash.slice(1);
  const [kind, encodedPath] = hash.split("=");
  const path = encodedPath ? decodeURIComponent(encodedPath) : ".";

  if (kind === "file") {
    openMarkdown(path).catch((error) => setStatus(error.message, true));
    return;
  }

  openFolder(path).catch((error) => setStatus(error.message, true));
}

refs.refreshButton.addEventListener("click", () => {
  openFolder(state.currentPath).catch((error) => setStatus(error.message, true));
});

refs.viewButton.addEventListener("click", () => {
  state.mode = "view";
  updateMode();
});

refs.editButton.addEventListener("click", () => {
  state.mode = "edit";
  updateMode();
});

refs.saveButton.addEventListener("click", () => {
  saveMarkdown().catch((error) => setStatus(error.message, true));
});

updateMode();
loadFromHash();
