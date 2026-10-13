import type { Page } from '@playwright/test';
type Phase='open'|'transaction'|'commit'|'restore';
declare global {
  interface Window { idbGate:{arm:(phase:Phase)=>void;release:(index?:number)=>void;closeHeldOpen:()=>void;held:number;released:number;transactions:number} }
}
// Delay delivery, retaining native IDB requests, transactions and commit ordering.
export function installIDBGate(initial:Phase|null=null) {
  let next=initial;const pending:Array<()=>void>=[];let heldOpen:IDBDatabase|null=null;
  const gate=window.idbGate={arm:(phase:Phase)=>{next=phase;},release:(index=0)=>{pending.splice(index,1)[0]?.();},closeHeldOpen:()=>heldOpen?.close(),held:0,released:0,transactions:0};
  const hold=(release:()=>void)=>{gate.held++;pending.push(()=>{release();gate.released++;});};
  const open=indexedDB.open.bind(indexedDB);
  indexedDB.open=(...args)=>{
    const request=open(...args);
    if(next==='open'){
      next=null;request.addEventListener('success',event=>{
        event.stopImmediatePropagation();heldOpen=request.result;hold(()=>request.onsuccess?.call(request,event));
      },{once:true});
    }
    return request;
  };
  const transaction=IDBDatabase.prototype.transaction;
  IDBDatabase.prototype.transaction=function(...args){
    const tx=transaction.apply(this,args);
    if(next==='restore'&&args[1]==='readonly'){
      next=null;tx.addEventListener('complete',event=>{event.stopImmediatePropagation();hold(()=>tx.oncomplete?.call(tx,event));},{once:true});
    }
    if(args[1]!=='readwrite')return tx;
    gate.transactions++;
    if(next==='commit'){
      next=null;tx.addEventListener('complete',event=>{event.stopImmediatePropagation();hold(()=>tx.oncomplete?.call(tx,event));},{once:true});
    }else if(next==='transaction'){
      next=null;const store=tx.objectStore('projects'),get=store.get.bind(store);
      store.get=(...values)=>{
        const request=get(...values);
        request.addEventListener('success',event=>{
          event.stopImmediatePropagation();let release=false;
          hold(()=>{release=true;});
          const pulse=()=>{
            const keep=tx.objectStore('meta').get('current');
            keep.onsuccess=()=>{if(release)request.onsuccess?.call(request,event);else pulse();};
          };
          pulse();
        },{once:true});return request;
      };
    }
    return tx;
  };
}
export async function durableCurrent(page:Page) {
  return page.evaluate(async()=>{
    const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('lessonroutes-editor-v1',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    return new Promise<{projectId:string;revision:number;metadata:{title:string}}|null>((resolve,reject)=>{
      const tx=db.transaction(['meta','projects'],'readonly');let result:{projectId:string;revision:number;metadata:{title:string}}|null=null;
      const pointer=tx.objectStore('meta').get('current');pointer.onsuccess=()=>{if(pointer.result){const r=tx.objectStore('projects').get(pointer.result);r.onsuccess=()=>{result=r.result;};}};
      tx.oncomplete=()=>{db.close();resolve(result);};tx.onabort=()=>{db.close();reject(tx.error);};
    });
  });
}
