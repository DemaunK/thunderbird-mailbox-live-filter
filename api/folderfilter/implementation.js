"use strict";

var { ExtensionCommon } = ChromeUtils.importESModule
  ? ChromeUtils.importESModule("resource://gre/modules/ExtensionCommon.sys.mjs")
  : ChromeUtils.import("resource://gre/modules/ExtensionCommon.jsm");

let ExtensionSupport;
try {
  ({ ExtensionSupport } = ChromeUtils.importESModule(
    "resource:///modules/ExtensionSupport.sys.mjs"
  ));
} catch (e) {
  ({ ExtensionSupport } = ChromeUtils.import(
    "resource:///modules/ExtensionSupport.jsm"
  ));
}

const LISTENER_ID = "mailbox-live-filter-listener";
const XHTML_NS = "http://www.w3.org/1999/xhtml";
const BAR_ID = "mbfilter-bar";
const STYLE_ID = "mbfilter-style";

const CSS_TEXT = `
  #${BAR_ID} {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 5px 6px;
    border-bottom: 1px solid color-mix(in srgb, currentColor 14%, transparent);
    flex: 0 0 auto;
    box-sizing: border-box;
  }
  #mbfilter-input {
    flex: 1 1 auto;
    min-width: 0;
    height: 24px;
    padding: 2px 7px;
    font-size: 0.92em;
    border-radius: 4px;
    border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
    background-color: var(--layout-background-1, field);
    color: var(--layout-color-1, fieldtext);
    outline: none;
    box-sizing: border-box;
  }
  #mbfilter-input:focus {
    border-color: var(--color-accent-primary, AccentColor);
    box-shadow: 0 0 0 1px var(--color-accent-primary, AccentColor);
  }
  .mbfilter-btn {
    flex: 0 0 auto;
    height: 24px;
    min-width: 24px;
    padding: 0 4px;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 12px;
    line-height: 22px;
    opacity: 0.72;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .mbfilter-btn:hover {
    opacity: 1;
    background-color: color-mix(in srgb, currentColor 10%, transparent);
  }
  .mbfilter-btn[aria-pressed="true"] {
    opacity: 1;
    border-color: color-mix(in srgb, currentColor 30%, transparent);
    background-color: color-mix(in srgb, currentColor 14%, transparent);
  }
  #mbfilter-clear[hidden] {
    display: none;
  }
  #folderTree li.mbfilter-hidden {
    display: none !important;
  }
`;

// Храним ссылки для корректной очистки при выключении аддона
const windowCleanupMap = new Map();

