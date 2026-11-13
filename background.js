browser.folderFilter.start();

browser.commands.onCommand.addListener((command) => {
  if (command === "focus-mailbox-filter") {
    browser.folderFilter.focusFilter();
  }
});