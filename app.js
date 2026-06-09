async function fetchText(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load ${path}`);
  }
  return response.text();
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderInline(text) {
  let result = escapeHtml(text);
  result = result.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*(.*?)\*/g, "<em>$1</em>");
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return result;
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let html = "";
  let inCodeBlock = false;
  let codeLines = [];
  let inList = false;
  let listType = "ul";

  function flushList() {
    if (inList) {
      html += `</${listType}>`;
      inList = false;
    }
  }

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        html += `<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`;
        inCodeBlock = false;
        codeLines = [];
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      html += `<h${level}>${renderInline(headingMatch[2])}</h${level}>`;
      continue;
    }

    const listMatch = line.match(/^[-*]\s+(.*)$/);
    if (listMatch) {
      if (!inList || listType !== "ul") {
        flushList();
        html += "<ul>";
        inList = true;
        listType = "ul";
      }
      html += `<li>${renderInline(listMatch[1])}</li>`;
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      if (!inList || listType !== "ol") {
        flushList();
        html += "<ol>";
        inList = true;
        listType = "ol";
      }
      html += `<li>${renderInline(orderedMatch[1])}</li>`;
      continue;
    }

    flushList();
    html += `<p>${renderInline(line)}</p>`;
  }

  flushList();
  return html;
}

let topicsData = [];
let currentSlug = "";
let currentFileName = "";
let currentFileHandle = null;
let isDarkMode = false;
let assistantState = {
  mode: "local-claude",
  messages: [],
};

function setActivePaste(slug) {
  document.querySelectorAll(".paste-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.slug === slug);
  });
}

function setEditorMode(isEditing) {
  const editorShell = document.getElementById("editor-shell");
  const previewPanel = document.getElementById("readme-panel");
  const toggleButton = document.getElementById("edit-toggle");

  if (!editorShell || !previewPanel || !toggleButton) {
    return;
  }

  editorShell.classList.toggle("hidden", !isEditing);
  previewPanel.classList.toggle("hidden", isEditing);
  toggleButton.textContent = isEditing ? "Preview" : "Edit";
}

function applyTheme(dark) {
  isDarkMode = dark;
  document.body.classList.toggle("theme-dark", dark);
  const themeButton = document.getElementById("theme-toggle");
  if (themeButton) {
    themeButton.textContent = dark ? "Light mode" : "Dark mode";
  }
  localStorage.setItem("libr4ry-theme", dark ? "dark" : "light");
}

function showSaveStatus(message, isError = false) {
  const status = document.getElementById("save-status");
  if (!status) {
    return;
  }
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function getAssistantContext() {
  const editor = document.getElementById("editor-area");
  const preview = document.getElementById("readme-panel");
  const noteText = editor && editor.value ? editor.value : preview ? preview.textContent : "";
  return `Current paste: ${currentFileName || "Untitled"}\n\n${noteText}`;
}

function renderAssistantMessages() {
  const container = document.getElementById("assistant-messages");
  if (!container) {
    return;
  }

  container.innerHTML = assistantState.messages
    .map((message) => {
      const isUser = message.role === "user";
      const insertButton = message.role === "assistant"
        ? `<button class="assistant-insert" data-message="${message.id}">Insert into note</button>`
        : "";
      return `
        <div class="assistant-message ${isUser ? "user" : "assistant"}">
          <div class="assistant-bubble">${escapeHtml(message.text).replace(/\n/g, "<br />")}</div>
          ${insertButton}
        </div>
      `;
    })
    .join("");

  container.querySelectorAll(".assistant-insert").forEach((button) => {
    button.addEventListener("click", () => {
      const message = assistantState.messages.find((entry) => entry.id === button.dataset.message);
      if (message) {
        insertAssistantText(message.text);
      }
    });
  });
}

function pushAssistantMessage(role, text) {
  assistantState.messages.push({ id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`, role, text });
  renderAssistantMessages();
}