function attachTo3Pane(about3PaneWin) {
  const doc = about3PaneWin?.document;
  if (!doc || doc.location?.href !== "about:3pane") {
    return;
  }
  if (doc.getElementById(BAR_ID)) {
    return;
  }

  const folderPane = doc.getElementById("folderPane");
  const folderTree = doc.getElementById("folderTree");
  if (!folderPane || !folderTree) {
    return;
  }

  const style = doc.createElementNS(XHTML_NS, "style");
  style.id = STYLE_ID;
  style.textContent = CSS_TEXT;
  doc.head.appendChild(style);

  const bar = doc.createElementNS(XHTML_NS, "div");
  bar.id = BAR_ID;

  const input = doc.createElementNS(XHTML_NS, "input");
  input.id = "mbfilter-input";
  input.type = "text";
  input.placeholder = "Фильтр ящиков...";
  input.setAttribute("aria-label", "Фильтр почтовых ящиков");
  input.autocomplete = "off";
  input.spellcheck = false;

  const subfolderBtn = doc.createElementNS(XHTML_NS, "button");
  subfolderBtn.id = "mbfilter-subfolders";
  subfolderBtn.type = "button";
  subfolderBtn.className = "mbfilter-btn";
  subfolderBtn.title = "Искать также внутри вложенных папок";
  subfolderBtn.setAttribute("aria-pressed", "false");
  subfolderBtn.textContent = "📁";

  const clearBtn = doc.createElementNS(XHTML_NS, "button");
  clearBtn.id = "mbfilter-clear";
  clearBtn.type = "button";
  clearBtn.className = "mbfilter-btn";
  clearBtn.title = "Очистить (Esc)";
  clearBtn.textContent = "✕";
  clearBtn.hidden = true;

  bar.appendChild(input);
  bar.appendChild(subfolderBtn);
  bar.appendChild(clearBtn);
  folderPane.insertBefore(bar, folderTree);

  function restoreExpanded() {
    for (const exp of folderTree.querySelectorAll('li[data-mbfilter-expanded="true"]')) {
      exp.classList.add("collapsed");
      exp.removeAttribute("data-mbfilter-expanded");
    }
  }

  function showSubtree(li) {
    li.classList.remove("mbfilter-hidden");
    for (const child of li.querySelectorAll('li[is="folder-tree-row"]')) {
      child.classList.remove("mbfilter-hidden");
    }
  }

  function getRowName(li) {
    const nameEl = li.querySelector(":scope > .container > .name");
    return (nameEl?.textContent || "").trim().toLowerCase();
  }

  function matchesTerms(text, terms) {
    return terms.every((t) => text.includes(t));
  }

  function filterRecursive(li, terms) {
    const selfMatch = matchesTerms(getRowName(li), terms);
    if (selfMatch) {
      showSubtree(li);
      return true;
    }

    const childUl = li.querySelector(":scope > ul");
    const childRows = childUl
      ? Array.from(childUl.children).filter((el) =>
          el.matches('li[is="folder-tree-row"]')
        )
      : [];

    let anyChildVisible = false;
    for (const child of childRows) {
      if (filterRecursive(child, terms)) {
        anyChildVisible = true;
      }
    }

    if (anyChildVisible) {
      li.classList.remove("mbfilter-hidden");
      if (li.classList.contains("collapsed")) {
        li.classList.remove("collapsed");
        li.setAttribute("data-mbfilter-expanded", "true");
      }
      return true;
    }

    li.classList.add("mbfilter-hidden");
    return false;
  }

  function getTopLevelRows() {
    // Верхнеуровневые строки внутри каждого режима (All Folders, Unified и т.д.)
    return Array.from(
      folderTree.querySelectorAll('li[is="folder-tree-row"]')
    ).filter((li) => !li.parentElement?.closest('li[is="folder-tree-row"]'));
  }

  function applyFilter() {
    const raw = input.value.trim().toLowerCase();
    const terms = raw ? raw.split(/\s+/).filter(Boolean) : [];

    restoreExpanded();

    if (terms.length === 0) {
      clearBtn.hidden = true;
      for (const li of folderTree.querySelectorAll("li.mbfilter-hidden")) {
        li.classList.remove("mbfilter-hidden");
      }
      return;
    }

    clearBtn.hidden = false;
    const includeSubfolders =
      subfolderBtn.getAttribute("aria-pressed") === "true";
    const topRows = getTopLevelRows();

    for (const row of topRows) {
      if (includeSubfolders) {
        filterRecursive(row, terms);
      } else {
        if (matchesTerms(getRowName(row), terms)) {
          showSubtree(row);
        } else {
          row.classList.add("mbfilter-hidden");
        }
      }
    }
  }

  input.addEventListener("input", applyFilter);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      if (input.value) {
        input.value = "";
        applyFilter();
      } else {
        folderTree.focus();
      }
    } else if (e.key === "Enter" || e.key === "ArrowDown") {
      const firstVisible = folderTree.querySelector(
        'li[is="folder-tree-row"]:not(.mbfilter-hidden)'
      );
      if (firstVisible) {
        e.preventDefault();
        firstVisible.querySelector(":scope > .container")?.click();
        folderTree.focus();
      }
    }
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    applyFilter();
    input.focus();
  });

  subfolderBtn.addEventListener("click", () => {
    const next = subfolderBtn.getAttribute("aria-pressed") !== "true";
    subfolderBtn.setAttribute("aria-pressed", next ? "true" : "false");
    applyFilter();
    input.focus();
  });

  // Если Thunderbird обновит дерево (добавится папка, сменится режим), повторяем фильтр
  let debounceTimer = null;
  const observer = new about3PaneWin.MutationObserver(() => {
    if (!input.value.trim()) {
      return;
    }
    about3PaneWin.clearTimeout(debounceTimer);
    debounceTimer = about3PaneWin.setTimeout(applyFilter, 60);
  });
  observer.observe(folderTree, { childList: true, subtree: true });

  // Сохраняем функцию очистки для этого документа
  const cleanupDoc = () => {
    observer.disconnect();
    about3PaneWin.clearTimeout(debounceTimer);
    restoreExpanded();
    for (const li of folderTree.querySelectorAll("li.mbfilter-hidden")) {
      li.classList.remove("mbfilter-hidden");
    }
    bar.remove();
    style.remove();
  };

  about3PaneWin._mbFilterCleanup = cleanupDoc;
}

