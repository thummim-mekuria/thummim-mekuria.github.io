// shared behavior for the desktop-style pages (index, astrophysics, misc, philosophy)

// icon drawings, added to the page so <use href="#i-..."> can find them
document.body.insertAdjacentHTML('beforeend', `
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute">
    <symbol id="i-pdf" viewBox="0 0 64 64">
        <path d="M14 4h26l12 12v42a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" fill="#f4f4f6"/>
        <path d="M40 4v10a2 2 0 0 0 2 2h10z" fill="#c9c9d1"/>
        <rect x="18" y="24" width="28" height="2.5" rx="1" fill="#c3c3cc"/>
        <rect x="18" y="30" width="28" height="2.5" rx="1" fill="#c3c3cc"/>
        <rect x="18" y="36" width="20" height="2.5" rx="1" fill="#c3c3cc"/>
        <rect x="8" y="44" width="30" height="13" rx="2" fill="#e5443b"/>
        <text x="23" y="54" text-anchor="middle" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#fff">PDF</text>
    </symbol>
</svg>
`);

const desktop = document.getElementById('desktop');
const icons = [...desktop.querySelectorAll('.icon')];
const CELL_W = 160, CELL_H = 170, MARGIN = 24;

// lay icons out left to right across the top, wrapping onto new rows when the window is full.
// a back button (class="icon back") gets the first row to itself; the other icons start on the row below.
function layout() {
    const perRow = Math.max(1, Math.floor((window.innerWidth - MARGIN) / CELL_W));
    const back = icons.filter(icon => icon.classList.contains('back'));
    const rest = icons.filter(icon => !icon.classList.contains('back'));
    const place = (icon, x, y) => {
        icon.style.left = (MARGIN + x * CELL_W) + 'px';
        icon.style.top = (MARGIN + y * CELL_H) + 'px';
    };
    back.forEach((icon, i) => place(icon, i, 0));
    // wide items (the sticky note) take up as many grid cells as they need
    let col = 0, row = back.length ? 1 : 0;
    rest.forEach(icon => {
        const span = Math.min(perRow, Math.ceil(icon.offsetWidth / CELL_W));
        if (col > 0 && col + span > perRow) { col = 0; row++; }
        place(icon, col, row);
        col += span;
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
        // links on the sticky note open normally instead of starting a drag
        if (e.target !== icon && e.target.closest('a') && !e.target.closest('a').classList.contains('icon')) return;
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
