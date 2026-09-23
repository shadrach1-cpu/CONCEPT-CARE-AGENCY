(function () {
  "use strict";

  var cfg = window.CCA || {};
  var EMAIL = cfg.email || "contact@concepthealthcareagency.co.uk";
  var PHONE = cfg.phoneDisplay || "07438 811614";
  var PHONE_TEL = cfg.phoneTel || "+447438811614";

  // Mobile navigation
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  function closeNav() {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        closeNav();
        toggle.focus();
      }
    });
  }

  // Header shadow on scroll
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Dark mode toggle. With no saved choice, CSS alone follows the OS setting;
  // this only takes over once the visitor picks explicitly, and remembers it.
  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    function activeTheme() {
      var saved = document.documentElement.getAttribute("data-theme");
      return saved || (prefersDark && prefersDark.matches ? "dark" : "light");
    }
    function syncThemeButton() {
      var dark = activeTheme() === "dark";
      themeBtn.setAttribute("aria-pressed", String(dark));
      themeBtn.setAttribute("aria-label", "Switch to " + (dark ? "light" : "dark") + " mode");
    }
    syncThemeButton();
    themeBtn.addEventListener("click", function () {
      var next = activeTheme() === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try { localStorage.setItem("cca-theme", next); } catch (e) {}
      syncThemeButton();
    });
  }

  // Scroll progress bar + back-to-top button
  var progressBar = document.getElementById("scroll-progress");
  var backToTop = document.getElementById("back-to-top");
  if (progressBar || backToTop) {
    var onScrollTrack = function () {
      var doc = document.documentElement;
      var scrollTop = doc.scrollTop || document.body.scrollTop;
      var trackable = doc.scrollHeight - doc.clientHeight;
      if (progressBar) progressBar.style.width = (trackable > 0 ? (scrollTop / trackable) * 100 : 0) + "%";
      if (backToTop) backToTop.classList.toggle("show", scrollTop > 600);
    };
    window.addEventListener("scroll", onScrollTrack, { passive: true });
    window.addEventListener("resize", onScrollTrack);
    onScrollTrack();
  }
  if (backToTop) {
    backToTop.addEventListener("click", function () {
      var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  // Scroll reveal
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // Tabs (WAI-ARIA tabs pattern with arrow-key support)
  document.querySelectorAll("[data-tabs]").forEach(function (root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        if (e.key === "Home") next = tabs[0];
        if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });
    // Deep link: #for-carers etc.
    var hash = window.location.hash.replace("#", "");
    var match = tabs.filter(function (t) { return t.getAttribute("aria-controls") === hash; })[0];
    if (match) select(match);
  });

  // "Find the right service" wizard (homepage)
  var finder = document.querySelector("[data-finder]");
  if (finder) {
    var finderOptions = Array.prototype.slice.call(finder.querySelectorAll(".finder-option"));
    var finderResult = finder.querySelector(".finder-result");
    var finderIcon = finderResult && finderResult.querySelector(".badge .icon");
    var finderTitle = finderResult && finderResult.querySelector("h3");
    var finderText = finderResult && finderResult.querySelector("p");
    var finderCta = finderResult && finderResult.querySelector("a.btn");
    var finderData = {
      hospital: { icon: "i-hand", title: "Hospitals", text: "We supply Healthcare Assistants trained to support wards and clinical teams with patients' daily needs.", service: "Hospital", ctaText: "Request a Healthcare Assistant", href: "request-staff.html" },
      carehome: { icon: "i-home", title: "Care Homes", text: "Care Assistants and Senior Carers giving personal care, medication support and companionship.", service: "Residential care home", ctaText: "Request a Care Assistant", href: "request-staff.html" },
      disability: { icon: "i-heart", title: "Disability", text: "Support Workers helping adults with learning disabilities and complex care needs to live independently.", service: "Disability / supported living", ctaText: "Request a Support Worker", href: "request-staff.html" },
      support: { icon: "i-users", title: "Support Caregiving", text: "General support care staff for daily living, companionship and community support.", service: "Support caregiving / community", ctaText: "Request a support caregiver", href: "request-staff.html" },
      caregiver: { icon: "i-star", title: "Looking for care work?", text: "Join our pool of caregivers and choose flexible shifts across Norwich and Norfolk.", ctaText: "Register your interest", href: "careers.html#apply" }
    };
    finderOptions.forEach(function (opt) {
      opt.addEventListener("click", function () {
        finderOptions.forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
        opt.setAttribute("aria-pressed", "true");
        var d = finderData[opt.getAttribute("data-key")];
        if (!d || !finderResult) return;
        if (finderIcon) finderIcon.className = "icon " + d.icon;
        if (finderTitle) finderTitle.textContent = d.title;
        if (finderText) finderText.textContent = d.text;
        if (finderCta) {
          finderCta.href = d.service ? d.href + "?service=" + encodeURIComponent(d.service) : d.href;
          finderCta.textContent = d.ctaText;
        }
        finderResult.classList.add("show");
      });
    });
  }

  // Live FAQ search (Services page)
  var faqInput = document.getElementById("faq-search");
  if (faqInput) {
    var faqTarget = document.querySelector(faqInput.getAttribute("data-target"));
    var faqEmpty = document.getElementById("faq-empty");
    var faqItems = faqTarget ? Array.prototype.slice.call(faqTarget.querySelectorAll("details")) : [];
    faqInput.addEventListener("input", function () {
      var q = faqInput.value.trim().toLowerCase();
      var shown = 0;
      faqItems.forEach(function (d) {
        var match = !q || d.textContent.toLowerCase().indexOf(q) !== -1;
        d.hidden = !match;
        if (match) shown++;
      });
      if (faqEmpty) faqEmpty.classList.toggle("show", q !== "" && shown === 0);
    });
  }

  // Pre-select the "Type of service" dropdown when arriving via a ?service= link
  // (e.g. the homepage service finder)
  var typeSelect = document.getElementById("type");
  if (typeSelect && window.location.search) {
    var wantedService = new URLSearchParams(window.location.search).get("service");
    if (wantedService) {
      var wantedOpt = Array.prototype.slice.call(typeSelect.options).filter(function (o) { return o.value === wantedService; })[0];
      if (wantedOpt) typeSelect.value = wantedOpt.value;
    }
  }

  // Forms
  function labelFor(el, form) {
    var fieldset = el.closest("fieldset");
    if (fieldset && fieldset.querySelector("legend")) {
      return fieldset.querySelector("legend").textContent.replace("*", "").trim();
    }
    var label = el.id && form.querySelector('label[for="' + el.id + '"]');
    return (label ? label.textContent : el.name).replace("*", "").trim();
  }

  function collect(form) {
    var order = [];
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === "submit" || el.name === "consent" || el.name === "_gotcha") return;
      if ((el.type === "checkbox" || el.type === "radio") && !el.checked) return;
      if (!el.value) return;
      var key = labelFor(el, form);
      if (!data[key]) { data[key] = []; order.push(key); }
      data[key].push(el.value);
    });
    return { order: order, data: data };
  }

  // showContacts appends "You can also email / call us"; isError only changes the styling.
  function showStatus(form, message, showContacts, isError) {
    var status = form.querySelector(".form-status");
    if (!status) return;
    status.textContent = "";
    var text = document.createElement("span");
    text.textContent = message + " ";
    status.appendChild(text);
    var mail = document.createElement("a");
    mail.href = "mailto:" + EMAIL;
    mail.textContent = EMAIL;
    var tel = document.createElement("a");
    tel.href = "tel:" + PHONE_TEL;
    tel.textContent = PHONE;
    if (showContacts) {
      status.appendChild(document.createTextNode("Please email "));
      status.appendChild(mail);
      status.appendChild(document.createTextNode(" or call "));
      status.appendChild(tel);
      status.appendChild(document.createTextNode("."));
    }
    status.className = "form-status show" + (isError ? " error" : "");
    status.setAttribute("tabindex", "-1");
    status.focus();
  }

  document.querySelectorAll("form[data-mailto]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Honeypot: real visitors never fill this in
      var trap = form.querySelector('input[name="_gotcha"]');
      if (trap && trap.value) return;
      if (!form.reportValidity()) return;

      var collected = collect(form);
      var subject = form.getAttribute("data-subject") || "Website enquiry";

      if (cfg.formEndpoint) {
        var payload = new FormData();
        collected.order.forEach(function (k) { payload.append(k, collected.data[k].join(", ")); });
        payload.append("_subject", subject);
        payload.append("_template", "table"); // FormSubmit: tidy table layout in the email
        payload.append("_captcha", "false");
        // Form services (FormSubmit, Formspree) use a field called "email" as the reply-to address
        var emailField = form.querySelector('input[type="email"]');
        if (emailField && emailField.value) payload.append("email", emailField.value);
        var btn = form.querySelector('button[type="submit"]');
        var original = btn ? btn.textContent : "";
        if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }
        fetch(cfg.formEndpoint, { method: "POST", body: payload, headers: { Accept: "application/json" } })
          .then(function (r) {
            return r.json().catch(function () { return {}; }).then(function (j) {
              // Some services answer 200 with success:"false" (e.g. form not yet activated)
              if (!r.ok || j.success === false || j.success === "false" || j.error) throw new Error("not sent");
              form.reset();
              showStatus(form, "Thank you, your message has been sent. We will be in touch as soon as we can.", false, false);
            });
          })
          .catch(function () {
            showStatus(form, "Sorry, something went wrong sending your message.", true, true);
          })
          .then(function () {
            if (btn) { btn.disabled = false; btn.textContent = original; }
          });
        return;
      }

      var body = collected.order.map(function (k) { return k + ": " + collected.data[k].join(", "); }).join("\n");
      var href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      showStatus(form, "Thank you. Your email app should now open with your details ready to send. Nothing happened?", true, false);
      window.location.href = href;
    });
  });
})();
