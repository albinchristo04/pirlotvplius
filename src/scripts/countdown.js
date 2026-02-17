// src/scripts/countdown.js — Live countdown timer to match kickoff
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        const el = document.getElementById('countdown');
        if (!el) return;

        const targetDate = new Date(el.dataset.start);
        if (isNaN(targetDate.getTime())) return;

        const daysEl = document.getElementById('cd-days');
        const hoursEl = document.getElementById('cd-hours');
        const minsEl = document.getElementById('cd-mins');
        const secsEl = document.getElementById('cd-secs');

        function update() {
            const now = new Date();
            const diff = targetDate - now;

            if (diff <= 0) {
                el.innerHTML = '<div class="live-badge" style="font-size:1rem;padding:0.5rem 1.5rem;">● EN VIVO AHORA</div>';
                return;
            }

            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);

            if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
            if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
            if (minsEl) minsEl.textContent = String(mins).padStart(2, '0');
            if (secsEl) secsEl.textContent = String(secs).padStart(2, '0');
        }

        update();
        setInterval(update, 1000);
    });
})();
