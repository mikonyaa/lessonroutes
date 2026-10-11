export function download(content: string, filename: string, mime: string) {
  const url=URL.createObjectURL(new Blob([content],{type:mime}));
  const a=document.createElement('a'); a.href=url; a.download=filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
