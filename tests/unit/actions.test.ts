import {describe,it,expect} from 'vitest';
import {fixtureProject} from '../fixtures/lesson';
import type {ScreenNode} from '../../src/model/types';
import {orderedActions,removeAction,reorderAction} from '../../src/model/actions';
import {loadProject,serializeProject,validateStructure} from '../../src/model/load';
import {buildPayload} from '../../src/graph/validate';
import {historyOf,commit,undo,redo} from '../../src/editor/history';

describe('Logical action order, independent of physical array',()=>{
  const permutations=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
  for(const permutation of permutations)for(const id of ['public','private','shared']){
    it(`deletes ${id} from permutation ${permutation.join(',')} without changing other fields`,async()=>{
      const project=fixtureProject(),screen=project.nodes[0] as ScreenNode,logical=orderedActions(screen.actions);
      screen.actions=permutation.map(i=>logical[i]!);const snapshot=structuredClone(project);
      expect(validateStructure(project)).toBe(project);
      const deleted=removeAction(project,screen.id,id),actions=(deleted.nodes[0] as ScreenNode).actions;
      expect(actions.map(a=>a.id)).toEqual(logical.filter(a=>a.id!==id).map(a=>a.id));
      expect(actions.map(a=>a.order)).toEqual([0,1]);
      for(const a of actions){const original=logical.find(b=>b.id===a.id)!;expect({...a,order:original.order}).toEqual(original);}
      expect(deleted.assets).toBe(project.assets);expect(deleted.nodes[1]).toBe(project.nodes[1]);expect(project).toEqual(snapshot);
      expect(await loadProject(serializeProject(deleted),false)).toEqual(deleted);
    });
  }
  it('reorder/delete/undo/redo and payload keep the same semantic order',async()=>{
    const p=fixtureProject(),reordered=reorderAction(p,'screen','shared',-1);
    expect((reordered.nodes[0] as ScreenNode).actions.map(a=>a.id)).toEqual(['public','shared','private']);
    let h=commit(historyOf(p),reordered,'Reorder');h=commit(h,removeAction(h.current,'screen','public'),'Delete');
    const deleted=h.current;
    h=undo(h);expect(h.current).toBe(reordered);h=undo(h);expect(h.current).toBe(p);
    expect(orderedActions((h.current.nodes[0] as ScreenNode).actions).map(a=>a.id)).toEqual(['public','private','shared']);
    h=redo(redo(h));expect(h.current).toBe(deleted);
    const roundtrip=await loadProject(serializeProject(h.current),false);
    expect((buildPayload(roundtrip).payload.nodes[0] as ScreenNode).actions.map(a=>a.id)).toEqual(['shared','private']);
  });
  it('unknown IDs and boundary reorders are no-ops',()=>{
    const p=fixtureProject();expect(removeAction(p,'screen','unknown')).toBe(p);expect(removeAction(p,'finish','public')).toBe(p);
    expect(reorderAction(p,'screen','public',-1)).toBe(p);expect(reorderAction(p,'screen','shared',1)).toBe(p);expect(reorderAction(p,'screen','unknown',1)).toBe(p);
  });
});