function setAssistantStatus(message, isError = false) {
  const status = document.getElementById("assistant-status");
  if (!status) {
    return;
  }
  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function insertAssistantText(text) {
  const editor = document.getElementById("editor-area");
  if (!editor) {
    return;
  }

  const nextValue = (text || "").trim();
  if (!nextValue) {
    return;
  }

  const existingValue = (editor.value || "").trim();
  editor.value = existingValue ? `${existingValue}\n\n${nextValue}` : nextValue;
  setEditorMode(true);
  showSaveStatus("Inserted assistant suggestion into the current note.");
}

function getLocalFallbackReply(prompt, context) {
  const noteText = context || "";
  if (!prompt) {
    return "I’m ready to help with your note. I can answer questions, summarize it, or turn it into a cleaner markdown draft.";
  }

  if (prompt.toLowerCase().includes("summar") || prompt.toLowerCase().includes("resumo")) {
    return `Summary idea:\n- ${noteText.split(/\n/).map((line) => line.trim()).filter(Boolean).slice(0, 3).join("\n- ") || "Your note is still empty."}`;
  }

  if (prompt.toLowerCase().includes("bullet") || prompt.toLowerCase().includes("lista")) {
    return `Bullet points:\n- ${noteText.split(/\n/).map((line) => line.trim()).filter(Boolean).slice(0, 5).join("\n- ") || "Add your main ideas here."}`;
  }

  return `Local Claude mode is active. I can answer your questions, summarize the note, and edit or expand the current markdown for you.\n\nTry: summarize this note, explain this section, or improve this draft.`;
}

async function connectAssistant() {
  assistantState.mode = "local-claude";
  localStorage.setItem("libr4ry-assistant-mode", assistantState.mode);
  setAssistantStatus("Connected in local Claude mode.");
  if (!assistantState.messages.some((message) => message.role === "assistant" && message.text.includes("I’m ready"))) {
    pushAssistantMessage("assistant", "I’m ready to help with your note. I can answer questions, summarize it, or turn it into a cleaner markdown draft.");
  }
}

async function sendAssistantMessage() {
  const input = document.getElementById("assistant-input");
  if (!input) {
    return;
  }

  const prompt = input.value.trim();
  if (!prompt) {
    setAssistantStatus("Write a prompt to ask the assistant.", true);
    return;
  }

  pushAssistantMessage("user", prompt);
  input.value = "";
  setAssistantStatus("Thinking…");

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: assistantState.mode,
        prompt,
        context: getAssistantContext(),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "The assistant could not respond.");
    }

    const replyText = data.text || "No response returned.";
    pushAssistantMessage("assistant", replyText);

    if (data.action === "insert" && data.markdown) {
      insertAssistantText(data.markdown);
      setAssistantStatus("Inserted into the current note.");
    } else {
      setAssistantStatus("Assistant replied.");
    }
  } catch (error) {
    const fallbackText = getLocalFallbackReply(prompt, getAssistantContext());
    pushAssistantMessage("assistant", fallbackText);
    setAssistantStatus("Local assistant replied with a fallback answer.");
  }
}

async function saveCurrentContent() {
  const editor = document.getElementById("editor-area");
  const saveButton = document.getElementById("save-note");

  if (!editor || !saveButton) {
    return;
  }

  const text = editor.value;
  const safeName = currentFileName || "note.md";

  try {
    if (window.showSaveFilePicker && !currentFileHandle) {
      currentFileHandle = await window.showSaveFilePicker({
        suggestedName: safeName,
        types: [
          {
            description: "Markdown files",
            accept: { "text/markdown": [".md"] },
          },
        ],
      });
    }

    if (!currentFileHandle) {
      throw new Error("File selection was canceled.");
    }

    const writable = await currentFileHandle.createWritable();
    await writable.write(text);
    await writable.close();
    saveButton.disabled = false;
    showSaveStatus(`Saved to ${currentFileName || "selected file"}.`);
  } catch (error) {
    const fallbackName = safeName || "note.md";
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fallbackName;
    link.click();
    URL.revokeObjectURL(url);
    showSaveStatus("Saved as a download because file writing was not available in this browser.", true);
  }
}

