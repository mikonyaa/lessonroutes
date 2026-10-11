import { createRoot } from 'react-dom/client';
import { Component, type ReactNode } from 'react';
import { App } from './editor/App';
import './ui/editor.css';
class ErrorBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<main className="app-failure"><h1>The editor encountered a problem.</h1><p>Your last completed autosave remains in this browser. Reload to restore it. Keep manual project backups for recovery.</p><button onClick={()=>location.reload()}>Reload editor</button></main>:this.props.children;}
}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><App/></ErrorBoundary>);
