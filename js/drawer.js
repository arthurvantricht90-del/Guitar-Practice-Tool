// Slide-out options panel. Each module keeps its settings in a drawer so the
// main area is left to the diagrams, which is what people actually look at.
//
// Drawers live inside their module <section> so the modules' own
// querySelector lookups still find their inputs, and so a drawer can never
// be open for a module that isn't on screen.

const Drawer = (() => {
  function closeAll() {
    document.querySelectorAll(".drawer.open").forEach((d) => {
      d.classList.remove("open");
      d.setAttribute("aria-hidden", "true");
    });
    document.querySelectorAll(".drawer-backdrop.show").forEach((b) => b.classList.remove("show"));
    document.body.classList.remove("drawer-open");
  }

  function open(drawer) {
    if (!drawer) return;
    closeAll();
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    const backdrop = drawer.parentElement.querySelector(".drawer-backdrop");
    if (backdrop) backdrop.classList.add("show");
    document.body.classList.add("drawer-open");
    const first = drawer.querySelector("input, button");
    if (first) first.focus({ preventScroll: true });
  }

  function init() {
    document.querySelectorAll("[data-drawer-open]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        open(document.getElementById(btn.dataset.drawerOpen));
      });
    });

    document.querySelectorAll("[data-drawer-close]").forEach((el) => {
      el.addEventListener("click", closeAll);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAll();
    });
  }

  return { init, open, closeAll };
})();
