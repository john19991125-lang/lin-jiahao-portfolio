(() => {
  const storageKey = "jiahao-portfolio-text-draft-v2";
  const toggle = document.getElementById("edit-toggle");
  const toolbar = document.getElementById("edit-toolbar");
  const status = document.getElementById("edit-status");
  const blocked = "script, style, noscript, textarea, option, #edit-toolbar, #edit-toggle, #edit-status, .photo-dialog, .video-dialog, .scroll-progress, [aria-hidden='true']";
  const textNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent.trim() || node.parentElement?.closest(blocked)) return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.closest(".photo-card-count, .filter span")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  function nodePath(node) {
    const segments = [];
    let current = node;
    while (current && current !== document.body) {
      const parent = current.parentNode;
      segments.unshift(Array.prototype.indexOf.call(parent.childNodes, current));
      current = parent;
    }
    return segments.join(".");
  }

  function groupFor(node) {
    const parent = node.parentElement;
    if (parent.closest("#brand-name, #hero-name, #footer-name")) return "name";
    if (parent.closest("#hero-email-value")) return "email";
    if (parent.closest("#hero-phone-value")) return "phone";
    const card = parent.closest(".photo-card[data-series-id]");
    if (card && parent.closest(".photo-card-title")) return `series-title:${card.dataset.seriesId}`;
    if (card && parent.closest(".photo-card-kind")) return `series-kind:${card.dataset.seriesId}`;
    return "";
  }

  const candidates = textNodes.map((node) => ({ node, key: nodePath(node), group: groupFor(node), original: node.textContent }));
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch { saved = {}; }
  const entries = candidates.map(({ node, key, group, original }) => {
    const span = document.createElement("span");
    span.className = "editable-word";
    span.dataset.editKey = key;
    if (group) span.dataset.editGroup = group;
    span.textContent = Object.prototype.hasOwnProperty.call(saved, key) ? saved[key] : original;
    node.replaceWith(span);
    return { span, key, original };
  });

  function updateSeries(group, value) {
    const [field, id] = group.split(":");
    if (!id) return;
    const series = window.PORTFOLIO_CONTENT.photoSeries.find((item) => item.id === id);
    if (!series) return;
    if (field === "series-title") {
      series.title = value;
      for (const card of document.querySelectorAll(`.photo-card[data-series-id="${id}"]`)) {
        card.setAttribute("aria-label", `放大${value}第 ${card.dataset.photoIndex} 張照片`);
      }
    }
    if (field === "series-kind") series.kind = value;
  }
  for (const { span, key, original } of entries) {
    if (span.dataset.editGroup?.startsWith("series-") && Object.prototype.hasOwnProperty.call(saved, key) && saved[key] !== original) {
      updateSeries(span.dataset.editGroup, span.textContent);
    }
  }

  let editing = false;
  let noticeTimer;
  function notify(message) {
    status.textContent = message;
    status.classList.add("is-visible");
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => status.classList.remove("is-visible"), 3600);
  }
  function updateLinks() {
    const email = document.getElementById("hero-email-value")?.textContent.trim() || "";
    const phone = document.getElementById("hero-phone-value")?.textContent.trim() || "";
    document.getElementById("hero-email").href = `mailto:${email}`;
    document.getElementById("hero-phone").href = `tel:${phone.replace(/[^+\d]/g, "")}`;
  }
  updateLinks();

  function setEditing(active) {
    editing = active;
    document.body.classList.toggle("text-editing", active);
    toggle.hidden = active;
    toolbar.hidden = !active;
    toggle.setAttribute("aria-expanded", String(active));
    for (const { span } of entries) {
      if (active) span.setAttribute("contenteditable", "plaintext-only");
      else span.removeAttribute("contenteditable");
    }
    if (active) notify("點選文字修改；儲存後會保留在目前瀏覽器。");
  }

  function saveDraft() {
    const changes = {};
    for (const { span, key, original } of entries) {
      if (span.textContent !== original) changes[key] = span.textContent;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify(changes));
      updateLinks();
      notify("已儲存到目前瀏覽器。下載修改檔可交給我發佈到網站。");
      return changes;
    } catch {
      notify("此瀏覽器無法儲存草稿，請下載修改檔備份。");
      return changes;
    }
  }

  toggle.addEventListener("pointerdown", (event) => { event.preventDefault(); setEditing(true); });
  toggle.addEventListener("click", () => setEditing(true));
  document.getElementById("edit-save").addEventListener("click", saveDraft);
  document.getElementById("edit-cancel").addEventListener("click", () => { saveDraft(); setEditing(false); });
  document.getElementById("edit-export").addEventListener("click", () => {
    const changes = saveDraft();
    const file = new Blob([JSON.stringify({ format: "jiahao-portfolio-text-edits-v2", changes }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "林嘉豪網站文字修改.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  document.addEventListener("click", (event) => {
    if (!editing || event.target.closest("#edit-toolbar, #edit-toggle")) return;
    if (event.target.closest("a, button")) { event.preventDefault(); event.stopPropagation(); }
  }, true);
  document.addEventListener("input", (event) => {
    if (!editing) return;
    const target = event.target.closest(".editable-word[data-edit-group]");
    if (!target) return;
    for (const other of document.querySelectorAll(`.editable-word[data-edit-group="${target.dataset.editGroup}"]`)) {
      if (other !== target) other.textContent = target.textContent;
    }
    if (target.dataset.editGroup === "email" || target.dataset.editGroup === "phone") updateLinks();
    if (target.dataset.editGroup.startsWith("series-")) updateSeries(target.dataset.editGroup, target.textContent);
  });
  document.addEventListener("paste", (event) => {
    if (!editing || !event.target.closest(".editable-word")) return;
    event.preventDefault();
    document.execCommand("insertText", false, event.clipboardData.getData("text/plain"));
  });
})();
