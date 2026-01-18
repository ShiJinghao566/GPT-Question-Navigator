(() => {
  const PANEL_ID = "gpt-question-nav-panel";
  const LIST_ID = "gpt-question-nav-list";
  const TOGGLE_ID = "gpt-question-nav-toggle";
  const RESIZE_ID = "gpt-question-nav-resize";
  const WIDTH_KEY = "gpt-question-nav-width";
  const HEIGHT_KEY = "gpt-question-nav-height";
  const TOP_KEY = "gpt-question-nav-top";
  const MIN_WIDTH = 200;
  const MAX_WIDTH = 420;
  const MIN_HEIGHT = 200;

  const buildPanel = () => {
    if (document.getElementById(PANEL_ID)) return;

    const panel = document.createElement("aside");
    panel.id = PANEL_ID;

    const header = document.createElement("div");
    header.className = "gpt-question-nav-header";

    const title = document.createElement("div");
    title.className = "gpt-question-nav-title";
    title.textContent = "Questions";

    const toggle = document.createElement("button");
    toggle.id = TOGGLE_ID;
    toggle.type = "button";
    toggle.className = "gpt-question-nav-toggle";
    toggle.textContent = "Hide";

    toggle.addEventListener("click", () => {
      panel.classList.toggle("gpt-question-nav-collapsed");
      if (panel.classList.contains("gpt-question-nav-collapsed")) {
        panel.dataset.gptQuestionHeight =
          panel.style.height || `${panel.offsetHeight}px`;
        panel.style.height = "48px";
      } else {
        const restored =
          panel.dataset.gptQuestionHeight ||
          window.localStorage.getItem(HEIGHT_KEY);
        if (restored) {
          const restoredNumber = Number(restored);
          panel.style.height = Number.isFinite(restoredNumber)
            ? `${restoredNumber}px`
            : restored;
        } else {
          panel.style.removeProperty("height");
        }
      }
      toggle.textContent = panel.classList.contains("gpt-question-nav-collapsed")
        ? "Show"
        : "Hide";
    });

    header.appendChild(title);
    header.appendChild(toggle);

    const list = document.createElement("ol");
    list.id = LIST_ID;
    list.className = "gpt-question-nav-list";

    const resizer = document.createElement("div");
    resizer.id = RESIZE_ID;
    resizer.className = "gpt-question-nav-resize";
    resizer.setAttribute("aria-hidden", "true");

    const heightResizer = document.createElement("div");
    heightResizer.className = "gpt-question-nav-resize-vertical";
    heightResizer.setAttribute("aria-hidden", "true");

    panel.appendChild(header);
    panel.appendChild(list);
    panel.appendChild(resizer);
    panel.appendChild(heightResizer);

    document.body.appendChild(panel);

    const savedWidth = Number(window.localStorage.getItem(WIDTH_KEY));
    if (Number.isFinite(savedWidth) && savedWidth >= MIN_WIDTH) {
      panel.style.width = `${Math.min(savedWidth, MAX_WIDTH)}px`;
    }

    const savedHeight = Number(window.localStorage.getItem(HEIGHT_KEY));
    if (Number.isFinite(savedHeight) && savedHeight >= MIN_HEIGHT) {
      panel.style.height = `${savedHeight}px`;
    }

    const savedTop = Number(window.localStorage.getItem(TOP_KEY));
    if (Number.isFinite(savedTop) && savedTop >= 0) {
      panel.style.top = `${savedTop}px`;
      panel.style.bottom = "auto";
    }
  };

  const getQuestionElements = () => {
    const host = window.location.host;
    if (host.includes("gemini.google.com")) {
      return Array.from(
        document.querySelectorAll(
          ".user-query-bubble-with-background .query-text-line"
        )
      );
    }

    return Array.from(
      document.querySelectorAll('[data-message-author-role="user"]')
    );
  };

  const getScrollTarget = (el) => {
    const host = window.location.host;
    if (host.includes("gemini.google.com")) {
      return el.closest(".user-query-bubble-with-background") || el;
    }
    return el.closest("conversation-actions") || el;
  };

  const getQuestionText = (el) => {
    const raw = el.innerText || "";
    const cleaned = raw.replace(/\s+/g, " ").trim();
    if (!cleaned) return "(empty message)";
    return cleaned.length > 80 ? `${cleaned.slice(0, 77)}...` : cleaned;
  };

  const renderList = () => {
    const list = document.getElementById(LIST_ID);
    if (!list) return;

    const previousScrollTop = list.scrollTop;

    const questions = getQuestionElements();
    list.innerHTML = "";

    questions.forEach((el, index) => {
      const target = getScrollTarget(el);
      target.dataset.gptQuestionIndex = String(index + 1);

      const item = document.createElement("li");
      item.className = "gpt-question-nav-item";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "gpt-question-nav-link";
      button.textContent = `${index + 1}. ${getQuestionText(el)}`;

      button.addEventListener("click", () => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        target.classList.add("gpt-question-nav-highlight");
        setTimeout(
          () => target.classList.remove("gpt-question-nav-highlight"),
          1200
        );
      });

      item.appendChild(button);
      list.appendChild(item);
    });

    list.scrollTop = previousScrollTop;
  };

  const debounce = (fn, wait) => {
    let t;
    return () => {
      window.clearTimeout(t);
      t = window.setTimeout(fn, wait);
    };
  };

  const initResize = () => {
    const panel = document.getElementById(PANEL_ID);
    const resizer = document.getElementById(RESIZE_ID);
    const header = panel?.querySelector(".gpt-question-nav-header");
    const heightResizer = panel?.querySelector(
      ".gpt-question-nav-resize-vertical"
    );
    if (!panel || !resizer || !header || !heightResizer) return;

    let startX = 0;
    let startWidth = 0;
    let resizing = false;
    let startY = 0;
    let startHeight = 0;
    let resizingHeight = false;
    let dragging = false;
    let dragStartY = 0;
    let dragStartTop = 0;

    const onMove = (event) => {
      if (!resizing) return;
      const delta = startX - event.clientX;
      const nextWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, startWidth + delta)
      );
      panel.style.width = `${nextWidth}px`;
    };

    const onUp = () => {
      if (!resizing) return;
      resizing = false;
      panel.classList.remove("gpt-question-nav-resizing");
      window.localStorage.setItem(WIDTH_KEY, panel.offsetWidth.toString());
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    resizer.addEventListener("mousedown", (event) => {
      resizing = true;
      startX = event.clientX;
      startWidth = panel.offsetWidth;
      panel.classList.add("gpt-question-nav-resizing");
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    });

    const onHeightMove = (event) => {
      if (!resizingHeight) return;
      const delta = event.clientY - startY;
      const nextHeight = Math.max(MIN_HEIGHT, startHeight + delta);
      panel.style.height = `${nextHeight}px`;
    };

    const onHeightUp = () => {
      if (!resizingHeight) return;
      resizingHeight = false;
      panel.classList.remove("gpt-question-nav-resizing");
      window.localStorage.setItem(HEIGHT_KEY, panel.offsetHeight.toString());
      window.removeEventListener("mousemove", onHeightMove);
      window.removeEventListener("mouseup", onHeightUp);
    };

    heightResizer.addEventListener("mousedown", (event) => {
      if (panel.classList.contains("gpt-question-nav-collapsed")) return;
      resizingHeight = true;
      startY = event.clientY;
      startHeight = panel.offsetHeight;
      panel.classList.add("gpt-question-nav-resizing");
      window.addEventListener("mousemove", onHeightMove);
      window.addEventListener("mouseup", onHeightUp);
    });

    const onDragMove = (event) => {
      if (!dragging) return;
      const delta = event.clientY - dragStartY;
      const maxTop = Math.max(0, window.innerHeight - panel.offsetHeight);
      const nextTop = Math.min(maxTop, Math.max(0, dragStartTop + delta));
      panel.style.top = `${nextTop}px`;
      panel.style.bottom = "auto";
    };

    const onDragUp = () => {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove("gpt-question-nav-dragging");
      window.localStorage.setItem(TOP_KEY, panel.offsetTop.toString());
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", onDragUp);
    };

    header.addEventListener("mousedown", (event) => {
      if (event.target.closest("button")) return;
      dragging = true;
      dragStartY = event.clientY;
      dragStartTop = panel.offsetTop;
      panel.classList.add("gpt-question-nav-dragging");
      window.addEventListener("mousemove", onDragMove);
      window.addEventListener("mouseup", onDragUp);
    });
  };

  const init = () => {
    buildPanel();
    renderList();
    initResize();

    const observer = new MutationObserver(
      debounce(() => {
        renderList();
      }, 300)
    );

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
