export class SaveCancelled extends Error {
  constructor(){super('The authoring session changed.');this.name='SaveCancelled';}
}

/** One authoring session owns its saves, including their durable current pointer. */
export class SaveOwner {
  private active=true;
  private listeners=new Set<()=>void>();
  get current(){return this.active;}
  revoke(){
    if(!this.active)return;
    this.active=false;
    for(const cancel of this.listeners)cancel();
    this.listeners.clear();
  }
  onRevoke(cancel:()=>void):()=>void {
    if(!this.active){cancel();return ()=>{};}
    this.listeners.add(cancel);
    return ()=>{this.listeners.delete(cancel);};
  }
}
