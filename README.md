# Mailbox Live Filter for Thunderbird

[English](#english) | [Русский](#русский)

---

## English

A lightweight Thunderbird add-on that adds a **live filter input directly to the Left Folder Pane** (above the folder tree). Start typing a mailbox name — matching accounts stay visible while everything else is hidden in real time.

### Features
- **Instant filtering:** Filters mailboxes as you type (supports multiple space-separated keywords, e.g. `work gmail`).
- **Subfolder mode (`📁` button):** Optionally search inside all nested subfolders too. Matching parent folders expand automatically and collapse back when cleared.
- **Keyboard friendly:**
  - `Ctrl + Shift + E` — focus the filter bar from anywhere (customizable in Thunderbird's Add-on Shortcuts).
  - `Enter` or `↓` — select and jump to the first visible match.
  - `Esc` — clear the search query (press `Esc` again to focus the folder tree).
- **Native look:** Automatically adapts to Thunderbird Light and Dark themes.

### Installation
1. Go to the [**Releases**](https://github.com/DemaunK/thunderbird-mailbox-live-filter/releases/latest) page and download the `.xpi` file *(if using a browser like Firefox, right-click the file and choose **Save Link As…**)*.
2. Open **Thunderbird** → **Add-ons and Themes** (`Ctrl + Shift + A` / `Cmd + Shift + A`).
3. Click the **gear icon (⚙)** → **Install Add-on From File…**
4. Select the downloaded `mailbox-live-filter.xpi`.

### Compatibility & Important Note
- Requires **Thunderbird 115 or newer**.
- This add-on uses Thunderbird's **WebExtension Experiment API** because official WebExtension APIs do not currently allow injecting UI elements into the Left Folder Pane.
- Because `addons.thunderbird.net` no longer accepts new Experiment add-ons, it is distributed here on GitHub.
- Works on both **Thunderbird Release** and **Thunderbird ESR** *(Note: Thunderbird plans to end Experiment API support on the Release channel in summer 2027, while keeping support on **Thunderbird ESR**)*.

---

## Русский

Лёгкое дополнение для Thunderbird, которое добавляет **строку живого фильтра прямо в шапку левой панели** (над деревом папок). Начните вводить название почтового ящика — подходящие ящики остаются, остальные мгновенно скрываются.

### Возможности
- **Мгновенная фильтрация при наборе:** поддерживает несколько слов через пробел (например, `work gmail`).
- **Поиск по подпапкам (кнопка `📁`):** при включении ищет не только ящики, но и вложенные папки. Родительские папки с совпадениями раскрываются автоматически и сворачиваются обратно после очистки поиска.
- **Управление с клавиатуры:**
  - `Ctrl + Shift + E` — быстрый переход в строку фильтра из любого места (клавишу можно сменить в настройках дополнений Thunderbird).
  - `Enter` или `↓` — выбрать и открыть первый найденный ящик/папку.
  - `Esc` — очистить фильтр (повторное нажатие переводит фокус в дерево папок).
- **Поддержка тем:** автоматически подстраивается под светлую и тёмную тему Thunderbird.

### Установка
1. Перейдите на страницу [**Releases**](https://github.com/DemaunK/thunderbird-mailbox-live-filter/releases/latest) и скачайте файл `.xpi` *(если браузер пытается открыть его как своё расширение — нажмите правой кнопкой мыши → **Сохранить ссылку как…**)*.
2. Откройте **Thunderbird** → **Дополнения и темы** (`Ctrl + Shift + A`).
3. Нажмите на **шестерёнку (⚙)** → **Установить дополнение из файла…**
4. Выберите скачанный файл `mailbox-live-filter.xpi`.

### Совместимость и важное примечание
- Требуется **Thunderbird 115 и выше**.
- Плагин использует **Experiment API**, так как стандартный WebExtension API пока не позволяет встраивать строку поиска в левую панель папок.
- Поскольку официальный каталог `addons.thunderbird.net` перестал принимать новые дополнения с Experiment API, плагин распространяется через GitHub.
- Сейчас работает и на **Release**, и на **ESR** *(летом 2027 года поддержка Experiment API останется только на ветке **Thunderbird ESR**)*.
