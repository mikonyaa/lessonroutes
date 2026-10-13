import { useLayoutEffect, useRef, type ReactNode } from 'react';
export function Modal({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children:ReactNode;wide?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  useLayoutEffect(()=>{const previous=document.activeElement,dialog=ref.current;dialog?.showModal();return ()=>{dialog?.close();if(previous instanceof HTMLElement&&previous.isConnected)previous.focus();};},[]);
  return <dialog ref={ref} className={wide?'modal wide':'modal'} onCancel={onClose} aria-label={title}>
    <div className="modal-header"><h2>{title}</h2><button onClick={onClose} aria-label="Close dialog">×</button></div>{children}
  </dialog>;
}
