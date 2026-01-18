(() => {
  const PANEL_ID = "gpt-question-nav-panel";
  const LIST_ID = "gpt-question-nav-list";
  const TOGGLE_ID = "gpt-question-nav-toggle";

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
      toggle.textContent = panel.classList.contains("gpt-question-nav-collapsed")
        ? "Show"
        : "Hide";
    });

    header.appendChild(title);
    header.appendChild(toggle);

    const list = document.createElement("ol");
    list.id = LIST_ID;
    list.className = "gpt-question-nav-list";

    panel.appendChild(header);
    panel.appendChild(list);

    document.body.appendChild(panel);
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

  const init = () => {
    buildPanel();
    renderList();

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
