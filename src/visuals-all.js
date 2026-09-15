import {renderTermVisual as renderCoreVisual} from './visuals.js';
import {renderExtraVisual} from './visuals-extra.js';

function hideQuizLabels(html){
  return html
    .replace(/<text\b[^>]*>[\s\S]*?<\/text>/gi,'')
    .replace(/aria-label="[^"]*"/gi,'aria-label="Construction vocabulary diagram"')
    .replace(/<figcaption>[\s\S]*?<\/figcaption>/i,'<figcaption>Identify the construction term shown.</figcaption>');
}

export function renderTermVisual(term,{quiz=false}={}){
  const html=renderExtraVisual(term)||renderCoreVisual(term);
  return quiz?hideQuizLabels(html):html;
}
