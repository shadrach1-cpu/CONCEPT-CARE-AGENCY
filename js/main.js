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
