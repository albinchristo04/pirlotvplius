// src/scripts/player.js — Click-to-play iframe loader + channel tab switcher
(function () {
    'use strict';

    document.addEventListener('DOMContentLoaded', function () {
        const poster = document.getElementById('player-poster');
        const tabsContainer = document.getElementById('player-tabs');
        const frameContainer = document.getElementById('player-frame');
        const playBtn = document.getElementById('play-btn');

        if (!poster || !playBtn) return;

        let channels;
        try {
            channels = JSON.parse(poster.dataset.channels || '[]');
        } catch (e) {
            channels = [];
        }

        if (channels.length === 0) return;

        function loadStream(url) {
            frameContainer.innerHTML = '<iframe id="stream-frame" src="' + url + '" allowfullscreen loading="lazy" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups"></iframe>';
            frameContainer.style.display = 'block';
        }

        function buildTabs() {
            if (channels.length <= 1) return;
            tabsContainer.innerHTML = '';
            channels.forEach(function (ch, idx) {
                const btn = document.createElement('button');
                btn.className = 'player-tab' + (idx === 0 ? ' active' : '');
                btn.textContent = ch.name;
                btn.setAttribute('data-url', ch.url);
                btn.addEventListener('click', function () {
                    tabsContainer.querySelectorAll('.player-tab').forEach(function (t) { t.classList.remove('active'); });
                    btn.classList.add('active');
                    loadStream(ch.url);
                });
                tabsContainer.appendChild(btn);
            });
            tabsContainer.style.display = 'flex';
        }

        playBtn.addEventListener('click', function () {
            poster.style.display = 'none';
            buildTabs();
            loadStream(channels[0].url);

            // Add sticky class on mobile
            if (window.innerWidth <= 768) {
                document.querySelector('.player-container')?.classList.add('sticky');
            }
        });
    });
})();
