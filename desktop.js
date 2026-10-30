// shared behavior for the desktop-style pages (index.html, research.html)

// icon drawings, added to the page so <use href="#i-..."> can find them
document.body.insertAdjacentHTML('beforeend', `
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute">
    <symbol id="i-folder" viewBox="0 0 64 64">
        <path d="M4 14a4 4 0 0 1 4-4h16l6 6h26a4 4 0 0 1 4 4v4H4z" fill="var(--folder-dark)"/>
        <rect x="4" y="20" width="56" height="36" rx="4" fill="var(--folder)"/>
        <rect x="4" y="20" width="56" height="3" fill="#fff" opacity=".35"/>
    </symbol>
    <symbol id="i-pdf" viewBox="0 0 64 64">
        <path d="M14 4h26l12 12v42a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#f4f4f6"/>
        <path d="M40 4v10a2 2 0 0 0 2 2h10z" fill="#c9c9d1"/>
        <rect x="18" y="24" width="28" height="2.5" rx="1" fill="#c3c3cc"/>
        <rect x="18" y="30" width="28" height="2.5" rx="1" fill="#c3c3cc"/>
        <rect x="18" y="36" width="20" height="2.5" rx="1" fill="#c3c3cc"/>
        <rect x="8" y="44" width="30" height="13" rx="2" fill="#e5443b"/>
        <text x="23" y="54" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#fff">PDF</text>
    </symbol>
    <symbol id="i-txt" viewBox="0 0 64 64">
        <path d="M14 4h26l12 12v42a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#f4f4f6"/>
        <path d="M40 4v10a2 2 0 0 0 2 2h10z" fill="#c9c9d1"/>
        <rect x="18" y="22" width="28" height="2.5" rx="1" fill="#8a8a96"/>
        <rect x="18" y="28" width="24" height="2.5" rx="1" fill="#8a8a96"/>
        <rect x="18" y="34" width="28" height="2.5" rx="1" fill="#8a8a96"/>
        <rect x="18" y="40" width="20" height="2.5" rx="1" fill="#8a8a96"/>
        <text x="32" y="54" text-anchor="middle" font-family="Menlo, monospace" font-size="8" font-weight="bold" fill="#6b6b78">TXT</text>
    </symbol>
    <symbol id="i-terminal" viewBox="0 0 64 64">
        <rect x="6" y="10" width="52" height="44" rx="5" fill="#1e1f26"/>
        <rect x="6" y="10" width="52" height="8" rx="5" fill="#3a3c47"/>
        <circle cx="12" cy="14" r="1.6" fill="#ff5f57"/>
        <circle cx="17" cy="14" r="1.6" fill="#febc2e"/>
        <circle cx="22" cy="14" r="1.6" fill="#28c840"/>
        <path d="M14 28l7 5-7 5" stroke="#7CFC9A" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="25" y="37" width="12" height="2.5" rx="1" fill="#7CFC9A"/>
    </symbol>
    <symbol id="i-back" viewBox="0 0 64 64">
        <path d="M4 14a4 4 0 0 1 4-4h16l6 6h26a4 4 0 0 1 4 4v4H4z" fill="var(--folder-dark)"/>
        <rect x="4" y="20" width="56" height="36" rx="4" fill="var(--folder)"/>
        <path d="M40 38H24m0 0l7-7m-7 7l7 7" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </symbol>
    <symbol id="i-link" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="25" fill="#3b7dd8"/>
        <ellipse cx="32" cy="32" rx="11" ry="25" stroke="#cfe3ff" stroke-width="2.5" fill="none"/>
        <path d="M7 32h50M11 20h42M11 44h42" stroke="#cfe3ff" stroke-width="2.5" fill="none"/>
    </symbol>
    <symbol id="i-mail" viewBox="0 0 64 64">
        <rect x="6" y="14" width="52" height="36" rx="4" fill="#f4f4f6"/>
        <path d="M8 17l24 18 24-18" stroke="#9aa3b5" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
    </symbol>
</svg>
`);

const desktop = document.getElementById('desktop');
const icons = [...desktop.querySelectorAll('.icon')];
const CELL_W = 160, CELL_H = 170, MARGIN = 24;

// lay icons out on a grid; on narrow screens, flow them into rows instead.
// icons with data-u / data-v are pinned to that spot on the background photo
// (the page defines --bg-left, --bg-top, --bg-w, --bg-h), centered on the icon picture.
function layout() {
    const narrow = window.innerWidth < 600;
    const perRow = Math.max(1, Math.floor((window.innerWidth - MARGIN) / CELL_W));
    icons.forEach((icon, i) => {
        if (!narrow && icon.dataset.u) {
            icon.style.left = `calc(var(--bg-left) + ${icon.dataset.u} * var(--bg-w) - ${CELL_W / 2}px)`;
            icon.style.top = `calc(var(--bg-top) + ${icon.dataset.v} * var(--bg-h) - var(--menubar-height) - 48px)`;
            return;
        }
        const x = narrow ? i % perRow : +icon.dataset.x;
        const y = narrow ? Math.floor(i / perRow) : +icon.dataset.y;
        icon.style.left = (MARGIN + x * CELL_W) + 'px';
        icon.style.top = (MARGIN + y * CELL_H) + 'px';
    });
}
layout();
window.addEventListener('resize', layout);

// click opens the link; dragging moves the icon without opening it
icons.forEach(icon => {
    let startX, startY, origLeft, origTop, moved = false;

    // stop the browser's own link-dragging from taking over
    icon.draggable = false;
    icon.addEventListener('dragstart', e => e.preventDefault());

    icon.addEventListener('pointerdown', e => {
        icons.forEach(other => other.classList.remove('selected'));
        icon.classList.add('selected');
        startX = e.clientX;
        startY = e.clientY;
        origLeft = icon.offsetLeft;
        origTop = icon.offsetTop;
        moved = false;
        icon.setPointerCapture(e.pointerId);
    });

    icon.addEventListener('pointermove', e => {
        if (!icon.hasPointerCapture(e.pointerId)) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (!moved && Math.hypot(dx, dy) < 5) return;
        moved = true;
        icons.forEach(other => other.style.zIndex = '');
        icon.classList.remove('dropping');
        icon.classList.add('dragging');
        // keep the icon on screen
        const maxLeft = desktop.clientWidth - icon.offsetWidth;
        const maxTop = desktop.clientHeight - icon.offsetHeight;
        icon.style.left = Math.min(Math.max(0, origLeft + dx), maxLeft) + 'px';
        icon.style.top = Math.min(Math.max(0, origTop + dy), maxTop) + 'px';
    });

    function drop() {
        if (!icon.classList.contains('dragging')) return;
        icon.classList.remove('dragging');
        icon.classList.add('dropping');
        icon.style.zIndex = 3;  // the icon you moved last stays on top
    }
    icon.addEventListener('pointerup', drop);
    icon.addEventListener('pointercancel', drop);
    icon.addEventListener('animationend', () => icon.classList.remove('dropping'));

    icon.addEventListener('click', e => {
        if (moved) e.preventDefault();
    });
});

// clicking empty desktop clears the selection
desktop.addEventListener('pointerdown', e => {
    if (e.target === desktop) icons.forEach(icon => icon.classList.remove('selected'));
});

// menu bar clock
function tick() {
    document.getElementById('clock').textContent = new Date().toLocaleString([], {
        weekday: 'short', hour: 'numeric', minute: '2-digit'
    });
}
tick();
setInterval(tick, 10000);
