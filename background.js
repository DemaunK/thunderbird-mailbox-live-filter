async function syncShortcut() {
  try {
    const cmds = await browser.commands.getAll();
    const cmd = cmds.find((c) => c.name === "focus-mailbox-filter");
    await browser.folderFilter.setShortcut(cmd?.shortcut || "");
  } catch (e) {}
}

browser.folderFilter.start().then(syncShortcut);

if (browser.commands.onChanged) {
  browser.commands.onChanged.addListener(syncShortcut);
}

browser.commands.onCommand.addListener((command) => {
  if (command === "focus-mailbox-filter") {
    browser.folderFilter.focusFilter();
  }
});