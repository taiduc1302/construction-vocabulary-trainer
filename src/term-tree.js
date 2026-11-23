/** Vocabulary concept trees: typed, source-backed relationships, not an invented hierarchy. */
const GROUPS={
  parts:'Parts, layers and features',
  methods:'Construction and temporary works',
  coordination:'Services, interfaces and design checks'
};
const escapeHtml=(value='')=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const termLink=id=>'term.html?term='+encodeURIComponent(id);

export function validateTermTrees(graph,terms=[]){
  const errors=[];
  if(!graph||graph.version!==1||!Array.isArray(graph.families))return ['Expected version 1 vocabulary families'];
  const known=new Set((Array.isArray(terms)?terms:[]).map(term=>term.id));
  const familyIds=new Set();
  for(const family of graph.families){
    if(!family?.id||familyIds.has(family.id))errors.push('Missing/duplicate family id '+family?.id);
    familyIds.add(family.id);
    if(typeof family.title!=='string'||!family.title.trim())errors.push(family.id+' missing title');
    if(typeof family.description!=='string'||family.description.trim().length<12)errors.push(family.id+' needs description');
    const nodes=Array.isArray(family.nodes)?family.nodes:[];
    const connections=Array.isArray(family.connections)?family.connections:[];
    if(nodes.length===0)errors.push(family.id+' has no nodes');
    const owners=new Map();
    for(const node of nodes){
      if(!node?.id||owners.has(node.id))errors.push(family.id+' has duplicate/invalid node '+node?.id);
      owners.set(node?.id,node);
      if(!known.has(node?.id))errors.push(family.id+' unknown node '+node?.id);
      if(typeof node?.facet!=='string'||!node.facet.trim())errors.push(family.id+' missing facet for '+node?.id);
    }
    if(!owners.has(family.root))errors.push(family.id+' root does not exist');
    for(const node of nodes){
      if(node.id===family.root&&node.parent!==null)errors.push(family.id+' root must have null parent');
      if(node.id!==family.root&&(!node.parent||!owners.has(node.parent)))errors.push(family.id+' invalid parent '+node.id);
      const visited=new Set([node.id]);
      let current=node;
      while(current?.parent){
        if(visited.has(current.parent)){errors.push(family.id+' cycle at '+node.id);break}
        visited.add(current.parent);
        current=owners.get(current.parent);
        if(!current)break;
      }
      if(current&&current.id!==family.root)errors.push(family.id+' disconnected node '+node.id);
    }
    const seenConnections=new Set();
    for(const conn of connections){
      if(!owners.has(conn?.owner))errors.push(family.id+' invalid relationship owner '+conn?.owner);
      if(!known.has(conn?.id))errors.push(family.id+' unknown related term '+conn?.id);
      if(!Object.hasOwn(GROUPS,conn?.group))errors.push(family.id+' invalid relationship group '+conn?.group);
      if(typeof conn?.label!=='string'||!conn.label.trim())errors.push(family.id+' missing connection label '+conn?.id);
      const key=conn.owner+'|'+conn.id+'|'+conn.group;
      if(seenConnections.has(key))errors.push(family.id+' duplicate connection '+key);
      seenConnections.add(key);
    }
  }
  return errors;
}
export function familiesForTerm(graph,termId){
  if(!graph?.families||!termId)return [];
  return graph.families.filter(f=>f.nodes?.some(n=>n.id===termId)||f.connections?.some(c=>c.id===termId));
}

function renderFamily(family,termsById,selectedId){
  const nodes=new Map(family.nodes.map(node=>[node.id,node]));
  const children=new Map(family.nodes.map(node=>[node.id,[]]));
  for(const node of family.nodes)if(node.parent&&children.has(node.parent))children.get(node.parent).push(node.id);
  const renderBranch=id=>{
    const item=nodes.get(id);if(!item)return '';
    const name=termsById.get(id)?.term||id;
    const active=id===selectedId;
    const kids=children.get(id)||[];
    return '<li class="term-tree-item"><div class="term-tree-node'+(active?' is-current':'')+'">'+
      '<a href="'+termLink(id)+'"'+(active?' aria-current="page"':'')+'>'+escapeHtml(name)+'</a>'+
      '<span class="term-tree-facet">'+escapeHtml(item.facet)+'</span></div>'+
      (kids.length?'<ul class="term-tree-branches">'+kids.map(renderBranch).join('')+'</ul>':'')+
      '</li>';
  };
  const selectedNode=nodes.get(selectedId);
  const owners=new Set([family.root]);
  if(selectedNode){
    let parent=selectedNode;
    while(parent){owners.add(parent.id);parent=nodes.get(parent.parent)}
  }else{
    for(const conn of family.connections)if(conn.id===selectedId)owners.add(conn.owner);
  }
  const relevant=family.connections.filter(c=>owners.has(c.owner));
  const sections=Object.entries(GROUPS).map(([group,title])=>{
    const items=relevant.filter(c=>c.group===group);
    if(!items.length)return '';
    return '<div class="term-tree-connection-group"><h4>'+title+'</h4><ul class="term-tree-connection-list">'+
      items.map(item=>{
        const name=termsById.get(item.id)?.term||item.id;
        return '<li'+(item.id===selectedId?' class="is-current"':'')+'><a href="'+termLink(item.id)+'"'+(item.id===selectedId?' aria-current="page"':'')+'>'+escapeHtml(name)+'</a>'+
          '<span>'+escapeHtml(item.label)+'</span></li>';
      }).join('')+'</ul></div>';
  }).join('');
  return '<section class="term-tree-family" aria-label="'+escapeHtml(family.title)+'">'+
    '<h3>'+escapeHtml(family.title)+'</h3>'+
    '<p class="term-tree-description">'+escapeHtml(family.description)+'</p>'+
    '<div class="term-tree-scroll" role="region" tabindex="0" aria-label="'+escapeHtml(family.title)+' types and variations">'+
      '<ul class="term-tree-branches term-tree-root">'+renderBranch(family.root)+'</ul>'+
    '</div>'+
    (sections?'<div class="term-tree-connections"><h3>Parts and associated work</h3>'+sections+'</div>':'')+
    '</section>';
}
/** Render only when a term has a curated relationship (node or typed associated term). */
export function renderTermTrees(graph,terms,selectedId){
  const errors=validateTermTrees(graph,terms);
  if(errors.length)throw new Error('Invalid concept trees: '+errors.slice(0,4).join('; '));
  const families=familiesForTerm(graph,selectedId);
  if(!families.length)return '';
  const map=new Map(terms.map(term=>[term.id,term]));
  return '<section class="term-tree-explorer" aria-labelledby="termTreeTitle">'+
    '<h2 id="termTreeTitle">Explore the term tree</h2>'+
    '<p class="term-tree-intro">Follow the branches to compare types. Parts, optional features and work methods are shown separately. Tap any term to open its explanation.</p>'+
    families.map(f=>renderFamily(f,map,selectedId)).join('')+
    '<p class="term-tree-caution">'+escapeHtml(graph.note||'Verify project drawings and specifications for applicability.')+'</p>'+
    '</section>';
}
