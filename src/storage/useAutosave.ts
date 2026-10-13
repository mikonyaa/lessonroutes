import { useEffect, useRef, useState } from 'react';
import type { Project } from '../model/types';
import { openDatabase, saveRevision, SaveConflict } from './db';
import { SaveOwner } from './saveOwner';
export type SaveStatus='loading'|'pending'|'saving'|'saved'|'error'|'conflict';
type SaveState={session:number;status:SaveStatus;revision:number;message:string};
type Control={session:number;owner:SaveOwner;revision:number;inFlight:boolean;failed:boolean;savedSnapshot:Project|null};
export function useAutosave(project:Project,session:number,ready:boolean,restored:boolean) {
  const [state,setState]=useState<SaveState>({session,status:'loading',revision:project.revision,message:''});
  const control=useRef<Control>({session,owner:new SaveOwner(),revision:project.revision,inFlight:false,failed:false,savedSnapshot:null});
  const latest=useRef({project,session});latest.current={project,session};
  useEffect(()=>{
    const c:Control={session,owner:new SaveOwner(),revision:project.revision,inFlight:false,failed:false,savedSnapshot:restored?project:null};control.current=c;
    setState({session,status:restored?'saved':'pending',revision:c.revision,message:''});
    return ()=>c.owner.revoke();
    // Each session establishes its own revision and restored snapshot.
  },[session]);
  useEffect(()=>{
    if(!ready)return;
    const c=control.current;
    const owns=()=>c.owner.current&&latest.current.session===c.session;
    if(!owns()||c.failed)return;
    if(project===c.savedSnapshot&&!c.inFlight){setState({session,status:'saved',revision:c.revision,message:''});return;}
    setState({session,status:'pending',revision:c.revision,message:''});let cancelled=false;let timer:ReturnType<typeof setTimeout>;
    async function save() {
      if(cancelled||!owns()||c.failed)return;
      if(c.inFlight){timer=setTimeout(save,100);return;}
      c.inFlight=true;const snapshot=latest.current.project;let db:IDBDatabase|undefined;
      setState({session,status:'saving',revision:c.revision,message:''});
      try {
        db=await openDatabase();
        // Revocation can happen while IDB opens, as well as during the transaction.
        if(!owns())return;
        const revision=await saveRevision(db,snapshot,c.revision,c.owner);c.revision=revision;c.savedSnapshot=snapshot;
        if(owns())setState({session,status:latest.current.project===snapshot?'saved':'pending',revision,message:''});
        if(owns()&&latest.current.project!==snapshot&&!cancelled)timer=setTimeout(save,150);
      } catch(e) {
        if(owns()){c.failed=true;setState({session,status:e instanceof SaveConflict?'conflict':'error',revision:c.revision,message:e instanceof Error?e.message:'Save failed. Download a backup.'});}
      } finally {db?.close();c.inFlight=false;}
    }
    timer=setTimeout(save,500);
    return ()=>{cancelled=true;clearTimeout(timer);};
  },[project,session,ready]);
  // Never render Saved (or a previous session's revision/error) for a new snapshot.
  const current=!ready?{status:'loading' as const,revision:project.revision,message:''}
    :state.session!==session?{status:'pending' as const,revision:project.revision,message:''}
    :state.status==='saved'&&project!==control.current.savedSnapshot?{...state,status:'pending' as const}:state;
  useEffect(()=>{
    if(!ready||current.status==='saved')return;
    const guard=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',guard);return ()=>window.removeEventListener('beforeunload',guard);
  },[current.status,ready]);
  // Called synchronously by the replacement handler, before React schedules a render.
  return {...current,retire:()=>control.current.owner.revoke()};
}
