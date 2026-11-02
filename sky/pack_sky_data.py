# packs the d3-celestial star data into sky/sky-data.js for the astrophysics page's star chart.
# usage: python3 pack_sky_data.py <folder with d3-celestial's data/*.json> sky-data.js
# (the data files come from https://cdn.jsdelivr.net/npm/d3-celestial@0.7.35/data/)
import json, sys
src, out = sys.argv[1], sys.argv[2]
L = lambda f: json.load(open(f'{src}/{f}', encoding='utf-8'))
r2 = lambda v: round(v, 2)
ra = lambda lon: r2(lon % 360)

# stars: [ra, dec, magnitude]
S = [[ra(f['geometry']['coordinates'][0]), r2(f['geometry']['coordinates'][1]), f['properties']['mag']]
     for f in L('stars.6.json')['features']]

lines = [[[ra(x), r2(y)] for x, y in seg]
         for f in L('constellations.lines.json')['features'] for seg in f['geometry']['coordinates']]
bounds = [[[ra(x), r2(y)] for x, y in f['geometry']['coordinates'][0]]
          for f in L('constellations.bounds.json')['features']]

# milky way: keep the outline levels, rounded to 0.2 deg and thinned
mw = {}
for f in L('mw.json')['features']:
    polys = []
    for poly in f['geometry']['coordinates']:   # each polygon = outer ring + holes
        rings = []
        for ring in poly:
            pts, last = [], None
            for x, y in ring:
                p = [round((x % 360) * 5) / 5, round(y * 5) / 5]
                if p != last: pts.append(p); last = p
            if len(pts) > 3: rings.append(pts)
        if rings: polys.append(rings)
    mw[f['id']] = polys

dsos = [[ra(f['geometry']['coordinates'][0]), r2(f['geometry']['coordinates'][1])]
        for f in L('dsos.bright.json')['features'] if f['properties']['desig'].startswith('M ')]

data = {'source': 'd3-celestial 0.7.35 (c) 2015 Olaf Frohn, BSD-3-Clause; see LICENSE-d3-celestial.txt',
        'stars': S, 'lines': lines, 'bounds': bounds, 'mw': mw, 'dsos': dsos}
open(out, 'w', encoding='utf-8').write('// star chart data, packed from ' + data['source'] + '\nwindow.SKY_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(len(S), 'stars', len(lines), 'lines', len(bounds), 'bounds', len(dsos), 'messier', {k: len(v) for k, v in mw.items()})