function hookTab(tab, docCleanups) {
  if (!tab || tab.mode?.name !== "mail3PaneTab" || !tab.chromeBrowser) {
    return;
  }
  const browser = tab.chromeBrowser;

  const tryAttach = () => {
    const cWin = browser.contentWindow;
    if (
      cWin &&
      cWin.document?.readyState === "complete" &&
      cWin.location?.href === "about:3pane"
    ) {
      attachTo3Pane(cWin);
      if (cWin._mbFilterCleanup) {
        docCleanups.add(cWin);
      }
    }
  };

  tryAttach();

  const onLoad = () => tryAttach();
  browser.addEventListener("load", onLoad, { capture: true });
  return () => browser.removeEventListener("load", onLoad, { capture: true });
}

function setupMessengerWindow(win) {
  if (windowCleanupMap.has(win)) {
    return;
  }

  const unhookFns = new Set();
  const hooked3PaneWins = new Set();

  const attachTab = (tab) => {
    const unhook = hookTab(tab, hooked3PaneWins);
    if (unhook) {
      unhookFns.add(unhook);
    }
  };

  if (win.gTabmail) {
    for (const tab of win.gTabmail.tabInfo) {
      attachTab(tab);
    }
  }

  const tabMonitor = {
    onTabTitleChanged() {},
    onTabSwitched() {},
    onTabClosing() {},
    onTabPersist() {},
    onTabRestored() {},
    onTabOpened(tab) {
      attachTab(tab);
    },
  };

  win.gTabmail?.registerTabMonitor(tabMonitor);

  windowCleanupMap.set(win, () => {
    win.gTabmail?.unregisterTabMonitor(tabMonitor);
    for (const fn of unhookFns) {
      try {
        fn();
      } catch (e) {}
    }
    for (const cWin of hooked3PaneWins) {
      try {
        cWin._mbFilterCleanup?.();
        delete cWin._mbFilterCleanup;
      } catch (e) {}
    }
  });
}

var folderFilter = class extends ExtensionCommon.ExtensionAPI {
  #started = false;

  #ensureStarted() {
    if (this.#started) {
      return;
    }
    this.#started = true;

    ExtensionSupport.registerWindowListener(LISTENER_ID, {
      chromeURLs: ["chrome://messenger/content/messenger.xhtml"],
      onLoadWindow(win) {
        setupMessengerWindow(win);
      },
      onUnloadWindow(win) {
        const cleanup = windowCleanupMap.get(win);
        if (cleanup) {
          cleanup();
          windowCleanupMap.delete(win);
        }
      },
    });
  }

  onShutdown(isAppShutdown) {
    if (isAppShutdown) {
      return;
    }
    ExtensionSupport.unregisterWindowListener(LISTENER_ID);
    for (const cleanup of windowCleanupMap.values()) {
      try {
        cleanup();
      } catch (e) {}
    }
    windowCleanupMap.clear();
    this.#started = false;
    Services.obs.notifyObservers(null, "startupcache-invalidate");
  }

  getAPI() {
    const self = this;
    return {
      folderFilter: {
        async start() {
          self.#ensureStarted();
        },
        async focusFilter() {
          self.#ensureStarted();
          const win = Services.wm.getMostRecentWindow("mail:3pane");
          const about3PaneWin = win?.gTabmail?.currentAbout3Pane;
          if (!about3PaneWin) {
            return;
          }
          attachTo3Pane(about3PaneWin);
          const input = about3PaneWin.document.getElementById("mbfilter-input");
          if (input) {
            input.focus();
            input.select();
          }
        },
      },
    };
  }
};