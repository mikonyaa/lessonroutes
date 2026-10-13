import {beforeEach,afterEach,describe,expect,it,vi} from 'vitest';
import {IDBFactory,IDBObjectStore} from 'fake-indexeddb';
import {openDatabase,readCurrent,saveRevision,SaveConflict} from '../../src/storage/db';
import {newProject} from '../../src/model/types';
import {SaveCancelled,SaveOwner} from '../../src/storage/saveOwner';
import {fixtureProject} from '../fixtures/lesson';
beforeEach(()=>{vi.stubGlobal('indexedDB',new IDBFactory());});afterEach(()=>{vi.restoreAllMocks();vi.useRealTimers();vi.unstubAllGlobals();});
describe('Atomic IndexedDB revisions',()=>{
  it('rejects a retired owner before starting any transaction',async()=>{
    const db=await openDatabase(),owner=new SaveOwner();owner.revoke();const transaction=vi.spyOn(db,'transaction');
    await expect(saveRevision(db,newProject(),0,owner)).rejects.toBeInstanceOf(SaveCancelled);expect(transaction).not.toHaveBeenCalled();db.close();
  });
  it('revocation aborts project, assets and current together after put success',async()=>{
    const db=await openDatabase(),old=fixtureProject('Existing'),p=fixtureProject('Retired'),owner=new SaveOwner();await saveRevision(db,old,0);
    const native=db.transaction.bind(db);vi.spyOn(db,'transaction').mockImplementation((...args)=>{
      const tx=native(...args);if(args[1]!=='readwrite')return tx;const store=tx.objectStore('projects'),put=store.put.bind(store);
      vi.spyOn(store,'put').mockImplementation((...values)=>{const request=put(...values);request.addEventListener('success',()=>owner.revoke());return request;});return tx;
    });
    await expect(saveRevision(db,p,0,owner)).rejects.toBeInstanceOf(SaveCancelled);expect(await readCurrent(db)).toEqual({...old,revision:1});
    const stored=await new Promise((resolve,reject)=>{const tx=db.transaction(['projects','assets'],'readonly'),records:{projects:unknown[];assets:unknown[]}={projects:[],assets:[]};for(const key of ['projects','assets'] as const){const r=tx.objectStore(key).getAll();r.onsuccess=()=>records[key]=r.result;}tx.oncomplete=()=>resolve(records);tx.onabort=()=>reject(tx.error);});
    expect(stored).toMatchObject({projects:[{projectId:old.projectId}],assets:[{id:`${old.projectId}:image`}]});db.close();
  });
  it('keeps asset bytes scoped to each project and removes only its own unused assets',async()=>{
    const db=await openDatabase(),a=fixtureProject('A'),b=fixtureProject('B');await saveRevision(db,a,0);await saveRevision(db,b,0);
    const bDraft={...b,nodes:[],orderedNodeIds:[],startNodeId:null,assets:[]};await saveRevision(db,bDraft,1);
    const retained=await new Promise<unknown[]>(resolve=>{const tx=db.transaction('assets','readonly'),r=tx.objectStore('assets').getAll();tx.oncomplete=()=>resolve(r.result);});
    expect(retained).toEqual([{...a.assets[0],id:`${a.projectId}:image`,assetId:'image'}]);await saveRevision(db,a,1);
    expect(await readCurrent(db)).toEqual({...a,revision:2});db.close();
  });
  it('commits revisions and restores the saved project',async()=>{const db=await openDatabase(),p=newProject();expect(await saveRevision(db,p,0)).toBe(1);expect(await readCurrent(db)).toEqual({...p,revision:1});db.close();});
  it('compares revision inside the transaction across two connections',async()=>{const a=await openDatabase(),b=await openDatabase(),p=newProject();await saveRevision(a,p,0);await expect(saveRevision(b,{...p,metadata:{...p.metadata,title:'stale tab'}},0)).rejects.toBeInstanceOf(SaveConflict);expect((await readCurrent(a))?.metadata.title).toBe('Untitled lesson');a.close();b.close();});
  it('does not resolve on put success if the transaction subsequently aborts',async()=>{const db=await openDatabase(),p=newProject(),native=db.transaction.bind(db);vi.spyOn(db,'transaction').mockImplementation((...args)=>{const tx=native(...args);const put=tx.objectStore('projects').put.bind(tx.objectStore('projects'));vi.spyOn(tx.objectStore('projects'),'put').mockImplementation((...values)=>{const request=put(...values);request.addEventListener('success',()=>tx.abort());return request;});return tx;});await expect(saveRevision(db,p,0)).rejects.toThrow(/interrupted|failed/i);expect(await readCurrent(db)).toBeNull();db.close();});
  it('rejects quota failures, with no partial project commit',async()=>{const db=await openDatabase();const spy=vi.spyOn(IDBObjectStore.prototype,'put').mockImplementation(()=>{throw new DOMException('Synthetic quota exceeded','QuotaExceededError');});await expect(saveRevision(db,newProject(),0)).rejects.toThrow('quota');spy.mockRestore();expect(await readCurrent(db)).toBeNull();db.close();});
  it('does not report saved before a transaction completes; times out instead',async()=>{const db=await openDatabase(),native=db.transaction.bind(db);vi.spyOn(db,'transaction').mockImplementation((...args)=>{const tx=native(...args);return new Proxy(tx,{set(target,key,value){if(key==='oncomplete')return true;Reflect.set(target,key,value);return true;},get(target,key){const v=Reflect.get(target,key);return typeof v==='function'?v.bind(target):v;}});});let saved=false;const result=saveRevision(db,newProject(),0).then(()=>{saved=true;});const rejected=expect(result).rejects.toThrow('did not complete');await new Promise(r=>setTimeout(r,30));expect(saved).toBe(false);await rejected;expect(saved).toBe(false);db.close();},8000);
});