async function loadTopics() {
  topicsData = JSON.parse(await fetchText("topics.json"));
  const container = document.getElementById("paste-list");

  if (!container) {
    return;
  }

  const grouped = topicsData.reduce((acc, topic) => {
    const folder = topic.folder || "General";
    const subfolder = topic.subfolder || "";
    const groupKey = subfolder ? `${folder}::${subfolder}` : folder;
    const label = subfolder ? `${folder} / ${subfolder}` : folder;

    if (!acc[groupKey]) {
      acc[groupKey] = { label, items: [] };
    }

    acc[groupKey].items.push(topic);
    return acc;
  }, {});

  container.innerHTML = Object.values(grouped)
    .map(
      (group) => `
        <div class="folder-group">
          <div class="folder-label">📁 ${group.label}</div>
          <div class="folder-items">
            ${group.items
              .map(
                (topic) => `
                  <button class="paste-item" data-slug="${topic.slug}">
                    ${topic.icon || "📄"} ${topic.file.split("/").pop()}
                  </button>
                `
              )
              .join("")}
          </div>
        </div>
      `
    )
    .join("");

  container.querySelectorAll(".paste-item").forEach((button) => {
    button.addEventListener("click", () => {
      loadTopicContent(button.dataset.slug);
    });
  });
}

async function loadReadme() {
  const container = document.getElementById("readme-panel");
  const editor = document.getElementById("editor-area");
  const saveButton = document.getElementById("save-note");
  if (!container) {
    return;
  }

  const markdown = await fetchText("README.md");
  container.innerHTML = renderMarkdown(markdown);
  if (editor) {
    editor.value = markdown;
  }
  if (saveButton) {
    saveButton.disabled = true;
  }
  currentSlug = "";
  currentFileName = "README.md";
  currentFileHandle = null;
  setEditorMode(false);
}

async function loadTopicContent(slug) {
  const container = document.getElementById("readme-panel");

  if (!container) {
    return;
  }

  const topic = topicsData.find((entry) => entry.slug === slug);
  const editor = document.getElementById("editor-area");
  const saveButton = document.getElementById("save-note");

  if (!topic) {
    container.innerHTML = "<p>This paste does not exist yet.</p>";
    setActivePaste("");
    return;
  }

  const markdown = await fetchText(topic.file);
  container.innerHTML = renderMarkdown(markdown);
  if (editor) {
    editor.value = markdown;
  }
  if (saveButton) {
    saveButton.disabled = false;
  }
  currentSlug = slug;
  currentFileName = topic.file.split("/").pop();
  currentFileHandle = null;
  setActivePaste(slug);
  setEditorMode(false);
}

(async function init() {
  const editToggle = document.getElementById("edit-toggle");
  const saveButton = document.getElementById("save-note");
  const themeButton = document.getElementById("theme-toggle");
  const connectButton = document.getElementById("connect-ai");
  const sendButton = document.getElementById("assistant-send");

  if (editToggle) {
    editToggle.addEventListener("click", () => {
      const editorShell = document.getElementById("editor-shell");
      const isEditing = editorShell ? editorShell.classList.contains("hidden") : false;
      setEditorMode(!isEditing);
    });
  }

  if (saveButton) {
    saveButton.addEventListener("click", saveCurrentContent);
  }

  if (themeButton) {
    themeButton.addEventListener("click", () => applyTheme(!isDarkMode));
  }

  if (connectButton) {
    connectButton.addEventListener("click", connectAssistant);
  }

  if (sendButton) {
    sendButton.addEventListener("click", sendAssistantMessage);
  }

  const assistantInput = document.getElementById("assistant-input");
  if (assistantInput) {
    assistantInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        sendAssistantMessage();
      }
    });
  }

  const savedMode = localStorage.getItem("libr4ry-assistant-mode") || "local-claude";
  assistantState.mode = savedMode;

  const savedTheme = localStorage.getItem("libr4ry-theme") === "dark";
  applyTheme(savedTheme);

  if (document.getElementById("paste-list")) {
    await loadTopics();
    await loadReadme();
  }

  await connectAssistant();
})();
