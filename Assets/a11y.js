/* Shared accessibility layer: skip link, menu ARIA, accessibility widget (saved across pages), contact form submission */
(function () {
    var script = document.currentScript;
    var siteRoot = new URL('../', script.src).href;
    var html = document.documentElement;
    var isHe = (html.lang || '').toLowerCase().indexOf('he') === 0;

    var T = isHe ? {
        skip: 'דלג לתוכן הראשי',
        open: 'פתיחת תפריט נגישות',
        title: 'תפריט נגישות',
        menu: 'תפריט ניווט',
        opts: {
            'large-text': 'הגדלת טקסט',
            'high-contrast': 'ניגודיות גבוהה',
            'highlight-links': 'הדגשת קישורים',
            'readable-font': 'גופן קריא',
            'no-motion': 'עצירת אנימציות'
        },
        reset: 'איפוס הגדרות',
        statement: 'הצהרת נגישות',
        statementUrl: siteRoot + 'HE/accessibility.html',
        sending: 'שולח...',
        sent: 'תודה! הפנייה נשלחה ונחזור אליכם בהקדם.',
        failed: 'השליחה נכשלה. אפשר לנסות שוב או לפנות אלינו בטלפון 03-5751070 או במייל info@dortech.co.il.'
    } : {
        skip: 'Skip to main content',
        open: 'Open accessibility menu',
        title: 'Accessibility menu',
        menu: 'Navigation menu',
        opts: {
            'large-text': 'Larger text',
            'high-contrast': 'High contrast',
            'highlight-links': 'Highlight links',
            'readable-font': 'Readable font',
            'no-motion': 'Stop animations'
        },
        reset: 'Reset settings',
        statement: 'Accessibility statement',
        statementUrl: siteRoot + 'EN/accessibility.html',
        sending: 'Sending...',
        sent: 'Thank you! Your message was sent and we will get back to you shortly.',
        failed: 'Sending failed. Please try again, or call us at 03-5751070 or email info@dortech.co.il.'
    };

    // Saved preferences, applied as early as possible
    var KEY = 'dt-acc-prefs';
    var prefs = {};
    try { prefs = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { prefs = {}; }
    function applyPrefs() {
        Object.keys(T.opts).forEach(function (k) { html.classList.toggle('dt-' + k, !!prefs[k]); });
    }
    function savePrefs() { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {} }
    applyPrefs();

    function ready(fn) {
        if (document.readyState !== 'loading') fn(); else document.addEventListener('DOMContentLoaded', fn);
    }

    ready(function () {
        // Remove any legacy per-page widget
        var legacy = document.getElementById('accessibility-nav');
        if (legacy) legacy.remove();

        // Skip link
        var main = document.querySelector('main');
        if (main) {
            if (!main.id) main.id = 'main-content';
            main.setAttribute('tabindex', '-1');
            var skip = document.createElement('a');
            skip.className = 'dt-skip-link';
            skip.href = '#' + main.id;
            skip.textContent = T.skip;
            document.body.insertBefore(skip, document.body.firstChild);
        }

        // Mobile menu toggle: expose state to screen readers, close with Escape
        var toggle = document.querySelector('.nav-toggle');
        var nav = toggle && toggle.nextElementSibling;
        if (toggle && nav) {
            if (!nav.id) nav.id = 'site-nav';
            toggle.setAttribute('aria-controls', nav.id);
            toggle.setAttribute('aria-label', T.menu);
            var sync = function () { toggle.setAttribute('aria-expanded', nav.classList.contains('nav-open') ? 'true' : 'false'); };
            sync();
            toggle.addEventListener('click', function () { setTimeout(sync, 0); });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && nav.classList.contains('nav-open')) { nav.classList.remove('nav-open'); sync(); toggle.focus(); }
            });
        }

        // Accessibility widget
        var wrap = document.createElement('div');
        wrap.id = 'dt-acc';
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'dt-acc-toggle';
        btn.setAttribute('aria-label', T.open);
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', 'dt-acc-panel');
        btn.innerHTML = '<span aria-hidden="true">♿</span>';

        var panel = document.createElement('div');
        panel.id = 'dt-acc-panel';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-labelledby', 'dt-acc-title');
        panel.hidden = true;
        var h = document.createElement('h2');
        h.id = 'dt-acc-title';
        h.textContent = T.title;
        panel.appendChild(h);

        var optButtons = [];
        Object.keys(T.opts).forEach(function (k) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'dt-acc-opt';
            b.textContent = T.opts[k];
            b.setAttribute('aria-pressed', prefs[k] ? 'true' : 'false');
            b.addEventListener('click', function () {
                prefs[k] = !prefs[k];
                b.setAttribute('aria-pressed', prefs[k] ? 'true' : 'false');
                applyPrefs(); savePrefs();
            });
            optButtons.push(b);
            panel.appendChild(b);
        });
        var reset = document.createElement('button');
        reset.type = 'button';
        reset.className = 'dt-acc-opt dt-acc-reset';
        reset.textContent = T.reset;
        reset.addEventListener('click', function () {
            prefs = {};
            optButtons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
            applyPrefs(); savePrefs();
        });
        panel.appendChild(reset);
        var link = document.createElement('a');
        link.className = 'dt-acc-statement';
        link.href = T.statementUrl;
        link.textContent = T.statement;
        panel.appendChild(link);

        function setOpen(open) {
            panel.hidden = !open;
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
        btn.addEventListener('click', function () {
            var open = panel.hidden;
            setOpen(open);
            if (open) optButtons[0].focus();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !panel.hidden) { setOpen(false); btn.focus(); }
        });
        document.addEventListener('click', function (e) {
            if (!panel.hidden && !wrap.contains(e.target)) setOpen(false);
        });

        wrap.appendChild(panel);
        wrap.appendChild(btn);
        document.body.appendChild(wrap);

        // Contact form: submit to Web3Forms without leaving the page
        var form = document.querySelector('form[data-dt-form]');
        if (form && window.fetch) {
            var status = form.querySelector('.dt-form-status');
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                var submit = form.querySelector('[type="submit"]');
                if (submit) submit.disabled = true;
                if (status) { status.className = 'dt-form-status'; status.textContent = T.sending; }
                fetch(form.action, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(Object.fromEntries(new FormData(form)))
                }).then(function (r) {
                    return r.json().catch(function () { return {}; }).then(function (data) {
                        if (!r.ok || !data.success) throw new Error(data.message || r.status);
                    });
                }).then(function () {
                    form.reset();
                    if (status) { status.className = 'dt-form-status ok'; status.textContent = T.sent; }
                }).catch(function () {
                    if (status) { status.className = 'dt-form-status err'; status.textContent = T.failed; }
                }).then(function () {
                    if (submit) submit.disabled = false;
                });
            });
        }
    });
})();
