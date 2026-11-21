// Anti-clickjacking : GitHub Pages ne permet pas X-Frame-Options, donc on refuse d'être affiché dans un cadre d'un autre site.
(function () { "use strict"; if (window.top === window.self) return; document.documentElement.style.display = "none"; try { window.top.location = window.self.location.href; } catch (e) {} })();
