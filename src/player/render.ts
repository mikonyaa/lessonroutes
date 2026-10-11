import type { Payload } from '../model/types';
import { containRect, hitTest, normalizePoint } from '../graph/geometry';
import { initialState, transition, type Input, type Transition } from './machine';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = '') {
  const element = document.createElement(tag); element.textContent = text; element.className = className; return element;
}
export function mountPlayer(root: HTMLElement, payload: Payload): () => void {
  let state = initialState(payload), observer: ResizeObserver | null = null;
  const log: Transition[] = [];
  root.dataset.phase = state.phase; root.dataset.nodeId = state.nodeId; root.dataset.transitions = '[]';
  const shell = el('main','','lr-shell'), top = el('header','','lr-top');
  const brand = el('div','LessonRoutes','lr-wordmark'); brand.append(el('div',payload.metadata.title,'lr-small'));
  const restart = el('button','Restart lesson'); restart.type = 'button';
  top.append(brand,restart); const content = el('section');
  const live = el('div'); live.setAttribute('role','status'); live.setAttribute('aria-live','polite'); live.setAttribute('aria-atomic','true');
  shell.append(top,content,live,el('footer','Practice at your own pace · no scores, no tracking','lr-foot')); root.replaceChildren(shell);
  function apply(input: Input) {
    const next = transition(payload,state,input); if (next === state) return;
    const old = state; state = next;
    log.push({ input:input.type,nodeId:state.nodeId,actionId:input.type==='choose'?input.actionId:old.actionId,phase:state.phase });
    if (log.length > 2000) log.shift();
    root.dataset.transitions = JSON.stringify(log); root.dataset.nodeId = state.nodeId; root.dataset.phase = state.phase;
    root.dispatchEvent(new CustomEvent('lessonroutes:transition',{ detail:log[log.length-1]! }));
    render(input.type !== 'choose' && input.type !== 'outside');
  }
  restart.addEventListener('click',()=>apply({type:'restart'}));
  function render(focusHeading: boolean) {
    observer?.disconnect(); live.replaceChildren(); content.replaceChildren();
    const node = payload.nodes.find(n=>n.id===state.nodeId); if (!node) return;
    const h = el('h1',node.title); h.tabIndex = -1; content.append(h);
    if (node.kind === 'finish') {
      const finish = el('div','','lr-finish'); finish.append(el('p',node.completionText),el('p','Lesson complete. You can restart to practise again.','lr-small')); content.append(finish);
    } else {
      content.append(el('p',node.instruction,'lr-instruction'));
      const asset = payload.assets.find(a=>a.id===node.assetId)!;
      const stage = el('div','','lr-stage'), wrap = el('div','','lr-image-wrap'), image = el('img');
      image.src = `data:${asset.mime};base64,${asset.base64}`; image.alt = node.imageDescription;
      wrap.append(image);
      const actions = [...node.actions].sort((a,b)=>a.order-b.order);
      for (const action of actions) {
        const region = el('span',String(action.order+1),'lr-hotspot'); region.setAttribute('aria-hidden','true');
        Object.assign(region.style,{left:`${action.rect.x*100}%`,top:`${action.rect.y*100}%`,width:`${action.rect.width*100}%`,height:`${action.rect.height*100}%`}); wrap.append(region);
      }
      stage.append(wrap); content.append(stage,el('p',node.imageDescription,'lr-image-description'),el('p','Choose an action','lr-small'));
      const list = el('ul','','lr-actions');
      for (const action of actions) {
        const li = el('li'), button = el('button',`${action.order+1}. ${action.label}`);
        button.type = 'button'; button.dataset.actionId=action.id; button.disabled=state.phase!=='showingNode';
        button.addEventListener('click',()=>apply({type:'choose',actionId:action.id})); li.append(button); list.append(li);
      }
      content.append(list);
      wrap.addEventListener('click',event=>{
        if (state.phase!=='showingNode') return;
        const point = normalizePoint(event.clientX,event.clientY,image.getBoundingClientRect());
        const action = hitTest(actions,point.x,point.y); apply(action?{type:'choose',actionId:action.id}:{type:'outside'});
      });
      const resize = () => {
        const box = containRect({width:stage.clientWidth-2,height:stage.clientHeight-2},{width:asset.pixelWidth,height:asset.pixelHeight});
        wrap.style.width=`${box.width}px`; wrap.style.height=`${box.height}px`;
      };
      observer = new ResizeObserver(resize); observer.observe(stage); resize();
    }
    if (state.phase==='showingFeedback') {
      const panel=el('div','','lr-feedback'), text=el('p',state.feedback), button=el('button','Continue','lr-primary'); button.type='button';
      panel.append(text,button); live.append(panel);
      button.addEventListener('click',()=>apply({type:'continue'})); button.focus();
    } else if (focusHeading) h.focus();
  }
  render(true);
  return ()=>{observer?.disconnect();root.replaceChildren();};
}
