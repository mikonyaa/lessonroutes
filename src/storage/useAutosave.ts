import { useEffect, useRef, useState } from 'react';
import type { Project } from '../model/types';
import { openDatabase, saveRevision, SaveConflict } from './db';
export type SaveStatus='loading'|'pending'|'saving'|'saved'|'error'|'conflict';
export function useAutosave(project:Project,session:number,ready:boolean,restored:boolean) {
  const [state,setState]=useState<{status:SaveStatus;revision:number;message:string}>({status:'loading',revision:project.revision,message:''});
  const control=useRef<{session:number;revision:number;inFlight:boolean;failed:boolean;disposed:boolean;savedSnapshot:Project|null}>({session,revision:project.revision,inFlight:false,failed:false,disposed:false,savedSnapshot:null});
  const latest=useRef(project);latest.current=project;
  useEffect(()=>{
    const c={session,revision:project.revision,inFlight:false,failed:false,disposed:false,savedSnapshot:restored?project:null};control.current=c;
    setState({status:restored?'saved':'pending',revision:c.revision,message:''});
    return ()=>{c.disposed=true;};
    // A new authoring session establishes the imported/restored revision.
  },[session]);
  useEffect(()=>{
    if(!ready)return;
    const c=control.current;if(c.failed)return;
    if(project===c.savedSnapshot){setState({status:'saved',revision:c.revision,message:''});return;}
    setState(s=>({...s,status:'pending'}));let cancelled=false;let timer:ReturnType<typeof setTimeout>;
    async function save() {
      if(cancelled||c.disposed||c.failed)return;
      if(c.inFlight){timer=setTimeout(save,100);return;}
      c.inFlight=true;const snapshot=latest.current;let db:IDBDatabase|undefined;
      setState({status:'saving',revision:c.revision,message:''});
      try {
        db=await openDatabase();const revision=await saveRevision(db,snapshot,c.revision);c.revision=revision;c.savedSnapshot=snapshot;
        if(!c.disposed)setState({status:latest.current===snapshot?'saved':'pending',revision,message:''});
        if(!c.disposed&&latest.current!==snapshot&&!cancelled)timer=setTimeout(save,150);
      } catch(e) {
        c.failed=true;if(!c.disposed)setState({status:e instanceof SaveConflict?'conflict':'error',revision:c.revision,message:e instanceof Error?e.message:'Save failed. Download a backup.'});
      } finally {db?.close();c.inFlight=false;}
    }
    timer=setTimeout(save,500);
    return ()=>{cancelled=true;clearTimeout(timer);};
  },[project,session,ready]);
  useEffect(()=>{
    if(!ready||state.status==='saved')return;
    const guard=(e:BeforeUnloadEvent)=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',guard);return ()=>window.removeEventListener('beforeunload',guard);
  },[state.status,ready]);
  return state;
}
