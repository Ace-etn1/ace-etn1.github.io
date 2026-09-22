"""Build self-contained, textured SVG illustrations for the expertise section."""
from pathlib import Path

DEST = Path(__file__).resolve().parents[1] / 'assets' / 'images' / 'celestial'
DEST.mkdir(parents=True, exist_ok=True)

def planet(name, base, terrain, seed, ring=False):
    radius = 150 if ring else 194
    defs = f'''
    <clipPath id="disc"><circle cx="256" cy="256" r="{radius}"/></clipPath>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency=".025 .045" numOctaves="5" seed="{seed}"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="linear" slope=".1"/></feComponentTransfer>
    </filter>
    <filter id="weather" x="-30%" y="-30%" width="160%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency=".014 .022" numOctaves="3" seed="{seed+2}" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <linearGradient id="night" x1="0" y1=".2" x2="1" y2=".75">
      <stop stop-color="#fff8e9" stop-opacity=".12"/><stop offset=".52" stop-color="#06111b" stop-opacity="0"/>
      <stop offset=".7" stop-color="#071525" stop-opacity=".08"/><stop offset=".72" stop-color="#071525" stop-opacity=".34"/>
      <stop offset="1" stop-color="#02050c" stop-opacity=".76"/>
    </linearGradient>
    <radialGradient id="limb" cx=".43" cy=".4" r=".6">
      <stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset=".91" stop-color="#000914" stop-opacity=".25"/>
      <stop offset="1" stop-color="#000714" stop-opacity=".65"/>
    </radialGradient>
    <radialGradient id="air"><stop offset=".925" stop-color="#91cae6" stop-opacity="0"/>
      <stop offset=".972" stop-color="#8db8ce" stop-opacity=".26"/><stop offset="1" stop-color="#8cb4c8" stop-opacity="0"/></radialGradient>
    '''
    rings = ''.join(f'<ellipse cx="256" cy="256" rx="{r}" ry="{r*.29}" fill="none" stroke="{color}" stroke-width="{width}" opacity="{opacity}"/>' for r,color,width,opacity in [(213,'#968674',45,.55),(212,'#d6c6a8',24,.8),(194,'#776e62',5,.6),(235,'#a59882',3,.7),(221,'#f2e2c4',2,.8),(207,'#6e665b',3,.55)])
    ring_back = f'<g transform="rotate(-25 256 256)">{rings}</g>' if ring else ''
    ring_front = f'<g transform="rotate(-25 256 256)" clip-path="url(#front)">{rings}</g>' if ring else ''
    if ring: defs += '<clipPath id="front"><path d="M0 265H512V512H0Z"/></clipPath>'
    if name in ('ringed', 'gas', 'ice'):
        terrain += '<g opacity=".22" filter="url(#weather)">' + ''.join(f'<path d="M50 {y}Q230 {y+13} 462 {y-4}" fill="none" stroke="{"#fff5df" if y%2 else "#283740"}" stroke-width="{1+y%3}"/>' for y in range(70,445,7)) + '</g>'
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs>{defs}</defs>{ring_back}
    <circle cx="256" cy="256" r="{radius+7}" fill="url(#air)"/>
    <g clip-path="url(#disc)"><circle cx="256" cy="256" r="{radius}" fill="{base}"/>
    {terrain}<rect x="50" y="50" width="412" height="412" filter="url(#grain)" style="mix-blend-mode:soft-light"/>
    <circle cx="256" cy="256" r="{radius}" fill="url(#night)"/>
    <circle cx="256" cy="256" r="{radius}" fill="url(#limb)"/>
    <ellipse cx="{205 if ring else 190}" cy="{185 if ring else 172}" rx="{54 if ring else 70}" ry="{24 if ring else 30}" fill="#fff" opacity=".16" transform="rotate(-27 190 172)"/></g>
    <circle cx="256" cy="256" r="{radius}" fill="none" stroke="#102638" stroke-width="9" opacity=".9"/>{ring_front}</svg>'''
    (DEST / f'{name}.svg').write_text(svg, encoding='utf-8')

earth = '''<g filter="url(#weather)">
    <path fill="#78816a" d="M84 121L132 92 170 111 178 155 213 173 204 205 229 226 202 263 174 252 167 218 133 214 116 174 89 161Z M206 256L248 271 267 304 246 341 238 379 211 407 197 363 204 328 185 295Z M308 87L394 111 433 151 417 180 380 183 362 224 338 217 319 180 283 174 285 142Z M334 229L373 243 396 294 376 348 349 344 320 296Z"/>
    <path fill="#c6b08a" opacity=".7" d="M329 225L365 236 382 262 359 278 331 258Z M142 140L169 135 182 169 157 180Z"/>
    <g fill="none" stroke="#f2f6f3" stroke-linecap="round">
    <path stroke-width="12" opacity=".66" d="M76 185Q165 128 257 158T442 206M80 337Q187 359 257 318T440 289"/>
    <path stroke-width="5" opacity=".82" d="M97 196Q169 149 247 177T434 223M101 355Q169 380 223 351M278 282Q341 216 403 249"/>
    <path stroke-width="17" opacity=".55" d="M95 100Q229 63 375 103M148 426Q255 459 365 417"/>
    <path stroke-width="4" opacity=".7" d="M217 212C281 161 312 248 273 260C244 269 232 230 265 225"/>
    </g></g>'''
planet('ocean', '#275c81', earth, 12)

def bands(colors, start, step):
    return '<g filter="url(#weather)">' + ''.join(f'<path d="M45 {start+i*step}Q247 {start+i*step+25} 467 {start+i*step-6}" fill="none" stroke="{c}" stroke-width="{step+3}"/>' for i,c in enumerate(colors)) + '</g>'

planet('ringed', '#b5a58c', bands(['#8d8276','#d2c4a7','#ad9a7f','#d9caab','#8f8472','#c4b293','#d4c3a5','#a5957d','#bca58a','#8d8278','#cfbea0'],100,28), 21, True)
planet('gas', '#bba58f', bands(['#b9a897','#ddd0bd','#9b7760','#d3bea1','#e2d4bd','#a0775d','#d0b69a','#eee0c9','#997560','#bea389','#e0ceb0','#a18570'],64,32) + '<g filter="url(#weather)"><ellipse cx="201" cy="310" rx="47" ry="21" fill="#9c624a"/><ellipse cx="200" cy="308" rx="32" ry="12" fill="#bd8664"/><path d="M159 307Q202 289 242 307" fill="none" stroke="#e1b48b" stroke-width="4"/></g>', 32)
planet('ice', '#477da4', bands(['#7cabbf','#6b9db6','#4b799c','#719eb8','#85b0c1','#3c7098','#5b90ae','#719fb9','#3f7499','#699cba','#7daac0','#4b7d9e'],66,32) + '<g filter="url(#weather)"><ellipse cx="189" cy="285" rx="37" ry="14" fill="#254d75" opacity=".8"/><path d="M147 277Q198 253 236 273M246 172Q294 159 334 170" fill="none" stroke="#d1e1e5" stroke-width="5" opacity=".65"/></g>', 44)

import random
rng = random.Random(71)
craters = []
for _ in range(90):
    x,y = rng.uniform(63,449),rng.uniform(63,449)
    r = rng.uniform(2,14)
    craters.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="#666a6b" fill-opacity=".25" stroke="#e5e3dc" stroke-opacity=".35" stroke-width="2"/><path d="M{x-r:.1f} {y:.1f}a{r:.1f} {r:.1f} 0 0 1 {r*2:.1f} 0" fill="none" stroke="#454b4e" stroke-opacity=".5" stroke-width="2"/>')
planet('moon', '#b4b6b3', '<g filter="url(#weather)" opacity=".42"><ellipse cx="183" cy="181" rx="76" ry="64" fill="#616c73"/><ellipse cx="300" cy="287" rx="60" ry="81" fill="#778087"/><ellipse cx="157" cy="330" rx="46" ry="49" fill="#646d73"/></g>' + ''.join(craters), 53)
print('Built five local celestial SVG assets.')
