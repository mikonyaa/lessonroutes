import { mountPlayer } from './render';
import type { Payload } from '../model/types';
const data = document.getElementById('lesson-data'), root = document.getElementById('lesson-root');
if (data && root) {
  try {
    mountPlayer(root,JSON.parse(data.textContent || '') as Payload);
    // A sandboxed preview gets focus only after its parent dialog has opened.
    // The sole accepted message requests heading focus, never a transition/data edit.
    window.addEventListener('message',event=>{
      if(window.parent!==window&&event.source===window.parent&&event.data==='lessonroutes:focus-heading') {
        // WebKit finalizes frame focus after load/message delivery. Wait for its
        // layout frames, then focus only a node, never interrupt pending feedback.
        requestAnimationFrame(()=>requestAnimationFrame(()=>{
          if(root.dataset.phase!=='showingFeedback')root.querySelector('h1')?.focus();
        }));
      }
    });
  }
  catch { root.textContent='This lesson could not be opened. Ask its author for a fresh export.'; }
}
