import type { Project } from '../model/types';
import { SaveCancelled, SaveOwner } from './saveOwner';
export class SaveConflict extends Error { constructor(){super('A newer revision was saved by another tab. Your changes remain in memory. Download a project or save a new copy.');this.name='SaveConflict';} }
type StoredProject = Omit<Project,'assets'> & { assetIds:string[] };
export function openDatabase():Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('lessonroutes-editor-v1',1);let settled=false;
    const fail=(error:Error)=>{settled=true;clearTimeout(timer);reject(error);};
    const timer=setTimeout(()=>fail(new Error('Storage did not open. Continue in memory and download a project backup.')),5000);
    request.onupgradeneeded=()=>{const db=request.result;db.createObjectStore('projects',{keyPath:'projectId'});db.createObjectStore('assets',{keyPath:'id'});db.createObjectStore('meta');};
    request.onblocked=()=>fail(new Error('Browser storage is blocked by another tab. Download a project backup.'));
    request.onerror=()=>fail(request.error??new Error('Browser storage is unavailable.'));
    request.onsuccess=()=>{clearTimeout(timer);const db=request.result;if(settled){db.close();return;}settled=true;db.onversionchange=()=>db.close();resolve(db);};
  });
}
export function saveRevision(db:IDBDatabase,p:Project,expectedRevision:number,owner=new SaveOwner()):Promise<number> {
  return new Promise((resolve,reject)=>{
    if(!owner.current){reject(new SaveCancelled());return;}
    const tx=db.transaction(['projects','assets','meta'],'readwrite'), store=tx.objectStore('projects');
    let reason:Error|null=null, newRevision=expectedRevision+1;
    const cancel=(error:Error)=>{reason=error;try{tx.abort();}catch{cleanup();reject(reason);}};
    const unsubscribe=owner.onRevoke(()=>cancel(new SaveCancelled()));
    const timer=setTimeout(()=>cancel(new Error('Save transaction did not complete. Download a project backup.')),5000);
    const cleanup=()=>{clearTimeout(timer);unsubscribe();};
    tx.oncomplete=()=>{cleanup();resolve(newRevision);}; // Commit, never request.onsuccess.
    tx.onerror=()=>{reason??=tx.error??new Error('Save failed. Download a project backup.');};
    tx.onabort=()=>{cleanup();reject(reason??tx.error??new Error('Save was interrupted. Download a project backup.'));};
    const request=store.get(p.projectId);
    request.onsuccess=()=>{
      try {
      if(!owner.current){cancel(new SaveCancelled());return;}
      const current=request.result as StoredProject|undefined;
      if(current&&current.revision!==expectedRevision){reason=new SaveConflict();tx.abort();return;}
      newRevision=Math.max(current?.revision??expectedRevision,expectedRevision)+1;
      const {assets,...rest}=p;
      store.put({...rest,revision:newRevision,assetIds:assets.map(a=>a.id)});
      // Assets are immutable. IDB owns these snapshots; history keeps references.
      for(const asset of assets)tx.objectStore('assets').put({...asset,id:`${p.projectId}:${asset.id}`,assetId:asset.id});
      for(const id of current?.assetIds??[])if(!assets.some(a=>a.id===id))tx.objectStore('assets').delete(`${p.projectId}:${id}`);
      tx.objectStore('meta').put(p.projectId,'current');
      } catch(error) {reason=error instanceof Error?error:new Error('Storage write failed.');tx.abort();}
    };
  });
}
export async function readCurrent(db:IDBDatabase):Promise<Project|null> {
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(['projects','assets','meta'],'readonly');let result:Project|null=null;
    const timer=setTimeout(()=>{try{tx.abort();}catch{/* Already closed. */}reject(new Error('Browser recovery did not complete. Work in memory and download a project backup.'));},5000);
    tx.onabort=()=>{clearTimeout(timer);reject(tx.error??new Error('Could not read saved project.'));};tx.onerror=()=>{clearTimeout(timer);reject(tx.error??new Error('Could not read saved project.'));};tx.oncomplete=()=>{clearTimeout(timer);resolve(result);};
    const pointer=tx.objectStore('meta').get('current');pointer.onsuccess=()=>{
      if(!pointer.result)return;
      const get=tx.objectStore('projects').get(pointer.result);get.onsuccess=()=>{
        const stored=get.result as StoredProject|undefined;if(!stored)return;
        const {assetIds,...p}=stored;const assets:Project['assets']=Array(assetIds.length);result={...p,assets};
        assetIds.forEach((id,i)=>{const request=tx.objectStore('assets').get(`${p.projectId}:${id}`);request.onsuccess=()=>{const record=request.result;if(!record){tx.abort();return;}const {assetId,...asset}=record;assets[i]={...asset,id:assetId};};});
      };
    };
  });
}
