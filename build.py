# Arma index.html a partir de src/ (plantilla + motor + filtro + catálogo de láminas)
from pathlib import Path
s = Path('src/app.template.html').read_text(encoding='utf-8')
eng = Path('src/engine.js').read_text(encoding='utf-8').replace("if (typeof module !== 'undefined') module.exports = MG;", "")
s = (s.replace('__FILT__', Path('src/filt.json').read_text())
      .replace('__CAT__', Path('src/catalog.json').read_text(encoding='utf-8'))
      .replace('__ENGINE__', eng))
Path('index.html').write_text(s, encoding='utf-8')
print('index.html generado')
