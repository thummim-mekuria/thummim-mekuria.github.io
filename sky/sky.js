// live finding chart of the sky overhead, drawn as the page background.
// zenith is at the center of the window, north is up and east is left (as when looking up),
// and the horizon passes through the window's corners. redraws every minute.
// needs: sky/sky-data.js (window.SKY_DATA) and astronomy-engine (window.Astronomy, for the sun, moon and planets)

(function () {
    const SANTA_CRUZ = { lat: 36.9741, lon: -122.0308, label: 'Santa Cruz' };
    let place = SANTA_CRUZ;

    // look of the chart: a night-sky take on the classic IAU / Wikipedia constellation maps
    const STYLE = {
        paper: '#000000',
        halo: 'rgba(0, 0, 0, 0.85)',            // outline behind text so it reads over lines
        milkyWay: 'rgba(105, 90, 20, 0.09)',     // each outline level adds another layer
        grid: '#22170a',
        ecliptic: '#d9332b',
        bounds: '#333333',
        lines: '#555555',
        star: '#9a9a9a',
        sun: '#ffcc33',
        moon: '#f2e08c',
        planet: '#4fcf95',
        cardinal: '#656565',
    };

    const D = window.SKY_DATA;
    const rad = Math.PI / 180;
    const canvas = document.createElement('canvas');
    canvas.id = 'sky';
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:-1;pointer-events:none';
    document.body.prepend(canvas);
    const ctx = canvas.getContext('2d');

    let W, H, cx, cy, R, lst, sinLat, cosLat;

    // right ascension / declination (degrees, J2000) -> screen x, y and altitude
    function project(ra, dec) {
        const h = (lst - ra) * rad, d = dec * rad;
        const sinAlt = Math.sin(d) * sinLat + Math.cos(d) * cosLat * Math.cos(h);
        const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
        const az = Math.atan2(-Math.cos(d) * Math.sin(h), Math.sin(d) * cosLat - Math.cos(d) * sinLat * Math.cos(h));
        // stereographic projection from the zenith; clamp near the nadir so shapes stay finite
        const z = Math.min(Math.PI / 2 - alt, 160 * rad);
        const r = R * Math.tan(z / 2);
        return [cx - r * Math.sin(az), cy - r * Math.cos(az), alt / rad];
    }

    const onScreen = (x, y, pad = 40) => x > -pad && y > -pad && x < W + pad && y < H + pad;

    // fill in points along a path so long segments curve correctly on the projection
    function densify(pts, closed, step = 1.5) {
        const out = [];
        const n = closed ? pts.length : pts.length - 1;
        for (let i = 0; i < n; i++) {
            const [ra0, de0] = pts[i], [ra1raw, de1] = pts[(i + 1) % pts.length];
            let dra = ra1raw - ra0;
            if (dra > 180) dra -= 360;
            if (dra < -180) dra += 360;
            const k = Math.max(1, Math.ceil(Math.max(Math.abs(dra) * Math.cos(de0 * rad), Math.abs(de1 - de0)) / step));
            for (let j = 0; j < k; j++) out.push([ra0 + dra * j / k, de0 + (de1 - de0) * j / k]);
        }
        if (!closed) out.push(pts[pts.length - 1]);
        return out;
    }

    // stroke a path of [ra, dec] points, lifting the pen where it dips well below the horizon
    function strokePath(pts, closed) {
        ctx.beginPath();
        let down = false;
        for (const [ra, de] of densify(pts, closed)) {
            const [x, y, alt] = project(ra, de);
            if (alt < -15) { down = false; continue; }
            down ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            down = true;
        }
        ctx.stroke();
    }

    // fill a polygon given as [outer ring, hole, hole, ...]
    function fillPolygon(rings) {
        ctx.beginPath();
        for (const ring of rings) {
            densify(ring, true, 3).forEach(([ra, de], i) => {
                const [x, y] = project(ra, de);
                i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
            });
            ctx.closePath();
        }
        ctx.fill('evenodd');
    }

    function label(text, x, y, font, color, align = 'left') {
        ctx.font = font;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = STYLE.halo;
        ctx.strokeText(text, x, y);
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    }

    const starRadius = mag => Math.max(0.7, 0.6 + (6 - mag) * 0.85);

    // sun, moon and planets from astronomy-engine (skipped quietly if it didn't load)
    function solarSystem(date) {
        if (!window.Astronomy) return [];
        const obs = new Astronomy.Observer(place.lat, place.lon, 0);
        return ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].map(body => {
            const eq = Astronomy.Equator(body, date, obs, false, true);  // J2000, to match the star catalog
            return { body, ra: eq.ra * 15, dec: eq.dec };
        });
    }

    function draw() {
        const dpr = window.devicePixelRatio || 1;
        W = window.innerWidth; H = window.innerHeight;
        canvas.width = W * dpr; canvas.height = H * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx = W / 2; cy = H / 2;
        R = Math.hypot(W, H) / 2;  // horizon radius: the horizon passes through the corners

        const now = new Date();
        const gmst = window.Astronomy
            ? Astronomy.SiderealTime(now) * 15
            : 280.46061837 + 360.98564736629 * (now / 86400000 + 2440587.5 - 2451545);
        lst = ((gmst + place.lon) % 360 + 360) % 360;
        sinLat = Math.sin(place.lat * rad); cosLat = Math.cos(place.lat * rad);

        ctx.fillStyle = STYLE.paper;
        ctx.fillRect(0, 0, W, H);
        ctx.lineJoin = ctx.lineCap = 'round';

        // milky way
        ctx.fillStyle = STYLE.milkyWay;
        for (const level of Object.values(D.mw)) level.forEach(fillPolygon);

        // coordinate grid: hour circles every 1h of RA, declination circles every 15 deg
        ctx.strokeStyle = STYLE.grid; ctx.lineWidth = 1.2; ctx.setLineDash([]);
        for (let ra = 0; ra < 360; ra += 15) strokePath([[ra, -75], [ra, 75]], false);
        for (let de = -75; de <= 75; de += 15) strokePath([[0, de], [120, de], [240, de]], true);

        // ecliptic
        const eps = 23.4393 * rad, ecl = [];
        for (let l = 0; l < 360; l += 5) {
            const L = l * rad;
            ecl.push([(Math.atan2(Math.sin(L) * Math.cos(eps), Math.cos(L)) / rad + 360) % 360, Math.asin(Math.sin(eps) * Math.sin(L)) / rad]);
        }
        ctx.strokeStyle = STYLE.ecliptic; ctx.lineWidth = 1.4; ctx.setLineDash([9, 6]);
        strokePath(ecl, true);

        // constellation boundaries
        ctx.strokeStyle = STYLE.bounds; ctx.lineWidth = 2; ctx.setLineDash([10, 6]);
        D.bounds.forEach(b => strokePath(b, true));
        ctx.setLineDash([]);

        // constellation stick figures
        ctx.strokeStyle = STYLE.lines; ctx.lineWidth = 2;
        D.lines.forEach(l => strokePath(l, false));

        // stars, brightest last so they sit on top; a thin white ring keeps them crisp on the lines
        const visible = [];
        for (const s of D.stars) {
            const [x, y, alt] = project(s[0], s[1]);
            if (alt > -2 && onScreen(x, y)) visible.push([x, y, s]);
        }
        visible.sort((a, b) => b[2][2] - a[2][2]);
        for (const [x, y, s] of visible) {
            const r = starRadius(s[2]);
            ctx.beginPath(); ctx.arc(x, y, r + 1.2, 0, 2 * Math.PI); ctx.fillStyle = STYLE.paper; ctx.fill();
            ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = STYLE.star; ctx.fill();
        }

        // messier objects: open circles (unlabeled; only the sun, moon and planets get names)
        for (const [ra, de] of D.dsos) {
            const [x, y, alt] = project(ra, de);
            if (alt < 0 || !onScreen(x, y)) continue;
            ctx.beginPath(); ctx.arc(x, y, 7, 0, 2 * Math.PI);
            ctx.strokeStyle = STYLE.star; ctx.lineWidth = 1.5; ctx.stroke();
        }

        // sun, moon and planets
        for (const p of solarSystem(now)) {
            const [x, y, alt] = project(p.ra, p.dec);
            if (alt < -1 || !onScreen(x, y)) continue;
            const big = p.body === 'Sun' || p.body === 'Moon';
            const r = big ? 11 : 5.5;
            ctx.beginPath(); ctx.arc(x, y, r + 1.5, 0, 2 * Math.PI); ctx.fillStyle = STYLE.paper; ctx.fill();
            ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI);
            const color = p.body === 'Sun' ? STYLE.sun : p.body === 'Moon' ? STYLE.moon : STYLE.planet;
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = STYLE.star; ctx.lineWidth = 1.2; ctx.stroke();
            if (p.body === 'Sun') { ctx.beginPath(); ctx.arc(x, y, 2, 0, 2 * Math.PI); ctx.fillStyle = STYLE.paper; ctx.fill(); }
            label(p.body, x + r + 5, y, '600 15px -apple-system, "Segoe UI", sans-serif', color);
        }

        // compass points where north / east / south / west run off the edges of the window
        const f = '600 18px -apple-system, "Segoe UI", sans-serif';
        label('N', cx, 66, f, STYLE.cardinal, 'center');
        label('S', cx, H - 70, f, STYLE.cardinal, 'center');
        label('E', 14, cy, f, STYLE.cardinal, 'left');
        label('W', W - 14, cy, f, STYLE.cardinal, 'right');
    }

    // "sky over ..." line with the option to switch to the viewer's own location
    const where = document.getElementById('sky-where');
    const toggle = document.getElementById('sky-toggle');

    function caption() {
        where.textContent = `the sky over ${place.label} right now`;
        toggle.textContent = place === SANTA_CRUZ ? 'show the sky over me' : 'back to Santa Cruz';
    }

    if (toggle) toggle.addEventListener('click', e => {
        e.preventDefault();
        if (place !== SANTA_CRUZ) { place = SANTA_CRUZ; refresh(); return; }
        if (!navigator.geolocation) { where.textContent = "your browser can't share its location"; return; }
        toggle.textContent = 'finding you…';
        navigator.geolocation.getCurrentPosition(
            pos => {
                const { latitude: lat, longitude: lon } = pos.coords;
                place = { lat, lon, label: `you (${lat.toFixed(1)}°, ${lon.toFixed(1)}°)` };
                refresh();
            },
            () => { caption(); where.textContent = "couldn't get your location · " + where.textContent; },
            { timeout: 15000, maximumAge: 600000 }
        );
    });

    function refresh() { draw(); if (where) caption(); }
    refresh();
    setInterval(refresh, 60000);
    window.addEventListener('resize', draw);
})();
